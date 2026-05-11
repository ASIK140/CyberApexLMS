const express = require('express');
const router = express.Router();
const tenantTemplatesController = require('../controllers/tenantTemplatesController');

router.get('/', tenantTemplatesController.getTemplates);
router.post('/create', tenantTemplatesController.createTemplate);
router.get('/:id', tenantTemplatesController.getTemplate);
router.put('/:id', tenantTemplatesController.updateTemplate);
router.delete('/:id', tenantTemplatesController.deleteTemplate);

router.post('/preview', tenantTemplatesController.previewTemplate);
router.post('/test-email', tenantTemplatesController.testEmail);

module.exports = router;
