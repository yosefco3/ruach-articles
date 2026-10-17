export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// Brand (site-pivot-books, 2026-10-17): the site is "דרך הרוח", the author writes under a pen name.
export const SITE_NAME = "דרך הרוח";
export const SITE_TAGLINE = "הנבואה הטבעית";
export const SITE_DESCRIPTION =
  "דרך הרוח — הנבואה הטבעית: הספרים, קריאות טארוט ואי צ'ינג, ומורי השיטה. הקשר החי, הישיר והבלתי-מתווך של האדם אל האל.";
/** שם העט של המחבר. השם האמיתי לעולם אינו מופיע באתר. */
export const AUTHOR_NAME = "יונתן בן חנן";

// Domain configuration
export const SITE_DOMAIN = "ruachwisdom.org";
export const SITE_URL_PRODUCTION = `https://${SITE_DOMAIN}`;
export const DEFAULT_FROM_EMAIL = `newsletter@${SITE_DOMAIN}`;

// Upload limit shared by the /api/upload route and the admin form (bytes).
// Raised from 10MB so guided-meditation audio (a 40-minute MP3 is ~20MB) can be attached.
export const MAX_UPLOAD_BYTES = 60 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "60MB";
