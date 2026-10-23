(() => {
    const explorer = document.getElementById('topicsExplorer');
    if (!explorer) return;

    const allGrid = document.getElementById('topicsAllGrid');
    const flavorPanel = document.getElementById('topicsFlavor');
    const flavorGrid = document.getElementById('topicsFlavorGrid');
    const otherHeader = document.getElementById('topics-other-header');
    const status = document.getElementById('topics-status');
    const buttons = [...document.querySelectorAll('[data-topic-flavor]')];
    // Table letters and numeric IDs remain the registration catalog's original IDs.
    const cards = [...allGrid.querySelectorAll('.topic-card')]
        .sort((a, b) => a.dataset.table.localeCompare(b.dataset.table));
    const flavors = {
        business: {
            name: '商業頭腦', drink: 'Whisky Collection', chinese: '威士忌調酒系列',
            image: 'old-fashioned', imageAlt: 'Old Fashioned 古典調酒',
            tags: ['威士忌', '醇厚層次', '琥珀色澤'],
            description: '抓住核心，再調和不同層次。把市場洞察、溝通與產品策略，釀成可落地的商業價值。'
        },
        technical: {
            name: '技術取向', drink: 'Gin Collection', chinese: '琴酒調酒系列',
            image: 'dry-martini', imageAlt: 'Dry Martini 乾馬丁尼',
            tags: ['琴酒', '清透草本', '細節調校'],
            description: '從比例到操作，每個細節都影響成品。循著清楚的技術骨架，探索實作、研究與系統的深度。'
        },
        'cross-domain': {
            name: '跨域整合', drink: 'Bitter & Sweet', chinese: '苦甜調和系列',
            image: 'negroni', imageAlt: 'Negroni 尼格羅尼',
            tags: ['苦甜交織', '多元調和', '紅琥珀'],
            description: '讓不同材料各有個性，也能彼此成就。在技術、產品與商業之間，調出新的可能。'
        }
    };
    const drinks = {
        A: { name: 'Old Fashioned', shape: 'rocks', color: '#da8826', garnish: 'peel', caption: '抓住企業核心需求，再以合適工具放大價值。' },
        B: { name: 'Dry Martini', shape: 'martini', color: '#e8d9a8', garnish: 'lemon', caption: '比例與操作細節，決定整體系統的表現。' },
        C: { name: 'Negroni', shape: 'rocks', color: '#d44820', garnish: 'orange', caption: '保留不同能力的特色，組成可運作的事業。' },
        D: { name: 'Manhattan', shape: 'coupe', color: '#b85b2e', garnish: 'cherry', caption: '主軸鮮明、層次有序，串起定位、溝通與行銷。' },
        E: { name: 'Rusty Nail', shape: 'rocks', color: '#b57922', garnish: 'peel', caption: '讓不同角色緊密配合，把元件整合成可交付的產品。' },
        F: { name: 'Tuxedo', shape: 'coupe', color: '#e5d8b4', garnish: 'cherry', caption: '調和多個環節，串起開發、測試與部署。' },
        G: { name: 'Boulevardier', shape: 'coupe', color: '#ba4924', garnish: 'orange', caption: '調整核心材料與配比，就像技術選型改變產品體驗。' },
        H: { name: 'Gibson', shape: 'martini', color: '#ebe6cd', garnish: 'onion', caption: '保留清楚骨架，以關鍵調整回應在地場景。' },
        I: { name: 'Vesper', shape: 'martini', color: '#ead39e', garnish: 'lemon', caption: '讓研究、實習與社群經驗，形成新的配方。' },
        J: { name: 'Rob Roy', shape: 'coupe', color: '#ab5931', garnish: 'cherry', caption: '理解核心基底，讓產品方向貼合實際條件。' }
    };

    function drinkIcon(drink) {
        const outlines = {
            rocks: '<path d="M14 25h44l-4 43H18Z"/>',
            coupe: '<path d="M10 18h52c0 19-10 28-26 28S10 37 10 18Z"/><path d="M36 46v24m-14 0h28"/>',
            martini: '<path d="M9 16h54L36 47Z"/><path d="M36 47v23m-14 0h28"/>'
        };
        const liquids = {
            rocks: '<path d="M17 36h38l-3 28H20Z"/>',
            coupe: '<path d="M13 26h46c-3 11-10 17-23 17S16 37 13 26Z"/>',
            martini: '<path d="M16 23h40L36 44Z"/>'
        };
        const garnishes = {
            peel: '<path d="M47 17c-13 1-18 10-7 12s10 10 1 12" fill="none" stroke="#ff9f3f" stroke-width="4"/>',
            cherry: '<path d="m49 14-12 15" stroke="#b29f7e"/><circle cx="36" cy="31" r="4" fill="#9c2721"/>',
            lemon: '<path d="M48 14c-13 0-15 10-6 11s8 8 2 8" fill="none" stroke="#e7c87f" stroke-width="3"/>',
            onion: '<path d="m52 13-22 22" stroke="#b5aa8c"/><circle cx="36" cy="29" r="5" fill="#dfd8b5"/>',
            orange: '<path d="M46 15a12 12 0 0 1 15 16Z" fill="#f17b2c" stroke="#ffb15a" stroke-width="2"/>'
        };
        return `<svg class="topic-drink-icon" viewBox="0 0 72 80" fill="none" aria-hidden="true" focusable="false"><g fill="${drink.color}" fill-opacity=".55">${liquids[drink.shape]}</g><g stroke="#dcb990" stroke-width="1.5" stroke-linejoin="round">${outlines[drink.shape]}</g>${garnishes[drink.garnish]}</svg>`;
    }

    for (const card of cards) {
        const drink = drinks[card.dataset.table];
        if (!drink) continue;
        const pairing = document.createElement('div');
        pairing.className = 'topic-drink-pairing';
        pairing.hidden = true;
        // All markup comes from the fixed local catalog, never form or API input.
        pairing.innerHTML = `${drinkIcon(drink)}<div class="topic-drink-copy"><p class="topic-drink-name"></p><p class="topic-drink-caption"></p></div>`;
        pairing.querySelector('.topic-drink-name').textContent = drink.name;
        pairing.querySelector('.topic-drink-caption').textContent = drink.caption;
        card.querySelector('.topic-focus').after(pairing);
    }

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const cardAnimations = new Map();
    let heightAnimation = null;
    let selected = 'all';
    const easing = 'cubic-bezier(0.215, 0.61, 0.355, 1)';
    const duration = 560;

    function finishMotionClass() {
        if (!cardAnimations.size && !heightAnimation) explorer.classList.remove('topics-is-moving');
    }

    function cancelMotion() {
        for (const animation of cardAnimations.values()) animation.cancel();
        cardAnimations.clear();
        if (heightAnimation) heightAnimation.cancel();
        heightAnimation = null;
        explorer.classList.remove('topics-is-moving');
    }

    function setFlavor(key, animate = true) {
        if (key !== 'all' && !flavors[key]) return;
        const activeElement = document.activeElement;
        const before = new Map(cards.map(card => [card, card.getBoundingClientRect()]));
        const beforeHeight = explorer.getBoundingClientRect().height;
        // Read currently rendered positions before cancelling an interrupted FLIP.
        cancelMotion();
        selected = key;
        const flavor = flavors[key];
        const chosen = flavor ? cards.filter(card => card.dataset.category === key) : [];
        const remaining = flavor ? cards.filter(card => card.dataset.category !== key) : cards;
        for (const card of cards) {
            const pairing = card.querySelector('.topic-drink-pairing');
            if (pairing) pairing.hidden = !flavor || card.dataset.category !== key;
        }
        document.querySelector('.topics-wine-note').hidden = !flavor;

        if (flavor) {
            document.getElementById('topics-flavor-title').textContent = flavor.name;
            document.getElementById('topics-flavor-count').textContent = `${chosen.length} 桌`;
            document.getElementById('topics-flavor-drink').textContent = flavor.drink;
            document.getElementById('topics-flavor-chinese').textContent = flavor.chinese;
            document.getElementById('topics-flavor-description').textContent = flavor.description;
            const tags = document.getElementById('topics-flavor-tags');
            tags.replaceChildren(...flavor.tags.map(tag => {
                const span = document.createElement('span');
                span.textContent = tag;
                return span;
            }));
            const image = document.getElementById('topics-flavor-image');
            image.src = `./source/assets/cocktails/${flavor.image}.png`;
            image.alt = flavor.imageAlt;
        }

        flavorPanel.hidden = !flavor;
        otherHeader.hidden = !flavor;
        flavorPanel.dataset.flavor = key;
        // Reparent original nodes, preserving all links, portraits and catalog IDs.
        for (const card of chosen) flavorGrid.appendChild(card);
        for (const card of remaining) allGrid.appendChild(card);
        explorer.dataset.flavor = key;
        for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.topicFlavor === key));
        status.textContent = flavor
            ? `已將${flavor.name}的 ${chosen.map(card => card.dataset.table).join('、')} 桌收進風味區；其餘 ${remaining.length} 桌依字母排序。再次點選此風味或「全部桌次」可還原。`
            : '目前依 A 至 J 桌排序，顯示全部十桌。';

        // appendChild may blur a focused link. Keep keyboard position when reparenting.
        if (activeElement && explorer.contains(activeElement) && document.activeElement !== activeElement) {
            activeElement.focus({ preventScroll: true });
        }
        if (!animate || motionPreference.matches || typeof explorer.animate !== 'function') return;

        const afterHeight = explorer.getBoundingClientRect().height;
        explorer.classList.add('topics-is-moving');
        for (const card of cards) {
            if (typeof card.animate !== 'function') continue;
            const first = before.get(card);
            const last = card.getBoundingClientRect();
            if (!first.width || !last.width || !last.height) continue;
            const x = first.left - last.left, y = first.top - last.top;
            const scaleX = first.width / last.width, scaleY = first.height / last.height;
            if (Math.abs(x) < 1 && Math.abs(y) < 1 && Math.abs(scaleX - 1) < .01 && Math.abs(scaleY - 1) < .01) continue;
            const animation = card.animate([
                { transform: `translate(${x}px,${y}px) scale(${scaleX},${scaleY})` },
                { transform: 'translate(0,0) scale(1,1)' }
            ], { duration, easing });
            cardAnimations.set(card, animation);
            animation.onfinish = () => {
                if (cardAnimations.get(card) !== animation) return;
                cardAnimations.delete(card);
                finishMotionClass();
            };
        }
        if (Math.abs(beforeHeight - afterHeight) > 1) {
            const animation = explorer.animate([{ height: `${beforeHeight}px` }, { height: `${afterHeight}px` }], { duration, easing });
            heightAnimation = animation;
            animation.onfinish = () => {
                if (heightAnimation !== animation) return;
                heightAnimation = null;
                finishMotionClass();
            };
        }
        finishMotionClass();
    }

    for (const button of buttons) {
        button.disabled = false;
        button.addEventListener('click', () => {
            const requested = button.dataset.topicFlavor;
            const next = requested === selected ? 'all' : requested;
            if (next === selected) return;
            setFlavor(next);
        });
    }
    window.addEventListener('resize', cancelMotion, { passive: true });
    const onMotionChange = () => { if (motionPreference.matches) cancelMotion(); };
    if (motionPreference.addEventListener) motionPreference.addEventListener('change', onMotionChange);
    else motionPreference.addListener(onMotionChange);
    setFlavor('all', false);
})();
