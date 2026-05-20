import rateLimit from 'express-rate-limit';

const RATE_LIMIT_WINDOW_MINUTES = 15;
const MS_PER_MINUTE = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 200;

export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MINUTES * MS_PER_MINUTE,
  max: RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: `Too many requests from this IP, please try again after ${RATE_LIMIT_WINDOW_MINUTES} minutes.`,
  },
});
