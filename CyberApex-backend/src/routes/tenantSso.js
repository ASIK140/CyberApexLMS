const express = require('express');
const router  = express.Router();
const c       = require('../controllers/tenantSsoController');

// SSO Config
router.get('/config',         c.getSsoConfig);
router.post('/config/save',   c.saveSsoConfig);
router.post('/diagnostic',    c.runDiagnostic);

// SCIM
router.get('/scim/config',             c.getScimConfig);
router.post('/scim/sync',              c.syncNow);
router.post('/scim/token/regenerate',  c.regenerateToken);
router.get('/scim/logs',               c.getScimLogs);

module.exports = router;
