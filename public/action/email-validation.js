// Shared by the browser and the registration API. GAS keeps a tested copy of inspect.
(() => {
    function inspect(value) {
        function invalid(message) {
            return { valid: false, email: '', message, suggestion: null };
        }
        if (typeof value !== 'string' || !value.trim()) {
            return invalid('請填寫 Email。');
        }
        var email = value.trim();
        if (/[\u3000-\u303f\uff00-\uffef]/.test(email)) {
            return invalid('Email 請使用半形英文字母與標點，例如 name@gmail.com；請檢查全形 @、句點或逗號。');
        }
        if (/\s/.test(email)) return invalid('Email 中間不能有空白，請檢查後再試。');
        if (email.length > 254 || email.split('@').length !== 2) {
            return invalid('請填寫完整的 Email，例如 name@gmail.com。');
        }
        var parts = email.split('@');
        var local = parts[0];
        var domain = parts[1].toLowerCase();
        if (!local || local.length > 64 || !/^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+$/.test(local)
            || local.charAt(0) === '.' || local.slice(-1) === '.' || local.indexOf('..') !== -1) {
            return invalid('Email 帳號格式有誤，請檢查逗號、引號、連續句點或其他多餘標點。');
        }
        var labels = domain.split('.');
        if (labels.length < 2 || labels.some(function(label) {
            return !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label);
        }) || !/^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/.test(labels[labels.length - 1])) {
            return invalid('Email 網域格式有誤，請檢查 @ 後的網域與句點，例如 gmail.com。');
        }
        var commonTypos = {
            'gmial.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmai.com': 'gmail.com',
            'gmal.com': 'gmail.com', 'gmaill.com': 'gmail.com', 'gmail.con': 'gmail.com',
            'gmail.cmo': 'gmail.com', 'gmail.ocm': 'gmail.com', 'gmail.co': 'gmail.com',
            'gmail.com.tw': 'gmail.com', 'gmal.con': 'gmail.com', 'gamil.con': 'gmail.com',
            'hotmai.com': 'hotmail.com', 'hotmial.com': 'hotmail.com', 'hotmaill.com': 'hotmail.com',
            'hotamil.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'hotmail.cmo': 'hotmail.com',
            'outlok.com': 'outlook.com', 'outook.com': 'outlook.com', 'outllook.com': 'outlook.com',
            'outlook.con': 'outlook.com', 'outlook.cmo': 'outlook.com',
            'yaho.com': 'yahoo.com', 'yhaoo.com': 'yahoo.com', 'yaoo.com': 'yahoo.com',
            'yahoo.con': 'yahoo.com', 'yahoo.cmo': 'yahoo.com',
            'yaho.com.tw': 'yahoo.com.tw', 'yhaoo.com.tw': 'yahoo.com.tw',
            'yahoo.con.tw': 'yahoo.com.tw', 'yahoo.com.t': 'yahoo.com.tw', 'yahoo.com.tww': 'yahoo.com.tw',
            'icoud.com': 'icloud.com', 'iclould.com': 'icloud.com', 'icloud.con': 'icloud.com',
            'icloud.cmo': 'icloud.com', 'live.con': 'live.com', 'live.cmo': 'live.com',
            'msn.con': 'msn.com', 'msn.cmo': 'msn.com'
        };
        var suggestedDomain = commonTypos[domain];
        return {
            valid: true,
            email: local + '@' + domain,
            message: suggestedDomain ? 'Email 網域可能有誤，請確認建議信箱，或明確勾選使用原信箱。' : '',
            suggestion: suggestedDomain ? local + '@' + suggestedDomain : null
        };
    }

    globalThis.EmailValidation = Object.freeze({ inspect });
})();
