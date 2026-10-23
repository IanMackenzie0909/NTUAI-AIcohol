// ─── Theme data ───────────────────────────────────────────────────────────
const themes = [
    { id: 'table-a', table: 'A', title: 'AI 資訊顧問', desc: '潘劭儒 Grace Pan（全球財務轉型、Agentic AI 與 no-code 實務）。從企業痛點與 AI 工具應用，探索非工程背景的顧問職涯。' },
    { id: 'table-b', table: 'B', title: 'AI 推論與基礎架構', desc: '陳約廷 Yueh-Ting Chen（NVIDIA；TensorRT-LLM、vLLM、LLVM 貢獻者）。交流 AI 推論、基礎架構、Agent 工作流與開源協作。' },
    { id: 'table-c', table: 'C', title: '創業與商業開拓', desc: 'Jeff Hu（Turing Space CEO、Forbes Asia 30 Under 30）。從市場痛點、產品打造到募資，分享從 0 到 1 的創業實戰。' },
    { id: 'table-d', table: 'D', title: 'MarTech × AI 行銷實踐', desc: 'Samantha Huang（漸強實驗室 Senior PMM、Appier PMM）。交流 AI 科技產品的跨國市場定位、產品溝通與行銷落地。' },
    { id: 'table-e', table: 'E', title: 'AI 伺服器產品落地', desc: '鄭詠文（Quanta Project Manager；伺服器 NPI 物料管理與 AI 輔助缺料分析）、陳立翰（鴻海精密工業 Project Engineer）。交流客戶、研發與製造協作，從新產品導入到量產準備。' },
    { id: 'table-f', table: 'F', title: 'AI 輔助全端開發', desc: 'Edward Feng（21 年後端至 SRE 經驗；Nurie AI AI Infra Architect）。分享 AI 輔助開發、測試與 DevOps，以及逐步建立信任的實戰。' },
    { id: 'table-g', table: 'G', title: 'AI 產品技術決策', desc: 'Doppler Kuo（MetAI Product Manager、USPACE Head of Product）。從工程到 AI PM，交流團隊溝通、技術可行性與產品上線。' },
    { id: 'table-h', table: 'H', title: '語音模型在地化與應用研究', desc: '周成康（資料導向 AI、領域適應與高效模型調適；開源 ASR 模型逾 20 萬次下載）。交流語音模型在地化與應用研究落地。' },
    { id: 'table-i', table: 'I', title: 'AI 研究、社團幹部與學術觀察', desc: '姚睿銘／梁安哲（UBC、中研院研究；AMD、Quid 機器學習工程實習）。比較國內外研究與企業工作的發展路徑。' },
    { id: 'table-j', table: 'J', title: '邊緣 AI 硬體 PM', desc: 'Yangju（ASUS AI 策略事業與品牌管理部門主管、Bosch Taiwan 專案經理、ASUS ProArt 產品系列企劃 PM）。交流 AI 與硬體產品的市場定位、Go-to-Market 策略與全球產品上市。' }
];

function isValidThemeOrder(order) {
    return Array.isArray(order) && order.length === themes.length
        && [...order].sort((a, b) => a - b).every((value, index) => value === index + 1);
}

let submissionState = 'idle';
let currentStep = 1;
let sortedThemesResult = [];
let rankingSortable = null;
let initialAiOrder = '';
let initialAiReasons = '';

// ─── Validation ───────────────────────────────────────────────────────────
const validate = {
    name: v => /^[\u4e00-\u9fa5]{2,10}$/.test(v),
    phone: v => /^09\d{8}$|^09\d{2}-\d{3}-\d{3}$/.test(v),
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
};

['name', 'phone', 'email'].forEach(id => {
    const input = document.getElementById(id);
    const error = document.getElementById(`${id}Error`);
    input.addEventListener('input', () => {
        if (input.value && !validate[id](input.value)) {
            error.classList.remove('hidden');
            input.style.borderColor = 'rgba(248,113,113,0.5)';
        } else {
            error.classList.add('hidden');
            input.style.borderColor = '';
        }
    });
});

// ─── Dynamic status fields ────────────────────────────────────────────────
const userStatus = document.getElementById('userStatus');
const pastBackground = document.getElementById('pastBackground');

function updateStatusDetails() {
    const status = userStatus.value;
    const statusDetails = document.getElementById('statusDetails');
    const field3Container = document.getElementById('field3Container');
    const hasOrgDetails = ['student', 'employed', 'recent_graduate'].includes(status);

    statusDetails.classList.toggle('hidden', !hasOrgDetails);
    ['profDetail1', 'profDetail2'].forEach(id => {
        const field = document.getElementById(id);
        field.disabled = !hasOrgDetails;
        field.required = hasOrgDetails;
    });
    field3Container.classList.toggle('hidden', status !== 'student');
    const grade = document.getElementById('profDetail3');
    grade.disabled = status !== 'student';
    grade.required = status === 'student';

    const needsBackground = status === 'unemployed';
    document.getElementById('pastBackgroundContainer').classList.toggle('hidden', !needsBackground);
    pastBackground.disabled = !needsBackground;
    pastBackground.required = needsBackground;
    pastBackground.removeAttribute('aria-invalid');
    pastBackground.style.borderColor = '';
    document.getElementById('pastBackgroundError').classList.add('hidden');

    if (status === 'student') {
        document.getElementById('label1').innerText = '學校名稱';
        document.getElementById('label2').innerText = '系所名稱';
        document.getElementById('label3').innerText = '年級';
        document.getElementById('profDetail1').placeholder = '例如：國立台灣大學';
        document.getElementById('profDetail2').placeholder = '例如：資訊管理學系';
    } else if (status === 'employed' || status === 'recent_graduate') {
        document.getElementById('label1').innerText = '公司名稱';
        document.getElementById('label2').innerText = '現職名稱';
        document.getElementById('profDetail1').placeholder = '例如：Cake';
        document.getElementById('profDetail2').placeholder = '例如：產品經理';
    }
}

userStatus.addEventListener('change', updateStatusDetails);
updateStatusDetails();

pastBackground.addEventListener('input', () => {
    if (pastBackground.value.trim()) {
        pastBackground.removeAttribute('aria-invalid');
        pastBackground.style.borderColor = '';
        document.getElementById('pastBackgroundError').classList.add('hidden');
    }
});

function getStatusDetails() {
    const status = userStatus.value;
    const hasOrgDetails = ['student', 'employed', 'recent_graduate'].includes(status);
    return {
        org: hasOrgDetails ? document.getElementById('profDetail1').value.trim() : '',
        dept: hasOrgDetails ? document.getElementById('profDetail2').value.trim() : '',
        grade: status === 'student' ? document.getElementById('profDetail3').value : '',
        past_background: status === 'unemployed' ? pastBackground.value.trim() : '',
    };
}

// ─── Step navigation ──────────────────────────────────────────────────────
function nextStep(step) {
    if (step > currentStep) {
        let valid = true;

        if (currentStep === 1) {
            const status = document.getElementById('userStatus').value;
            const required = ['name', 'phone', 'email', 'userStatus'];

            if (status === 'student') required.push('profDetail1', 'profDetail2', 'profDetail3');
            else if (status === 'employed' || status === 'recent_graduate') required.push('profDetail1', 'profDetail2');
            else if (status === 'unemployed') required.push('pastBackground');

            required.forEach(id => {
                const el = document.getElementById(id);
                if (!el.value.trim()) { el.style.borderColor = 'rgba(248,113,113,0.5)'; valid = false; }
                else { el.style.borderColor = ''; }
            });

            const missingBackground = status === 'unemployed' && !pastBackground.value.trim();
            document.getElementById('pastBackgroundError').classList.toggle('hidden', !missingBackground);
            if (missingBackground) pastBackground.setAttribute('aria-invalid', 'true');

            if (!validate.name(document.getElementById('name').value)) { document.getElementById('nameError').classList.remove('hidden'); valid = false; }
            if (!validate.phone(document.getElementById('phone').value)) { document.getElementById('phoneError').classList.remove('hidden'); valid = false; }
            if (!validate.email(document.getElementById('email').value)) { document.getElementById('emailError').classList.remove('hidden'); valid = false; }
        }

        if (currentStep === 2) {
            ['tag1', 'tag2', 'tag3', 'motivation'].forEach(id => {
                const el = document.getElementById(id);
                if (!el.value.trim()) { el.style.borderColor = 'rgba(248,113,113,0.5)'; valid = false; }
                else { el.style.borderColor = ''; }
            });
        }

        if (!valid) return;
    }

    if (step === 3) generateSmartRecommendations();

    document.querySelectorAll('.form-step').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(`step${step}`);
    target.classList.remove('hidden');
    target.style.animation = 'none';
    target.offsetHeight;
    target.style.animation = '';

    // Update step indicators
    document.querySelectorAll('.step-dot').forEach(item => {
        const s = parseInt(item.dataset.step);
        item.classList.remove('active', 'done');
        if (s === step) item.classList.add('active');
        else if (s < step) item.classList.add('done');
    });

    currentStep = step;
    document.getElementById('register').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── AI recommendations (Gemini) ─────────────────────────────────────────
async function generateSmartRecommendations() {
    if (submissionState !== 'idle') return;

    const motivation = document.getElementById('motivation').value;
    const status = userStatus.value;
    const tags = [
        document.getElementById('tag1').value,
        document.getElementById('tag2').value,
        document.getElementById('tag3').value,
    ];

    document.getElementById('recomLoading').style.display = 'flex';
    document.getElementById('recomResult').classList.add('hidden');
    document.getElementById('recomError').classList.add('hidden');
    document.getElementById('rankingList').innerHTML = '';

    const nextBtn = document.querySelector('#step3 button[onclick="nextStep(2)"]');
    const submitBtn = document.getElementById('submitBtn');
    if (nextBtn) nextBtn.disabled = true;
    if (submitBtn) submitBtn.disabled = true;

    let order = null;
    let reason = '';

    try {
        const res = await fetch('/api/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: document.getElementById('name').value,
                status, tags, motivation,
                ...getStatusDetails(),
            }),
        });
        if (res.ok) {
            const data = await res.json();
            order = data.order;
            reason = data.reason;
            if (!isValidThemeOrder(order)) {
                console.warn('Recommend API returned invalid table order', {
                    expectedTables: themes.length,
                    receivedTables: Array.isArray(order) ? order.length : null,
                });
            }
        } else {
            console.warn('Recommend API error', await res.text());
        }
    } catch (err) {
        console.warn('Recommend fetch error:', err);
    }

    document.getElementById('recomLoading').style.display = 'none';

    if (isValidThemeOrder(order)) {
        sortedThemesResult = order.map(n => themes[n - 1]);
        initialAiOrder = order.join(',');
        initialAiReasons = reason;
        document.getElementById('recomReason').textContent = reason;
        const recomEl = document.getElementById('recomResult');
        recomEl.classList.remove('hidden');
        recomEl.classList.add('recom-reveal');
    } else {
        sortedThemesResult = [...themes];
        initialAiOrder = themes.map((_, index) => index + 1).join(',');
        initialAiReasons = '推薦服務無回應，使用預設排序';
        const errorEl = document.getElementById('recomError');
        errorEl.classList.remove('hidden');
        errorEl.classList.add('recom-reveal');
    }

    if (nextBtn) nextBtn.disabled = false;
    if (submitBtn) submitBtn.disabled = submissionState !== 'idle';

    renderRankingList();
}

function renderRankingList() {
    const rankingList = document.getElementById('rankingList');
    rankingList.innerHTML = '';

    sortedThemesResult.forEach((theme, idx) => {
        const isTop = idx < 3;
        const div = document.createElement('div');
        div.dataset.id = theme.id;
        div.className = 'rank-item' + (isTop ? ' rank-item-top' : '');
        div.innerHTML = `
            <span class="rank-badge${isTop ? ' rank-badge-top' : ''}">${idx + 1}</span>
            <svg class="rank-item-grip" width="18" height="18" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2" viewBox="0 0 24 24">
                <path d="M8 9h8M8 12h8M8 15h8" stroke-linecap="round"/>
            </svg>
            <div class="rank-item-content">
                <span class="rank-item-title">${theme.table} 桌｜${theme.title}</span>
                <span class="rank-item-desc">${theme.desc}</span>
            </div>
        `;
        rankingList.appendChild(div);
    });

    if (rankingSortable) rankingSortable.destroy();
    rankingSortable = new Sortable(rankingList, {
        animation: 150,
        ghostClass: 'opacity-50',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        delay: 150,
        delayOnTouchOnly: true,
        touchStartThreshold: 8,
        onEnd: () => {
            const newOrder = Array.from(rankingList.children).map(c => c.dataset.id);
            sortedThemesResult = newOrder.map(id => themes.find(t => t.id === id));
            renderRankingList();
        }
    });
}

// ─── Form submit ──────────────────────────────────────────────────────────
document.getElementById('registrationForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    // A lost response can follow a successful write; do not submit it again.
    if (submissionState !== 'idle') return;

    const confirmCheckbox = document.getElementById('confirmCheckbox');
    if (!confirmCheckbox.checked) {
        confirmCheckbox.focus();
        return;
    }
    const submitBtn = document.getElementById('submitBtn');
    const msg = document.getElementById('resultMessage');
    submissionState = 'sending';
    submitBtn.disabled = true;
    submitBtn.innerText = '發送中...';
    msg.classList.add('hidden');

    const status = document.getElementById('userStatus').value;
    const details = getStatusDetails();

    const payload = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        role: status === 'employed' ? 'professional' : status,
        org: details.org || 'N/A',
        dept: details.dept || 'N/A',
        grade: details.grade || 'N/A',
        past_background: details.past_background,
        ntuai_member: document.getElementById('ntuaiId').value,
        hashtag_1: document.getElementById('tag1').value,
        hashtag_2: document.getElementById('tag2').value,
        hashtag_3: document.getElementById('tag3').value,
        description: document.getElementById('motivation').value,
        ai_order: initialAiOrder,
        ai_reason: initialAiReasons,
        user_order: sortedThemesResult.map(t => themes.indexOf(t) + 1).join(','),
        table_questions: document.getElementById('tableQuestions').value.trim(),
    };

    let retryableFailure = false;
    let failureMessage = '';
    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        let data = null;
        try {
            data = await res.json();
        } catch {
            // HTML, an empty response or invalid JSON cannot confirm a write.
        }

        if (!res.ok || data?.ok !== true) {
            retryableFailure = (res.status === 400 && typeof data?.error === 'string')
                || (res.status === 500 && data?.error === 'Server misconfiguration');
            failureMessage = res.status === 500
                ? '系統設定尚未完成，這次資料未送出。請稍後再試或聯絡主辦單位。'
                : '這次報名未被接受，請確認填寫內容，或聯絡主辦單位後再試。';
            throw new Error(`Registration response not confirmed (HTTP ${res.status})`);
        }

        submissionState = 'success';
        document.getElementById('step3').classList.add('hidden');
        document.getElementById('successScreen').classList.remove('hidden');
    } catch (err) {
        console.error('Submit error:', err);
        submissionState = retryableFailure ? 'idle' : 'unknown';
        msg.innerText = retryableFailure
            ? failureMessage
            : '目前無法確認報名結果，資料可能已送達。請先查看確認信（含垃圾郵件）；若已收到，請勿重複送出。若未收到，請透過 Email：hexlabai@gmail.com 或 IG：@ntuaiclub 聯絡主辦單位確認。';
        msg.className = 'result-message result-message-error';
        msg.setAttribute('role', 'alert');
        msg.classList.remove('hidden');
        submitBtn.disabled = !retryableFailure;
        submitBtn.innerText = retryableFailure ? '確認後重新送出' : '請先確認報名狀態';
    }
});

const navbar = document.getElementById('navbar');
const toggleNavbarVisibility = () => {
    if (window.scrollY > 64) {
        navbar.classList.remove('hidden');
    } else {
        navbar.classList.add('hidden');
    }
};

const heroSection = document.getElementById('hero');
const ianAvatar = document.querySelector('.hero-avatar.ian');
const amyAvatar = document.querySelector('.hero-avatar.amy');
const updateHeroAvatarMotion = () => {
    if (!heroSection || !ianAvatar || !amyAvatar) return;

    const maxScroll = heroSection.offsetHeight * 0.65;
    const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
    const baseOffset = window.innerWidth <= 640 ? 15 : 8;
    const extraOffset = 24 * progress;
    const opacity = Math.max(1 - progress, 0);

    ianAvatar.style.transform = `translateX(-${baseOffset + extraOffset}%)`;
    amyAvatar.style.transform = `translateX(${baseOffset + extraOffset}%)`;
    ianAvatar.style.opacity = opacity.toFixed(3);
    amyAvatar.style.opacity = opacity.toFixed(3);
};

window.addEventListener('scroll', toggleNavbarVisibility, { passive: true });
window.addEventListener('scroll', updateHeroAvatarMotion, { passive: true });
window.addEventListener('resize', updateHeroAvatarMotion);
toggleNavbarVisibility();
updateHeroAvatarMotion();
