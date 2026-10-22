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

    const { name, status, tags, motivation, org, dept, grade, past_background } = body;
    if (!motivation) {
        return res.status(400).json({ error: 'Missing motivation field' });
    }

    const tables = [
        { table: 'A', title: 'AI 資訊顧問', description: '講者潘劭儒 Grace Pan。全球財務轉型專案經驗，專精 Agentic AI、自動化與 no-code；The AI Collective 台北 Chapter Lead、Lovable 台北 City Lead 與 Solo Expert Partner。從企業痛點診斷到 AI 工具應用，探索非工程背景的 AI 顧問職涯與跨國專案。' },
        { table: 'B', title: 'AI 推論與基礎架構', description: '講者陳約廷 Yueh-Ting Chen。NVIDIA 的 KV cache、connector 與 scheduler；曾任 RISC-V Vector C Intrinsic 規格工作小組主席，貢獻 TensorRT-LLM、vLLM、LLVM 等開源專案。交流 AI 推論與基礎架構、Agent 工作流和開源協作。' },
        { table: 'C', title: '創業與商業開拓', description: '講者 Jeff Hu。Turing Space CEO、行政院青年諮詢委員、Forbes Asia 30 Under 30。從市場痛點、打造產品到募資挑戰，分享從 0 到 1 的創業機會、風險與現實考驗。' },
        { table: 'D', title: 'MarTech × AI 行銷實踐', description: '講者 Samantha Huang。漸強實驗室 Senior PMM、Appier PMM、Northwestern University 整合行銷碩士。交流 AI 科技產品的跨國市場定位、產品對外溝通，以及從規劃到落地的行銷策略。' },
        { table: 'E', title: 'AI 伺服器產品落地', description: '講者詠文／陳立翰。主題暫定；講師背景與詳細介紹待補，目前沒有其他已提供的經歷或主題細節。' },
        { table: 'F', title: 'AI 輔助全端開發', description: '講者 Edward Feng。21 年後端至 SRE 經驗、4 年全 AI 輔助開發，Nurie AI AI Infra Architect。從前後端到測試與 DevOps，分享 AI 輔助實戰與建立信任、逐步交付開發任務的方法。' },
        { table: 'G', title: 'AI 產品技術決策', description: '講者 Doppler Kuo。MetAI Product Manager、USPACE Head of Product、Appier 前端工程師、貝殼放大產品開發。從工程到 AI PM，交流團隊溝通、技術可行性判斷與 AI 產品上線。' },
        { table: 'H', title: '語音模型在地化與應用研究', description: '講者周成康。專注資料導向 AI、領域適應與高效模型調適；3 篇 IEEE 論文中 2 篇第一作者，開源 ASR 模型逾 20 萬次下載，AI 系統落地工業產線。交流語音模型在地化、場域需求及 Applied Research Scientist 的落地工作。' },
        { table: 'I', title: 'AI 研究、社團幹部與學術觀察', description: '講者姚睿銘／梁安哲。姚睿銘有 UBC TeaLab、中研院研究實習經驗，為臺大資工所碩士生、NTUAI 顧問暨前技術長；梁安哲有 AMD、Quid 機器學習工程與 TASA 嵌入式系統實習經驗。比較國內外學術研究與企業工作的發展路徑。' },
        { table: 'J', title: '邊緣 AI 硬體 PM', description: '講者待定。主題暫定；講師背景與詳細介紹待補，目前沒有其他已提供的經歷或主題細節。' },
    ];
    const tableCount = tables.length;
    const exampleOrder = tables.map((_, index) => index + 1);
    const tableDescriptions = tables.map((table, index) => `${index + 1}. 【${table.title}】（${table.table} 桌）：${table.description}`).join('\n');

    const statusLabel = status === 'recent_graduate' ? '畢業兩年內新鮮人' : status || '未提供';
    const prompt = `你們是職涯導航員，擅長從學員的特質中萃取最適合的職涯風味。請根據參與者資料，為其調配最適合的桌次順序。

## 參與者資料
- 姓名：${name || '未提供'}
- 身分：${statusLabel}${status === 'student' ? `\n- 學校：${org || '未提供'}\n- 系所：${dept || '未提供'}\n- 年級：${grade || '未提供'}` : (status === 'employed' || status === 'recent_graduate') ? `\n- 公司：${org || '未提供'}\n- 職稱/部門：${dept || '未提供'}` : status === 'unemployed' ? `\n- 過去學經歷／工作背景：${past_background || '未提供'}` : ''}
- 標籤：${tags?.filter(Boolean).join('、') || '未提供'}
- 報名動機：${motivation}

## 桌次說明
${tableDescriptions}
E 桌主題暫定，講師背景與詳細介紹待補。不得臆測未提供的 E 桌講師經歷；資料不足時，不得憑空撰寫背景適配理由，只能依已提供的暫定主題說明探索方向與資訊限制。

## 輸出格式（嚴格遵守）
只輸出一個合法的 JSON 物件，不要有任何其他文字、markdown、代碼區塊：
{"order": ${JSON.stringify(exampleOrder)}, "reason": "推薦理由文字"}

欄位說明：
- order：包含 1 到 ${tableCount} 的完整數字排列陣列，每個數字只出現一次；1 對應 A 桌，依序至 ${tableCount} 對應 ${tables[tableCount - 1].table} 桌，代表桌次優先順序。
- reason：用繁體中文撰寫約 200 字的推薦理由。語氣應口語且親切，風格像品酒師介紹酒單，充滿職涯探索的意境。請適當分段（在段落間使用 \\n），以利排版閱讀。
  1. 嚴禁使用「第 X 桌」等數字稱呼，請直接使用「主題名稱」。
  2. 需依序提及前三名推薦的主題：著重背景契合度、參與者希望探索的方向或領域；如果沒有良好適配的主題，則評估並給出推薦嘗試的理由。
  3. 稱呼參與者為「貴賓」，結尾加上「這份酒單是我們的推薦，您仍可以自行調整您的配方。」

範例輸出：
{"order": ${JSON.stringify(exampleOrder)}, "reason": "為 XXX(參與者姓名) 貴賓斟上一杯層次豐富的職涯佳釀。\\n首推【AI 資訊顧問】，探索如何以 AI 工具回應企業痛點。\\n接著，【AI 推論與基礎架構】帶您認識推論與開源協作的實戰。\\n此外，【創業與商業開拓】為您的職涯補上一抹從市場到產品的視野。\\n這份酒單是我們的推薦，您仍可以自行調整您的配方。"} `;
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

        // Validate against the complete current table catalog.
        const valid = Array.isArray(order) && order.length === tableCount
            && [...order].sort((a, b) => a - b).every((v, i) => v === i + 1);
        if (!valid) {
            return res.status(502).json({ error: 'Invalid order array from Gemini', order });
        }

        return res.status(200).json({ order, reason: reasonPart });
    } catch (err) {
        console.error('recommend error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
