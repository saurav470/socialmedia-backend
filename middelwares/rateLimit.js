const rateLimit = require('express-rate-limit');
// rate limit exports for middelware signup and post
const limiterForPost = rateLimit({
    windowMs: 60 * 20 * 1000,
    max: 1,
    message: 'Too many post created by this IP ADDRESS please try after 20 minute ',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false
})
const limiterForSingUP = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 6,
    message: 'Too many signup request recive from this IP ADDRESS',
})

module.exports = {
    limiterForSingUP,
    limiterForPost
}