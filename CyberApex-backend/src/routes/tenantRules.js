const express = require('express');
const router  = express.Router();
const c       = require('../controllers/tenantRulesController');

router.get('/list',                  c.listRules);
router.post('/create',               c.createRule);
router.put('/update/:id',            c.updateRule);
router.post('/toggle',               c.toggleRule);
router.delete('/delete/:id',         c.deleteRule);
router.get('/logs',                  c.getLogs);
router.get('/executions',            c.getExecutions);
router.post('/simulate',             c.simulateTrigger);
router.post('/scheduler/tick',       c.schedulerTick);

module.exports = router;
