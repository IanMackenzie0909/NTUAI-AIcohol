// api/register.js – Vercel Serverless Function
// Proxies registration data to Google Apps Script (Google Sheets backend)
// Environment variables required:
//   GAS_SCRIPT_URL – Google Apps Script exec URL
//   API_KEY        – shared secret sent to GAS

const responseRetryDelays = [1000, 2000, 3000];

async function discardResponse(response) {
    try { await response.body?.cancel(); } catch { /* Do not mask the original failure. */ }
}

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
        GAS_SCRIPT_URL,
        API_KEY,
    } = process.env;

    if (!GAS_SCRIPT_URL || !API_KEY) {
        console.error('Missing GAS_SCRIPT_URL or API_KEY env vars');
        return res.status(500).json({ error: 'Server misconfiguration' });
    }

    let body;
    try {
        // Vercel parses JSON body automatically when Content-Type is application/json
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }

    // Basic required-field check
    const required = ['name', 'phone', 'email', 'role'];
    for (const field of required) {
        if (!body[field]) {
            return res.status(400).json({ error: `Missing field: ${field}` });
        }
    }

    if (body.role === 'unemployed' && (typeof body.past_background !== 'string' || !body.past_background.trim())) {
        return res.status(400).json({ error: 'Missing or invalid field: past_background' });
    }

    // Forward to Google Apps Script
    const payload = {
        ...body,
        apiKey: API_KEY,
    };

    let stage = 'submit';
    let upstreamStatus = null;
    let responseAttempts = 0;
    let failureReason = 'request_failed';
    const startedAt = Date.now();

    try {
        const deadline = AbortSignal.timeout(90_000);
        let gasRes = await fetch(GAS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            redirect: 'manual',
            signal: deadline,
        });
        upstreamStatus = gasRes.status;

        // ContentService serves the result at a separate, temporary URL.
        // Only this body-free GET may be retried; repeating the POST can duplicate a registration.
        if (gasRes.status === 302 || gasRes.status === 303) {
            const location = gasRes.headers.get('location');
            await discardResponse(gasRes);
            failureReason = 'unexpected_result_redirect';
            const resultUrl = location ? new URL(location, GAS_SCRIPT_URL) : null;
            if (!resultUrl || resultUrl.protocol !== 'https:'
                || resultUrl.hostname !== 'script.googleusercontent.com'
                || resultUrl.port || resultUrl.username || resultUrl.password
                || resultUrl.pathname !== '/macros/echo') {
                throw new Error('Unexpected GAS result redirect');
            }

            stage = 'result';
            for (let attempt = 0; attempt <= responseRetryDelays.length; attempt++) {
                responseAttempts = attempt + 1;
                upstreamStatus = null;
                failureReason = 'result_request_failed';
                gasRes = await fetch(resultUrl.href, {
                    method: 'GET',
                    redirect: 'manual',
                    signal: AbortSignal.any([deadline, AbortSignal.timeout(10_000)]),
                });
                upstreamStatus = gasRes.status;
                if (gasRes.status !== 404 || attempt === responseRetryDelays.length) break;
                await discardResponse(gasRes);
                console.warn('GAS result temporarily unavailable; retrying result GET', {
                    stage, status: upstreamStatus, attempt: responseAttempts,
                });
                await new Promise(resolve => setTimeout(resolve, responseRetryDelays[attempt]));
            }
        }

        // ContentService may return HTTP 200 even when registration failed.
        if (!gasRes.ok) {
            failureReason = 'upstream_http_error';
            await discardResponse(gasRes);
            throw new Error(`GAS returned ${gasRes.status}`);
        }

        let gasData;
        try {
            failureReason = 'invalid_result_json';
            gasData = await gasRes.json();
        } catch {
            throw new Error('GAS returned a non-JSON response');
        }

        // Match the doPost contract: only a confirmed success is accepted.
        if (gasData?.status !== 'success') {
            // Older GAS catch blocks can return an error after appendRow has already succeeded.
            // Without an explicit "not saved" contract, this outcome is still unconfirmed.
            failureReason = gasData?.status === 'error' ? 'gas_rejected' : 'missing_success_status';
            throw new Error('GAS did not confirm registration');
        }

        if (gasData.mailSent === false) {
            console.warn('Registration saved, but GAS could not send the confirmation email');
        }

        return res.status(200).json({ ok: true });
    } catch {
        // Do not log the result URL/token, shared secret, payload, or arbitrary GAS error text.
        console.error('GAS forwarding error:', {
            stage, status: upstreamStatus, reason: failureReason,
            responseAttempts, elapsedMs: Date.now() - startedAt,
        });
        return res.status(502).json({
            error: 'Failed to confirm registration result',
            code: 'REGISTRATION_UNCONFIRMED',
            submissionStatus: 'unknown',
        });
    }
}
