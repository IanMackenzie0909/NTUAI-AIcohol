import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import handler from '../api/register.js';

const originalFetch = globalThis.fetch;
const originalError = console.error;
const originalWarn = console.warn;
const originalSetTimeout = globalThis.setTimeout;
const originalGasUrl = process.env.GAS_SCRIPT_URL;
const originalApiKey = process.env.API_KEY;
let errors;
let waits;

beforeEach(() => {
    process.env.GAS_SCRIPT_URL = 'https://example.test/exec';
    process.env.API_KEY = 'unit-test-shared-secret';
    errors = [];
    waits = [];
    globalThis.setTimeout = (callback, milliseconds) => {
        waits.push(milliseconds);
        queueMicrotask(callback);
    };
    console.error = (...args) => errors.push(args);
    console.warn = () => {};
});

afterEach(() => {
    globalThis.fetch = originalFetch;
    console.error = originalError;
    console.warn = originalWarn;
    globalThis.setTimeout = originalSetTimeout;
    if (originalGasUrl === undefined) delete process.env.GAS_SCRIPT_URL;
    else process.env.GAS_SCRIPT_URL = originalGasUrl;
    if (originalApiKey === undefined) delete process.env.API_KEY;
    else process.env.API_KEY = originalApiKey;
});

async function submit(extra = {}) {
    const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
    };
    await handler({
        method: 'POST',
        body: { name: 'Test Guest', phone: '0900000000', email: 'test@example.test', role: 'student', ...extra },
    }, res);
    return res;
}

test('accepts the actual GAS success response and uses the server secret', async () => {
    let forwarded;
    const tableQuestions = '【創新創業家】如何驗證第一個產品需求？\n【AI 產品實踐】如何評估 AI 功能的商業價值？';
    const pastBackground = '曾主修資訊管理。\n有兩年產品助理工作經驗。';
    globalThis.fetch = async (_url, options) => {
        forwarded = JSON.parse(options.body);
        return Response.json({ status: 'success', message: 'Saved' });
    };
    const res = await submit({ apiKey: 'client-override', role: 'unemployed', table_questions: tableQuestions, past_background: pastBackground });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { ok: true });
    assert.equal(forwarded.apiKey, 'unit-test-shared-secret');
    assert.equal(forwarded.table_questions, tableQuestions);
    assert.equal(forwarded.role, 'unemployed');
    assert.equal(forwarded.past_background, pastBackground);
});

test('requires a nonempty background for unemployed applicants before forwarding to GAS', async () => {
    globalThis.fetch = async () => assert.fail('Invalid registrations must not contact GAS');
    for (const past_background of [undefined, '', ' \n ', 42]) {
        const res = await submit({ role: 'unemployed', past_background });
        assert.equal(res.statusCode, 400);
        assert.match(res.body.error, /past_background/);
    }
});

test('keeps professional and recent graduate roles compatible without a past background', async () => {
    for (const role of ['professional', 'recent_graduate']) {
        let forwarded;
        globalThis.fetch = async (_url, options) => {
            forwarded = JSON.parse(options.body);
            return Response.json({ status: 'success' });
        };
        assert.equal((await submit({ role })).statusCode, 200);
        assert.equal(forwarded.role, role);
    }
});

test('rejects an application error even when GAS responds with HTTP 200', async () => {
    globalThis.fetch = async () => Response.json({ status: 'error', message: 'API KEY 錯誤' });
    const res = await submit();
    assert.equal(res.statusCode, 502);
    assert.equal(res.body.ok, undefined);
    assert.equal(errors[0][1].reason, 'gas_rejected');
    assert.equal(res.body.submissionStatus, 'unknown');
});

test('rejects HTML or an unexpected JSON response instead of reporting success', async () => {
    globalThis.fetch = async () => new Response('<html>Sign in</html>', { status: 200 });
    assert.equal((await submit()).statusCode, 502);
    globalThis.fetch = async () => Response.json({ message: 'No confirmed write' });
    assert.equal((await submit()).statusCode, 502);
});

test('preserves failure handling for an upstream HTTP 401', async () => {
    globalThis.fetch = async () => new Response('Unauthorized', { status: 401 });
    assert.equal((await submit()).statusCode, 502);
});

test('keeps a saved registration successful when only the confirmation email fails', async () => {
    globalThis.fetch = async () => Response.json({ status: 'success', mailSent: false });
    assert.equal((await submit()).statusCode, 200);
});

test('does not disclose the shared secret in upstream error logs or the client response', async () => {
    globalThis.fetch = async () => Response.json({ status: 'error', message: 'Rejected unit-test-shared-secret' });
    const res = await submit();
    assert.ok(!JSON.stringify(errors).includes('unit-test-shared-secret'));
    assert.ok(!JSON.stringify(res.body).includes('unit-test-shared-secret'));
});

const resultUrl = 'https://script.googleusercontent.com/macros/echo?user_content_key=result-token&lib=test-lib';

test('retrieves the ContentService response with a body-free GET after one POST', async () => {
    const requests = [];
    globalThis.fetch = async (url, options) => {
        requests.push({ url, options });
        return requests.length === 1
            ? new Response(null, { status: 302, headers: { location: resultUrl } })
            : Response.json({ status: 'success' });
    };
    assert.equal((await submit()).statusCode, 200);
    assert.equal(requests.length, 2);
    assert.equal(requests[0].options.method, 'POST');
    assert.equal(requests[0].options.redirect, 'manual');
    assert.equal(requests[1].url, resultUrl);
    assert.equal(requests[1].options.method, 'GET');
    assert.equal(requests[1].options.redirect, 'manual');
    assert.equal(requests[1].options.body, undefined);
    assert.equal(requests[1].options.headers, undefined);
    assert.deepEqual(waits, []);
});

test('recovers from temporary result 404s without repeating the registration POST', async () => {
    const requests = [];
    globalThis.fetch = async (url, options) => {
        requests.push({ url, method: options.method });
        if (requests.length === 1) return new Response(null, { status: 303, headers: { location: resultUrl } });
        if (requests.length <= 3) return new Response('Not ready', { status: 404 });
        return Response.json({ status: 'success' });
    };
    const res = await submit();
    assert.deepEqual(res.body, { ok: true });
    assert.deepEqual(requests.map(request => request.method), ['POST', 'GET', 'GET', 'GET']);
    assert.ok(requests.slice(1).every(request => request.url === resultUrl));
    assert.deepEqual(waits, [1000, 2000]);
});

test('bounds result 404 retries and reports an unknown outcome without exposing the token', async () => {
    const requests = [];
    const failedBodies = [];
    globalThis.fetch = async (url, options) => {
        requests.push({ url, method: options.method });
        if (requests.length === 1) return new Response(null, { status: 302, headers: { location: resultUrl } });
        const response = new Response('Missing', { status: 404 });
        failedBodies.push(response);
        return response;
    };
    const res = await submit();
    assert.equal(res.statusCode, 502);
    assert.equal(res.body.code, 'REGISTRATION_UNCONFIRMED');
    assert.equal(res.body.submissionStatus, 'unknown');
    assert.deepEqual(requests.map(request => request.method), ['POST', 'GET', 'GET', 'GET', 'GET']);
    assert.deepEqual(waits, [1000, 2000, 3000]);
    assert.ok(failedBodies.every(response => response.bodyUsed));
    assert.equal(errors[0][1].stage, 'result');
    assert.equal(errors[0][1].status, 404);
    assert.equal(errors[0][1].responseAttempts, 4);
    assert.ok(!JSON.stringify({ errors, response: res.body }).includes('result-token'));
});

test('does not retry an initial POST 404, a failed POST, or a non-404 result error', async () => {
    for (const scenario of ['post-404', 'post-timeout', 'result-403']) {
        const methods = [];
        globalThis.fetch = async (_url, options) => {
            methods.push(options.method);
            if (scenario === 'post-timeout') throw new DOMException('Timeout with a secret URL', 'TimeoutError');
            if (scenario === 'post-404') return new Response('Missing', { status: 404 });
            return methods.length === 1
                ? new Response(null, { status: 302, headers: { location: resultUrl } })
                : new Response('Forbidden', { status: 403 });
        };
        const res = await submit();
        assert.equal(res.statusCode, 502);
        assert.equal(res.body.submissionStatus, 'unknown');
        assert.deepEqual(methods, scenario === 'result-403' ? ['POST', 'GET'] : ['POST']);
        assert.deepEqual(waits, []);
    }
});

test('does not follow login, untrusted, or write-capable redirect destinations', async () => {
    for (const location of [null, 'not a URL', 'http://script.googleusercontent.com/macros/echo',
        'https://script.googleusercontent.com.evil.test/macros/echo',
        'https://accounts.google.com/login', 'https://script.google.com/macros/s/deployment/exec',
        'https://user:password@script.googleusercontent.com/macros/echo',
        'https://script.googleusercontent.com:444/macros/echo',
        'https://script.googleusercontent.com/macros/s/deployment/exec']) {
        let calls = 0;
        globalThis.fetch = async () => {
            calls++;
            assert.equal(calls, 1);
            return new Response(null, { status: 302, headers: location ? { location } : {} });
        };
        assert.equal((await submit()).statusCode, 502);
        assert.equal(calls, 1);
    }
});

test('never replays a POST for 307/308 or follows another result redirect', async () => {
    for (const status of [307, 308]) {
        let calls = 0;
        globalThis.fetch = async () => {
            calls++;
            return new Response(null, { status, headers: { location: resultUrl } });
        };
        assert.equal((await submit()).statusCode, 502);
        assert.equal(calls, 1);
    }
    let calls = 0;
    globalThis.fetch = async () => {
        calls++;
        return new Response(null, { status: 302, headers: { location: calls === 1 ? resultUrl : 'https://evil.test' } });
    };
    assert.equal((await submit()).statusCode, 502);
    assert.equal(calls, 2);
});

test('does not accept a result redirect as success without a confirmed JSON status', async () => {
    for (const result of ['<html>Missing</html>', JSON.stringify({ status: 'error' }), JSON.stringify({ ok: true })]) {
        let calls = 0;
        globalThis.fetch = async () => ++calls === 1
            ? new Response(null, { status: 302, headers: { location: resultUrl } })
            : new Response(result, { status: 200 });
        const res = await submit();
        assert.equal(res.statusCode, 502);
        assert.equal(res.body.submissionStatus, 'unknown');
        assert.equal(calls, 2);
    }
});
