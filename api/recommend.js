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
        { table: 'A', title: 'AI 資訊顧問', description: '(AI Consultant)：講者潘劭儒 Grace Pan（轉型顧問，目前負責全球財務轉型專案，專精 Agentic AI、自動化與 no-code 工具應用；The AI Collective 台北分會 Chapter Lead、Lovable 台北 City Lead 暨 Solo Expert Partner）。從企業痛點診斷到 AI 工具應用，探索非工程背景如何切入 AI 顧問工作，在跨國專案與持續學習中累積職涯競爭力，適合非工程背景、想作為顧問，或想學習 AI 自動化與 no-code 工具應用的同學。' },
        { table: 'B', title: 'AI 推論與基礎架構', description: '(AI Infra)：講者陳約廷 Yueh-Ting Chen（NVIDIA，負責 KV cache、connector、scheduler 相關問題；曾任 RISC-V Vector C Intrinsic specification task group 主席、LLVM 該規格主要實作者之一；對 TensorRT-LLM、vLLM、LLVM、QEMU、Spike 開源專案有實質貢獻）。深入 AI 推論技術，探索 Agent 工作流如何融入日常工作，並分享開源專案的實戰與協作經驗，適合資工、電機背景，想走系統底層、推論優化或參與開源專案的同學。' },
        { table: 'C', title: '創業與商業開拓', description: '(Founder)：講者 Jeff Hu（Turing Space CEO、行政院青年諮詢委員、Forbes Asia 30 Under 30）。分享從 0 到 1 的創業之路，從發現市場痛點、打造產品到面對募資挑戰，透過第一線經驗看見創業的機會、風險與現實考驗，適合想了解創業與募資、商業真實樣貌的同學。' },
        { table: 'D', title: 'MarTech × AI 行銷實踐', description: '(AI Marketing)：講者 Samantha Huang（漸強實驗室 Senior PMM、Appier PMM、Northwestern University 整合行銷碩士）。專注 AI 科技產品的跨國市場定位、產品對外論述，以及 End-to-End 行銷策略規劃與落地，適合對行銷、品牌、產品行銷（PMM）或 MarTech 有興趣，想了解 AI 產品如何走向市場的同學。' },
        { table: 'E', title: 'AI 伺服器產品落地', description: '講者 鄭詠文（廣達 PM，具備伺服器 NPI 物料管理經驗，熟悉 ERP 系統、供應商管理及 AI 輔助缺料分析）、陳立翰（鴻海 Fii CESBG DPM，現任 HVDC AI Server NPI 專案 R&D DPM，協調逾 200 人的設計暨驗證團隊，負責產品設計與驗證規劃、專案時程與測試計劃；具 MBA 背景與鴻海實習經驗，擅長結合程式設計與數據分析推動報表自動化與流程改善）。串聯客戶、研發與製造端，協助新產品導入（NPI）到量產準備，適合對硬體製造、專案管理、供應鏈或 AI 伺服器產業有興趣，以及商管背景想進入科技製造業的同學。' },
        { table: 'F', title: 'AI 輔助全端開發', description: '(AI-Assisted Development)：講者 Edward Feng（21 年後端到 SRE 經驗、4 年全 AI 輔助開發經驗，現任 Nurie AI 的 AI Infra Architect）。從前後端開發到測試與 DevOps，分享 AI 輔助的實戰經驗，探索如何建立信任，逐步將任務放心地交給 AI，適合軟程背景、想提升開發效率、新創並了解 AI 輔助寫程式的同學。' },
        { table: 'G', title: 'AI 產品技術決策', description: '(AI Product Manager)：講者 Doppler Kuo（MetAI Product Manager、USPACE Head of Product、Appier Frontend Engineer、貝殼放大 Product Developer）。從寫 Code 到 AI PM，分享工程團隊溝通、技術可行性判斷，以及如何把 AI 功能做成真正能上線的產品，適合想從工程轉 PM、或想了解 AI 產品開發與跨團隊溝通的同學。' },
        { table: 'H', title: '語音模型在地化與應用研究', description: '(Applied Researcher)：講者周成康（Applied ML researcher，專注 data-centric AI、domain adaptation 與 efficient model adaptation；3 篇 IEEE 論文（2 篇第一作者）、開源 ASR 模型下載量 20 萬以上、AI 系統部署於工業產線）。從語音模型在地化出發，探索如何讓模型適應不同場域與情境需求，分享 Applied Research Scientist 從研究到實際落地的工作經驗，適合對語音模型、機器學習研究、深入探索學術領域的同學。' },
        { table: 'I', title: 'AI 研究、社團幹部與學術觀察', description: '(Research & Academia)：講者姚睿銘（英屬哥倫比亞大學 TeaLab Research Intern、前中研院 Research Intern、NTU AI Club Advisor 暨前 Technical Lead、臺大資工所 TriLab 碩士生）、梁安哲（AMD Machine Learning Engineer Intern、Quid Machine Learning Engineer Intern、TASA Embedded Systems Intern）。姚睿銘分享 AI 研究工作的日常與海內外學術經歷，探索不同研究環境與發展路徑；梁安哲分享從英國 AI 新創到 AMD 的實習工作與學習收穫，探索不同企業環境中的職涯方向，適合考慮出國或國內升學、想了解 AI 研究生活，或想爭取海內外 AI 實習的同學。' },
        { table: 'J', title: '邊緣 AI 硬體 PM', description: '(Edge AI Hardware PM)：講者 Yangju Chen（華碩 ASUS AI 策略事業與品牌管理部門主管、博世 Bosch Taiwan 專案經理、華碩 ASUS ProArt 產品系列企劃 PM）。專注 AI 與硬體科技產品的市場定位，規劃產品藍圖與 Go-to-Market（GTM）策略，並探索硬體 PM 的發展方向，適合對硬體產品經理、產品規劃或科技業 AI 策略有興趣的同學。' },
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
請僅依上述已提供的講師背景與主題內容推薦，不得編造講師經歷或未提供的資訊。

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
