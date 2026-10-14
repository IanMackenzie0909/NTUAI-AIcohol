// ─── Theme data ───────────────────────────────────────────────────────────
const themes = [
    { id: 'founder', title: '創新創業家', desc: 'Jeff Hu（Turing Space CEO、Forbes Asia 30 Under 30）。分享從0到1的創業血淚、募資挑戰與解決痛點的思維，啟發具創業夢的學生。' },
    { id: 'switcher', title: 'AI 人才轉型實戰', desc: 'Ray Chang（IBM / 緯創人資數位轉型、LinkedIn 萬人級社群影響力）。非技術背景如何結合商業洞察，極大化個人品牌競爭力。' },
    { id: 'global', title: '國際探險家', desc: 'Macro Wang（法國里昂管理學院碩士、法/新/越南跨國科技業）。跨國科技業實戰生存術與海外申請策略。' },
    { id: 'tech', title: '技術領航者', desc: 'AI 社內幹部（林奕昕、温冠華、張傑凱）。分享從學術研究到實戰落地的心法與技巧。' },
    { id: 'practitioner', title: 'AI 技術實踐者', desc: 'Cheng Che Kuo（MetAI PM、USPACE Head of Product、Appier Frontend Engineer）。AI 如何真正被應用在工程、產品到開發流程中。' },
    { id: 'pm', title: 'AI 產品實踐', desc: '楊淳佑（Tera Thinker Founder & CEO）。從概念到落地：如何用 AI 解決真實痛點並對齊商業價值。' }
];

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
userStatus.addEventListener('change', function () {
    const status = this.value;
    const statusDetails = document.getElementById('statusDetails');
    const field3Container = document.getElementById('field3Container');

    statusDetails.classList.remove('hidden');

    if (status === 'student') {
        document.getElementById('label1').innerText = '學校名稱';
        document.getElementById('label2').innerText = '系所名稱';
        document.getElementById('label3').innerText = '年級';
        document.getElementById('profDetail1').placeholder = '例如：國立台灣大學';
        document.getElementById('profDetail2').placeholder = '例如：資訊管理學系';
        document.getElementById('profDetail3').placeholder = '例如：三年級';
        field3Container.classList.remove('hidden');
    } else if (status === 'employed') {
        document.getElementById('label1').innerText = '公司名稱';
        document.getElementById('label2').innerText = '職稱部門';
        document.getElementById('profDetail1').placeholder = '例如：Cake';
        document.getElementById('profDetail2').placeholder = '例如：產品經理';
        field3Container.classList.add('hidden');
    } else {
        statusDetails.classList.add('hidden');
    }
});

// ─── Step navigation ──────────────────────────────────────────────────────
function nextStep(step) {
    if (step > currentStep) {
        let valid = true;

        if (currentStep === 1) {
            const status = document.getElementById('userStatus').value;
            const required = ['name', 'phone', 'email', 'userStatus'];

            if (status === 'student') required.push('profDetail1', 'profDetail2', 'profDetail3');
            else if (status === 'employed') required.push('profDetail1', 'profDetail2');

            required.forEach(id => {
                const el = document.getElementById(id);
                if (!el.value) { el.style.borderColor = 'rgba(248,113,113,0.5)'; valid = false; }
                else { el.style.borderColor = ''; }
            });

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
                org: document.getElementById('profDetail1').value,
                dept: document.getElementById('profDetail2').value,
                grade: document.getElementById('profDetail3').value,
            }),
        });
        if (res.ok) {
            const data = await res.json();
            order = data.order;
            reason = data.reason;
        } else {
            console.warn('Recommend API error', await res.text());
        }
    } catch (err) {
        console.warn('Recommend fetch error:', err);
    }

    document.getElementById('recomLoading').style.display = 'none';

    if (order && order.length === 6) {
        sortedThemesResult = order.map(n => themes[n - 1]);
        initialAiOrder = order.join(',');
        initialAiReasons = reason;
        document.getElementById('recomReason').textContent = reason;
        const recomEl = document.getElementById('recomResult');
        recomEl.classList.remove('hidden');
        recomEl.classList.add('recom-reveal');
    } else {
        sortedThemesResult = [...themes];
        initialAiOrder = '1,2,3,4,5,6';
        initialAiReasons = '推薦服務無回應，使用預設排序';
        const errorEl = document.getElementById('recomError');
        errorEl.classList.remove('hidden');
        errorEl.classList.add('recom-reveal');
    }

    if (nextBtn) nextBtn.disabled = false;
    if (submitBtn) submitBtn.disabled = false;

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
                <span class="rank-item-title">${theme.title}</span>
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
    const confirmCheckbox = document.getElementById('confirmCheckbox');
    if (!confirmCheckbox.checked) {
        confirmCheckbox.focus();
        return;
    }
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerText = '發送中...';

    const status = document.getElementById('userStatus').value;

    const payload = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        role: (status === 'employed' || status === 'unemployed') ? 'professional' : status,
        org: document.getElementById('profDetail1').value || 'N/A',
        dept: document.getElementById('profDetail2').value || 'N/A',
        grade: document.getElementById('profDetail3').value || 'N/A',
        ntuai_member: document.getElementById('ntuaiId').value,
        hashtag_1: document.getElementById('tag1').value,
        hashtag_2: document.getElementById('tag2').value,
        hashtag_3: document.getElementById('tag3').value,
        description: document.getElementById('motivation').value,
        ai_order: initialAiOrder,
        ai_reason: initialAiReasons,
        user_order: sortedThemesResult.map(t => themes.indexOf(t) + 1).join(','),
    };

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        document.getElementById('step3').classList.add('hidden');
        document.getElementById('successScreen').classList.remove('hidden');
    } catch (err) {
        console.error('Submit error:', err);
        const msg = document.getElementById('resultMessage');
        msg.innerText = '傳送失敗，請檢查網路連線或稍後再試。';
        msg.className = 'result-message result-message-error';
        msg.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.innerText = '重試發送';
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
