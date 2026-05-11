const express = require('express');
const router = express.Router();
const tenantPhishingController = require('../controllers/tenantPhishingController');

// Ensure token and tenant verification middleware would exist here
// In current mock implementation they may pass through or use basic auth middleware

router.get('/campaigns', tenantPhishingController.getCampaigns);
router.get('/campaigns/:id', tenantPhishingController.getCampaign);

router.post('/campaign/create', tenantPhishingController.createDraft);
router.post('/campaign/save-draft', tenantPhishingController.saveDraft);
router.post('/campaign/launch', tenantPhishingController.launchCampaign);

router.get('/templates', tenantPhishingController.getTemplates);
router.post('/event/track', tenantPhishingController.trackEvent);

module.exports = router;
