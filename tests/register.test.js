import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import handler from '../api/register.js';

const originalFetch = globalThis.fetch;
const originalError = console.error;
const originalWarn = console.warn;
const originalGasUrl = process.env.GAS_SCRIPT_URL;
const originalApiKey = process.env.API_KEY;
let errors;

beforeEach(() => {
    process.env.GAS_SCRIPT_URL = 'https://example.test/exec';
    process.env.API_KEY = 'unit-test-shared-secret';
    errors = [];
    console.error = (...args) => errors.push(args);
    console.warn = () => {};
});

afterEach(() => {
    globalThis.fetch = originalFetch;
    console.error = originalError;
    console.warn = originalWarn;
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
    assert.match(errors[0][1].message, /API KEY 錯誤/);
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
    assert.ok(!errors[0][1].message.includes('unit-test-shared-secret'));
    assert.ok(!JSON.stringify(res.body).includes('unit-test-shared-secret'));
});
