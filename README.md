# NTUAI-AIcohol

This is an event website for NTUAI club.

## Frontend structure

```text
public/
├── index.html                 # Page markup
├── style.css                  # Shared site styles
├── script.js                  # Registration and preference ranking
├── source/
│   ├── assets/                # Branding, hosts, feedback photos and cocktails
│   └── styles/
│       ├── topics.css         # Flavor exploration and roundtable cards
│       ├── ranking-theme.css  # Orange registration theme and category badges
│       ├── page-motion.css    # Once-only scroll reveals
│       └── comeback.css       # Warm headline entrance effects
└── action/
    ├── topics.js              # Animated flavor grouping and cocktail details
    ├── feedback.js            # Feedback carousel and counter animations
    ├── page-motion.js         # Viewport reveals with readable fallbacks
    └── comeback.js            # Strong comeback headline entrance
```

HTML and JavaScript image URLs resolve from the page, using `source/assets/`.
The shared stylesheet uses the same path relative to `public/style.css`.
Vercel rewrites preserve old `/assets/` URLs and previous feature-file URLs for
existing email banners and cached pages. The API routes remain under `api/`.
See the [Vercel rewrite documentation](https://vercel.com/docs/routing/rewrites).

Roundtables start in A–J order without cocktail details. Selecting a flavor
groups its tables and reveals their cocktails; other tables remain alphabetical.
Selecting the same flavor again or “全部桌次” restores the initial view.

Content reveals once on entering the viewport. The comeback headline has a
separate warm gold entrance, and flavor details fade in alongside table movement.
Reduced motion preferences keep content visible without these entrance effects;
the static HTML also stays readable when JavaScript is unavailable.

## 正式版部署

正式官網：<https://ntuai-alcohol-round-ii.vercel.app/>。

### Vercel 新專案設定

先將本機變更提交並推送至 GitHub `main`，再匯入該儲存庫。

| 欄位 | 設定 |
| --- | --- |
| Project Name | `ntuai-alcohol-round-ii`（小寫） |
| Application / Framework Preset | `Other` |
| Root Directory | `./`（儲存庫根目錄，包含 `api/`） |
| Build Command | 開啟 Override，內容留空，略過 build |
| Output Directory | `public`，`vercel.json` 已指定 |
| Install Command | 保持預設，不開啟 Override |
| Node.js Version | `24.x`，`package.json` 已指定 |
| Production Branch | `main` |

在新專案的 Environment Variables 加入以下三項，至少勾選 **Production**。
請填實際值；`.env.example` 僅提供格式。

| 名稱 | 值 |
| --- | --- |
| `GAS_SCRIPT_URL` | 正式 Apps Script 網頁應用程式的 `/exec` 網址，不能用 `/dev` |
| `API_KEY` | 與正式 GAS「指令碼屬性」中的 `API_KEY` 完全相同 |
| `GEMINI_API_KEY` | 推薦功能使用的 Gemini API 金鑰 |

如果需要 Preview 也能送出表單，另配置 Preview 對應的測試 GAS 與金鑰。
沿用同一個 GAS 與試算表設定，就會把測試與正式資料寫入同一個分頁；
要分開名單，請建立正式用的 GAS／試算表，並使用其 `/exec` URL。

按 Deploy 後，確認 Domains 包含 `ntuai-alcohol-round-ii.vercel.app`。
前端 `/api/recommend`、`/api/register` 都使用同源相對路徑，無須改 API URL。
現有 `vercel.json` 的圖片相容路徑也可保留，不需另外新增 Dashboard 路由。
新增或修改環境變數後，需要重新部署才會套用。

### 更新 GAS 確認信

本機完整程式為 `gas/registration.gs`。主按鈕已改成「AIcohol 活動官網 ➔」，
指向正式官網；Banner 保留 `AIcohol_intro.jpg`，改由正式官網提供。
Logo 與頁尾的社群連結仍指向 NTUAI 各社群。

1. 將該程式碼更新至 Google Apps Script 專案。
2. 在「專案設定 → 指令碼屬性」確認 `API_KEY`、`SPREADSHEET_ID`、`SHEET_NAME`。
   後兩項分別是目標試算表 ID 與實際分頁名稱。
3. 儲存後選「部署 → 管理部署 → 編輯 → 新版本 → 部署」。
4. 網頁應用程式的執行身分用「我」，誰可以存取用「所有人」，
   讓 Vercel 伺服器能呼叫。首次部署時請依畫面完成授權。
5. 編輯既有部署可保留原 `/exec`；若另建部署，請把新的 `/exec` 填入
   Vercel `GAS_SCRIPT_URL`，再重新部署網站。

`gas/` 目前被 Git 忽略；推送 GitHub 或部署 Vercel 不會更新線上的 GAS。
已寄出的信件不會改寫，新按鈕適用於更新 GAS 後寄出的信件。

網站與 API 的身分代碼統一使用 `student`、`recent_graduate`、`employed`、
`unemployed`。GAS 寫入 `role` 欄時才轉成「學生」、「畢業兩年內新鮮人」、
「在職」、「待業」；舊表單送出的 `professional` 也會寫成「在職」。
此轉換僅套用於新增資料，不會自動改寫試算表既有列。

### 上線確認與後續更新

使用自己的 Email 完成一次報名，確認推薦正常、資料寫入正確分頁，
並檢查確認信的 Banner 與活動官網按鈕。上述步驟由管理者在正式站執行；
本機測試使用模擬服務，不會替你寫入正式名單或寄信。

若測試、正式兩個 Vercel Project 都追蹤同一儲存庫的 `main`，之後推送
`main` 通常會同時更新兩站。要隔離後續測試，正式站維持 `main`，
測試站改追 `testing` 或 `dev` 分支。設定位置為
「Settings → Environments → Production → Branch Tracking」。
測試專案仍有自己的 Production 環境，不能把它與正式專案的 Preview 混為一談。

目前 GA 與 Clarity 仍沿用原追蹤設定；如需分開測試與正式流量，再為正式站
配置對應的追蹤專案。
