const express = require('express');
const router  = express.Router();
const c       = require('../controllers/tenantIntegrationsController');

router.get('/status',             c.getStatus);
router.post('/connect',          c.connect);
router.post('/disconnect',       c.disconnect);
router.post('/sync',             c.sync);
router.get('/logs',              c.getLogs);
router.post('/automation',       c.triggerAutomation);

module.exports = router;
