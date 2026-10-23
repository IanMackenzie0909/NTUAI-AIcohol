// Reveal content once without changing its layout or hiding the static HTML.
(() => {
    const groups = [
        ['.hero-logos, .hero-title-wrap, .hero-sub, .hero-center > .btn-orange', 85],
        ['.about-text > p', 55],
        ['.topics-header', 0],
        ['.topic-card-top', 0],
        ['.topic-focus', 0],
        ['.topic-exp', 0],
        ['.topic-links', 0],
        ['.feedback-header, .feedback-gallery, .feedback-carousel', 0],
        ['.info-section-header', 0],
        ['.info-card', 65],
        ['.reg-card', 0],
        ['.notice-title, .notice-list > li, .notice-links', 0],
        ['.footer-text', 0],
    ];
    const elements = [];
    for (const [selector, stagger] of groups) {
        document.querySelectorAll(selector).forEach((element, index) => {
            element.setAttribute('data-reveal', '');
            element.style.setProperty('--reveal-delay', `${Math.min(index, 3) * stagger}ms`);
            elements.push(element);
        });
    }
    if (!elements.length) return;

    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const pending = new Set(elements);
    let observer;

    function reveal(element, immediate = false) {
        if (!pending.delete(element)) {
            if (immediate) element.classList.remove('is-reveal-active');
            return;
        }
        observer?.unobserve(element);
        element.classList.remove('is-reveal-pending');
        element.classList.add('is-revealed');
        if (!immediate) element.classList.add('is-reveal-active');
        if (!pending.size) observer?.disconnect();
    }

    function revealAll() {
        observer?.disconnect();
        for (const element of elements) {
            reveal(element, true);
            element.classList.remove('is-reveal-active');
        }
    }

    // Without JS, observers, or motion support, the original content stays readable.
    if (preference?.matches || typeof window.IntersectionObserver !== 'function') {
        revealAll();
        return;
    }

    try {
        observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (entry.isIntersecting) reveal(entry.target);
            }
        }, { rootMargin: '0px 0px -24px 0px', threshold: 0.01 });
        for (const element of elements) {
            observer.observe(element);
            element.classList.add('is-reveal-pending');
        }
    } catch {
        revealAll();
        return;
    }

    document.addEventListener('animationend', event => {
        if (event.animationName === 'pageContentReveal') {
            event.target.classList.remove('is-reveal-active');
        }
    });
    // Keyboard navigation must never land on a transparent link or form field.
    document.addEventListener('focusin', event => {
        const element = event.target.closest('[data-reveal]');
        if (element) reveal(element, true);
    });

    function revealHashTarget() {
        let id;
        try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
        const target = id && document.getElementById(id);
        if (!target) return;
        const parent = target.closest('[data-reveal]');
        if (parent) reveal(parent, true);
        target.querySelectorAll('[data-reveal]').forEach(element => reveal(element, true));
    }
    window.addEventListener('hashchange', revealHashTarget);
    revealHashTarget();
    window.addEventListener('pageshow', event => { if (event.persisted) revealAll(); });
    document.addEventListener('beforematch', revealAll);

    const onMotionChange = () => { if (preference.matches) revealAll(); };
    if (preference?.addEventListener) preference.addEventListener('change', onMotionChange);
    else preference?.addListener(onMotionChange);
})();
