// api/register.js – Vercel Serverless Function
// Proxies registration data to Google Apps Script (Google Sheets backend)
// Environment variables required:
//   GAS_SCRIPT_URL – Google Apps Script exec URL
//   API_KEY        – shared secret sent to GAS

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

    // Basic required-field check
    const required = ['name', 'phone', 'email', 'role'];
    for (const field of required) {
        if (!body[field]) {
            return res.status(400).json({ error: `Missing field: ${field}` });
        }
    }

    // Forward to Google Apps Script
    const payload = {
        apiKey: API_KEY,
        ...body,
    };

    try {
        const gasRes = await fetch(GAS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        // GAS always returns 200 even on redirect; just check it responded
        if (!gasRes.ok) {
            throw new Error(`GAS returned ${gasRes.status}`);
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('GAS forwarding error:', err);
        return res.status(502).json({ error: 'Failed to reach data backend' });
    }
}
