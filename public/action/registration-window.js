// Shared by the browser and API. The offset fixes the boundary to Taiwan time.
(() => {
    const closesAt = '2026-10-31T23:59:00+08:00';
    const closesAtMs = Date.parse(closesAt);
    function isClosed(now = Date.now()) {
        return now >= closesAtMs;
    }
    globalThis.RegistrationWindow = Object.freeze({ closesAt, closesAtMs, isClosed });
})();
