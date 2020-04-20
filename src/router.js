const { Router } = require('express');

const categories = require('./routes/categories');
const candidates = require('./routes/candidates');
const voteHistory = require('./routes/vote-history');

const router = Router();

router.use(categories.path, categories.router);
router.use(candidates.path, candidates.router);
router.use(voteHistory.path, voteHistory.router);

module.exports = router;
