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
    const detailAnimations = new Set();
    const outgoingLayers = new Set();
    let heightAnimation = null;
    let selected = 'all';
    const easing = 'cubic-bezier(0.215, 0.61, 0.355, 1)';
    const duration = 560;

    function finishMotionClass() {
        if (!cardAnimations.size && !detailAnimations.size && !heightAnimation) explorer.classList.remove('topics-is-moving');
    }

    function cancelMotion() {
        for (const animation of cardAnimations.values()) animation.cancel();
        cardAnimations.clear();
        for (const animation of detailAnimations) animation.cancel();
        detailAnimations.clear();
        for (const layer of outgoingLayers) layer.remove();
        outgoingLayers.clear();
        if (heightAnimation) heightAnimation.cancel();
        heightAnimation = null;
        explorer.classList.remove('topics-is-moving');
    }

    function reveal(element, frames, options, onFinish) {
        if (!element || typeof element.animate !== 'function') {
            onFinish?.();
            return;
        }
        const animation = element.animate(frames, { easing, fill: 'backwards', ...options });
        detailAnimations.add(animation);
        animation.onfinish = () => {
            if (!detailAnimations.delete(animation)) return;
            onFinish?.();
            // Release the effect instead of retaining any final inline styles.
            animation.cancel();
            finishMotionClass();
        };
    }

    function outgoingHeader() {
        if (flavorPanel.hidden) return null;
        const header = flavorPanel.querySelector('.topics-collection-header');
        if (Number(getComputedStyle(header).opacity) < .05) return null;
        const bounds = flavorPanel.getBoundingClientRect();
        const origin = explorer.getBoundingClientRect();
        const surface = getComputedStyle(flavorPanel);
        const layer = document.createElement('div');
        layer.className = 'topics-flavor-exit';
        layer.setAttribute('aria-hidden', 'true');
        layer.inert = true;
        Object.assign(layer.style, {
            left: `${bounds.left - origin.left}px`, top: `${bounds.top - origin.top}px`,
            width: `${bounds.width}px`, height: `${bounds.height}px`,
            padding: surface.padding, borderRadius: surface.borderRadius,
            borderColor: surface.borderTopColor, backgroundImage: surface.backgroundImage,
        });
        // Only the decorative header is copied. The ten real cards never duplicate.
        const copy = header.cloneNode(true);
        const originals = [header, ...header.querySelectorAll('*')];
        const copies = [copy, ...copy.querySelectorAll('*')];
        copies.forEach((element, index) => {
            const style = getComputedStyle(originals[index]);
            element.style.opacity = style.opacity;
            element.style.transform = style.transform;
            element.removeAttribute('id');
            element.removeAttribute('aria-labelledby');
            element.removeAttribute('aria-describedby');
            element.removeAttribute('aria-controls');
        });
        layer.appendChild(copy);
        return layer;
    }

    function revealFlavor(chosen, before, exitLayer) {
        if (exitLayer) {
            outgoingLayers.add(exitLayer);
            explorer.appendChild(exitLayer);
            reveal(exitLayer, [
                { opacity: 1, transform: 'translateY(0)' },
                { opacity: 0, transform: 'translateY(-6px)' },
            ], { duration: 180 }, () => {
                exitLayer.remove();
                outgoingLayers.delete(exitLayer);
            });
        }
        // Color changes soften the collection surface without transforming the
        // parent of the FLIP cards, so their measured positions stay accurate.
        for (const card of cards) {
            const first = before.get(card);
            const last = getComputedStyle(card);
            if (first.background === last.backgroundColor && first.border === last.borderTopColor) continue;
            reveal(card, [
                { backgroundColor: first.background, borderColor: first.border },
                { backgroundColor: last.backgroundColor, borderColor: last.borderTopColor },
            ], { duration: 420 });
        }
        if (flavorPanel.hidden) return;
        const surface = getComputedStyle(flavorPanel);
        reveal(flavorPanel, [
            { backgroundColor: 'rgba(19,19,20,0)', borderColor: 'rgba(255,133,51,0)' },
            { backgroundColor: surface.backgroundColor, borderColor: surface.borderTopColor },
        ], { duration: 380 });
        reveal(flavorPanel.querySelector('.topics-collection-header'), [
            { opacity: 0, transform: 'translateY(10px)' },
            { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 420, delay: 30 });
        reveal(document.getElementById('topics-flavor-image'), [
            { opacity: 0, transform: 'translateY(12px) scale(.96)' },
            { opacity: 1, transform: 'translateY(0) scale(1)' },
        ], { duration: 500, delay: 40 });
        [...document.getElementById('topics-flavor-tags').children].forEach((tag, index) => {
            reveal(tag, [
                { opacity: 0, transform: 'translateY(5px)' },
                { opacity: 1, transform: 'translateY(0)' },
            ], { duration: 320, delay: 60 + index * 24 });
        });
        chosen.forEach((card, index) => {
            reveal(card.querySelector('.topic-drink-pairing'), [
                { opacity: 0, transform: 'translateY(7px)' },
                { opacity: 1, transform: 'translateY(0)' },
            ], { duration: 340, delay: 100 + index * 28 });
        });
        reveal(otherHeader, [
            { opacity: 0, transform: 'translateY(6px)' },
            { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 320, delay: 50 });
    }

    function setFlavor(key, animate = true) {
        if (key !== 'all' && !flavors[key]) return;
        const shouldAnimate = animate && !motionPreference.matches && typeof explorer.animate === 'function';
        const activeElement = document.activeElement;
        const before = new Map(cards.map(card => {
            const style = getComputedStyle(card);
            return [card, { bounds: card.getBoundingClientRect(), background: style.backgroundColor, border: style.borderTopColor }];
        }));
        const beforeHeight = explorer.getBoundingClientRect().height;
        const exitLayer = shouldAnimate ? outgoingHeader() : null;
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
        explorer.dispatchEvent(new CustomEvent('topics:change', {
            bubbles: true, detail: { flavor: key, animate: shouldAnimate, tables: chosen.map(card => card.dataset.table) },
        }));
        if (!shouldAnimate) return;

        const afterHeight = explorer.getBoundingClientRect().height;
        explorer.classList.add('topics-is-moving');
        for (const card of cards) {
            if (typeof card.animate !== 'function') continue;
            const first = before.get(card).bounds;
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
        revealFlavor(chosen, before, exitLayer);
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
