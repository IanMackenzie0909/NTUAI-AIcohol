// api/register.js – Vercel Serverless Function
// Proxies registration data to Google Apps Script (Google Sheets backend)
// Environment variables required:
//   GAS_SCRIPT_URL – Google Apps Script exec URL
//   API_KEY        – shared secret sent to GAS

const responseRetryDelays = [1000, 2000, 3000];
const resultRedirectStatuses = new Set([301, 302, 303, 307, 308]);
const retryableResultStatuses = new Set([404, 408, 429, 500, 502, 503, 504]);
const maxResultRedirects = 3;
const maxResultRequests = 7;
const networkErrorCodes = new Set([
    'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT',
    'UND_ERR_SOCKET', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN', 'ENOTFOUND',
]);

function inspectResultRedirect(location, base) {
    if (!location) return { url: null, targetClass: 'missing' };
    let url;
    try { url = new URL(location, base); } catch { return { url: null, targetClass: 'invalid' }; }
    if (url.protocol === 'https:' && url.hostname === 'script.googleusercontent.com'
        && !url.port && !url.username && !url.password && !url.hash
        && url.pathname === '/macros/echo') {
        return { url, targetClass: 'content_service' };
    }
    // Classify destinations without logging their host, path, query or result token.
    const targetClass = url.hostname === 'accounts.google.com' ? 'google_login'
        : url.hostname === 'script.google.com' ? 'gas_endpoint' : 'other';
    return { url: null, targetClass };
}

function networkErrorDetails(error) {
    const knownNames = ['TimeoutError', 'AbortError', 'TypeError', 'SyntaxError', 'Error'];
    const code = error?.cause?.code || error?.code;
    return {
        errorName: knownNames.includes(error?.name) ? error.name : 'Error',
        causeCode: networkErrorCodes.has(code) ? code : null,
    };
}

function isRetryableNetworkError(error) {
    return ['TimeoutError', 'AbortError', 'TypeError'].includes(error?.name)
        || networkErrorCodes.has(error?.cause?.code || error?.code);
}

function waitForResultRetry(delay, signal) {
    return new Promise((resolve, reject) => {
        if (signal.aborted) { reject(signal.reason); return; }
        let timer;
        const onAbort = () => {
            clearTimeout(timer);
            signal.removeEventListener('abort', onAbort);
            reject(signal.reason);
        };
        timer = setTimeout(() => {
            signal.removeEventListener('abort', onAbort);
            resolve();
        }, delay);
        signal.addEventListener('abort', onAbort, { once: true });
        if (signal.aborted) onAbort();
    });
}

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
    let submitStatus = null;
    let resultRedirects = 0;
    let resultRetries = 0;
    let redirectTargetClass = null;
    let attemptElapsedMs = null;
    let requestError = null;
    let timeoutKind = null;
    let deadline;
    let failureReason = 'request_failed';
    const startedAt = Date.now();

    try {
        deadline = AbortSignal.timeout(90_000);
        let gasRes = await fetch(GAS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            redirect: 'manual',
            signal: deadline,
        });
        upstreamStatus = gasRes.status;
        submitStatus = gasRes.status;
        let gasData;

        // ContentService serves the result at a separate, temporary URL.
        // Only this body-free GET may be retried; repeating the POST can duplicate a registration.
        if (gasRes.status === 302 || gasRes.status === 303) {
            const location = gasRes.headers.get('location');
            await discardResponse(gasRes);
            failureReason = 'unexpected_result_redirect';
            const destination = inspectResultRedirect(location, GAS_SCRIPT_URL);
            redirectTargetClass = destination.targetClass;
            if (!destination.url) throw new Error('Unexpected GAS result redirect');
            let resultUrl = destination.url;
            const visitedResultUrls = new Set([resultUrl.href]);

            stage = 'result';
            while (responseAttempts < maxResultRequests) {
                if (deadline.aborted) {
                    failureReason = 'result_deadline_exceeded';
                    timeoutKind = 'overall';
                    throw deadline.reason;
                }
                responseAttempts++;
                upstreamStatus = null;
                requestError = null;
                timeoutKind = null;
                failureReason = 'result_request_failed';
                const attemptStartedAt = Date.now();
                const requestTimeout = AbortSignal.timeout(10_000);
                try {
                    gasRes = await fetch(resultUrl.href, {
                        method: 'GET',
                        redirect: 'manual',
                        signal: AbortSignal.any([deadline, requestTimeout]),
                    });
                    upstreamStatus = gasRes.status;

                    if (resultRedirectStatuses.has(gasRes.status)) {
                        const next = inspectResultRedirect(gasRes.headers.get('location'), resultUrl);
                        redirectTargetClass = next.targetClass;
                        await discardResponse(gasRes);
                        failureReason = 'unexpected_result_redirect';
                        if (!next.url) throw new Error('Unexpected GAS result redirect');
                        failureReason = 'result_redirect_limit';
                        if (resultRedirects >= maxResultRedirects) throw new Error('Too many GAS result redirects');
                        failureReason = 'result_redirect_loop';
                        if (visitedResultUrls.has(next.url.href)) throw new Error('GAS result redirect loop');
                        visitedResultUrls.add(next.url.href);
                        resultUrl = next.url;
                        resultRedirects++;
                        console.warn('Following validated GAS result redirect', {
                            stage, status: upstreamStatus, responseAttempts,
                            resultRedirects, redirectTargetClass,
                        });
                        continue;
                    }

                    if (retryableResultStatuses.has(gasRes.status)) {
                        failureReason = 'upstream_http_error';
                        await discardResponse(gasRes);
                    } else {
                        if (!gasRes.ok) {
                            failureReason = 'upstream_http_error';
                            await discardResponse(gasRes);
                            throw new Error('GAS result HTTP error');
                        }
                        // Read the body under the same timeout; fetch alone only waits for headers.
                        failureReason = 'invalid_result_json';
                        gasData = await gasRes.json();
                        break;
                    }
                } catch (error) {
                    if (!isRetryableNetworkError(error)) throw error;
                    failureReason = upstreamStatus === null ? 'result_request_failed' : 'result_body_failed';
                    requestError = networkErrorDetails(error);
                    timeoutKind = deadline.aborted ? 'overall'
                        : requestTimeout.aborted || error?.name === 'TimeoutError' ? 'result_request' : null;
                } finally {
                    attemptElapsedMs = Date.now() - attemptStartedAt;
                }

                if (deadline.aborted) {
                    failureReason = 'result_deadline_exceeded';
                    timeoutKind = 'overall';
                    throw deadline.reason;
                }
                if (resultRetries >= responseRetryDelays.length || responseAttempts >= maxResultRequests) {
                    throw new Error('GAS result retry budget exhausted');
                }
                const delay = responseRetryDelays[resultRetries++];
                console.warn('GAS result temporarily unavailable; retrying result GET', {
                    stage, status: upstreamStatus, responseAttempts, resultRetries,
                    resultRedirects, attemptElapsedMs, timeoutKind, ...requestError,
                });
                try { await waitForResultRetry(delay, deadline); } catch (error) {
                    failureReason = 'result_deadline_exceeded';
                    timeoutKind = 'overall';
                    throw error;
                }
            }
            if (gasData === undefined) {
                failureReason = 'result_request_limit';
                throw new Error('GAS result request budget exhausted');
            }
        } else {
            // Also support a direct JSON response without ever retrying the POST.
            if (!gasRes.ok) {
                failureReason = 'upstream_http_error';
                await discardResponse(gasRes);
                throw new Error('GAS submit HTTP error');
            }
            failureReason = 'invalid_result_json';
            gasData = await gasRes.json();
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
    } catch (error) {
        // Do not log the result URL/token, shared secret, payload, or arbitrary GAS error text.
        console.error('GAS forwarding error:', {
            stage, status: upstreamStatus, reason: failureReason,
            responseAttempts, elapsedMs: Date.now() - startedAt,
            submitStatus, resultRetries, resultRedirects, redirectTargetClass,
            attemptElapsedMs, timeoutKind, ...(requestError || networkErrorDetails(error)),
        });
        return res.status(502).json({
            error: 'Failed to confirm registration result',
            code: 'REGISTRATION_UNCONFIRMED',
            submissionStatus: 'unknown',
        });
    }
}
