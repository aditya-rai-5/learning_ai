import rateLimit from 'express-rate-limit';

/**
 * Global API Rate Limiter
 * Applied to all routes to prevent general abuse (e.g. DDoS, excessive scraping).
 * Allows 100 requests per IP every 15 minutes.
 */
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Auth Rate Limiter
 * Stricter limit applied specifically to /login and /register routes
 * to prevent brute-force credential stuffing attacks.
 * Allows 10 requests per IP every 15 minutes.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per `window`
    message: { error: 'Too many login attempts from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
