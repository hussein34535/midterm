
// List of banned words/patterns (Arabic & English)
// This is a basic list and can be expanded.
const BANNED_PATTERNS = [
    // English
    /fuck/i, /shit/i, /bitch/i, /asshole/i, /cunt/i, /dick/i, /pussy/i, /whore/i, /slut/i, /nigger/i, /faggot/i, /sex/i, /porn/i,

    // Arabic - Common offensive terms (using wildcards/regex for variations)
    /شرقوص/i, /شرموط/i, /قحبة/i, /منيوك/i, /خول/i, /قواد/i, /عرص/i, /كس/i, /طيز/i, /نيك/i, /لحس/i, /مص/i,
    /زب/i, /سكس/i, /مشعر/i, /بورن/i, /دعارة/i, /مؤخرة/i, /صدر/i,
    /كسمك/i, /يا ابن الكلب/i, /يا ابن المتناكة/i, /يا ابن القحبة/i, /خنيث/i, /ديوث/i
];

export const containsProfanity = (text: string): boolean => {
    if (!text) return false;

    // Normalize text (remove repeated chars, verify generic patterns)
    // Simple check: iterate over patterns
    for (const pattern of BANNED_PATTERNS) {
        if (pattern.test(text)) {
            return true;
        }
    }

    return false;
};

export const maskProfanity = (text: string): string => {
    let masked = text;
    for (const pattern of BANNED_PATTERNS) {
        masked = masked.replace(pattern, '***');
    }
    return masked;
};
