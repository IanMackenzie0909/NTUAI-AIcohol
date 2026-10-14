// api/recommend.js – Vercel Serverless Function
// Calls Gemini to rank table preferences based on user profile
// Environment variables required:
// GEMINI_API_KEY – Google Gemini API key

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { GEMINI_API_KEY } = process.env;
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Server misconfiguration: missing GEMINI_API_KEY' });
    }

    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }

    const { name, status, tags, motivation, org, dept, grade } = body;
    if (!motivation) {
        return res.status(400).json({ error: 'Missing motivation field' });
    }

    const tableDescriptions = `
1. 【創新創業家】(Founder)：講者 Jeff Hu（Turing Space CEO、行政院青年諮詢委員、Forbes Asia 30 Under 30）。分享從0到1的創業血淚、募資挑戰與解決痛點的思維，啟發具創業夢的學生。
2. 【AI 人才轉型實戰】(Career Switcher)：講者 Ray Chang（跨產業科技/金融/零售實戰、IBM/緯創人資數位轉型、LinkedIn萬人級社群影響力、臺大人資顧問社特聘顧問）。非技術背景如何結合商業洞察，極大化個人品牌競爭力，適合文組或跨領域轉型者。
3. 【國際探險家】(Global Talent)：講者 Macro Wang（法國里昂管理學院碩士、法國/新加坡/越南跨國科技業經歷）。跨國科技業的實戰生存術與海外申請策略，拓展學生的國際視野。
4. 【技術領航者】(Tech)：講者為 AI 社內幹部（林奕昕：Appier/Delta Electronics實習、MarTech工程師；温冠華：Taiwan Mobile SWE Intern、NTUST NLP Lab、Apache貢獻者、SITCON Speaker、Google DevFest AI Speaker；張傑凱：Apache Mahout Committer、Ray & KubeRay Core Contributor、OpenSource Events Speaker）。分享從學術研究到實戰落地的心法與技巧，適合想走硬核研發路線的同學。
5. 【AI 技術實踐者】(AI Practitioner)：講者 Cheng Che Kuo（MetAI Product Manager、USPACE Head of Product、Appier Frontend Engineer、貝殼放大 Product Developer）。AI 如何真正被應用在工程、產品到團隊與開發流程中，適合想了解AI落地實踐的同學。
6. 【AI 產品實踐】(AI Product)：講者 楊淳佑（Tera Thinker Founder & CEO、連續創業家: 橫跨文創、媒體、區塊鏈、硬體 IC、AI 垂直領域軟體）。從概念到落地：如何用 AI 解決真實痛點並對齊商業價值，適合對AI產品與創業有興趣的同學。`.trim();

    const prompt = `你們是職涯導航員，擅長從學員的特質中萃取最適合的職涯風味。請根據參與者資料，為其調配最適合的桌次順序。

## 參與者資料
- 姓名：${name || '未提供'}
- 身分：${status || '未提供'}${status === 'student' ? `\n- 學校：${org || '未提供'}\n- 系所：${dept || '未提供'}\n- 年級：${grade || '未提供'}` : status === 'employed' ? `\n- 公司：${org || '未提供'}\n- 職稱/部門：${dept || '未提供'}` : ''}
- 標籤：${tags?.filter(Boolean).join('、') || '未提供'}
- 報名動機：${motivation}

## 桌次說明
${tableDescriptions}

## 輸出格式（嚴格遵守）
只輸出一個合法的 JSON 物件，不要有任何其他文字、markdown、代碼區塊：
{"order": [2,1,4,3,5,6], "reason": "推薦理由文字"}

欄位說明：
- order：包含 1 到 6 的數字排列陣列，代表桌次優先順序。
- reason：用繁體中文撰寫約 200 字的推薦理由。語氣應口語且親切，風格像品酒師介紹酒單，充滿職涯探索的意境。請適當分段（在段落間使用 \\n），以利排版閱讀。
  1. 嚴禁使用「第 X 桌」等數字稱呼，請直接使用「主題名稱」。
  2. 需依序提及前三名推薦的主題：著重背景契合度、參與者希望探索的方向或領域；如果沒有良好適配的主題，則評估並給出推薦嘗試的理由。
  3. 稱呼參與者為「貴賓」，結尾加上「這份酒單是我們的推薦，您仍可以自行調整您的配方。」

範例輸出：
{"order": [4,5,1,2,3,6], "reason": "為 XXX(參與者姓名) 貴賓斟上一杯層次豐富的職涯佳釀。\\n首推【主題 A】，這裡如同桶陳原酒，能幫您建立專業底蘊，與您深耕技術的背景完美契合。\\n接著，【主題 B】則像精緻的調和酒，帶您領略如何將創意轉化為實戰價值。\\n此外，我誠摯建議您品味【主題 C】，雖然這領域對您較為陌生，但其敏銳的市場嗅覺能為您的職涯補上一抹商業洞察的餘韻。\\n這份酒單是我們的推薦，您仍可以自行調整您的配方。"} `;
    try {
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 512,
                    },
                }),
            }
        );

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            console.error('Gemini API error:', errText);
            return res.status(502).json({ error: 'Gemini API error', detail: errText });
        }

        const geminiData = await geminiRes.json();
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

        // Parse JSON response
        let parsed;
        try {
            // Strip potential markdown fences (```json ... ```)
            const cleaned = rawText.replace(/```[a-z]*\n?/gi, '').trim();
            parsed = JSON.parse(cleaned);
        } catch {
            console.error('Could not parse JSON from Gemini response:', rawText);
            return res.status(502).json({ error: 'Unexpected Gemini response format', raw: rawText });
        }

        const order = parsed.order;
        const reasonPart = parsed.reason ?? '';

        // Validate: must be a permutation of 1..6
        const valid = order.length === 6 && [...order].sort((a, b) => a - b).every((v, i) => v === i + 1);
        if (!valid) {
            return res.status(502).json({ error: 'Invalid order array from Gemini', order });
        }

        return res.status(200).json({ order, reason: reasonPart });
    } catch (err) {
        console.error('recommend error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
