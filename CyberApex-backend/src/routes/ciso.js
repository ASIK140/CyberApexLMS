'use strict';
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole, tenantIsolation } = require('../middleware/rbac');
const c = require('../controllers/cisoController');

// All CISO routes require JWT auth and ciso (or higher) role
const cisoAuth = [auth.authenticate, tenantIsolation, requireRole('ciso', 'tenant_admin', 'super_admin')];

// ── Dashboard & Risk ──────────────────────────────────────
router.get('/dashboard',          cisoAuth, c.getDashboard);
router.get('/risk-users',         cisoAuth, c.getRiskUsers);
router.get('/compliance/summary', cisoAuth, c.getCompliancePosture);     // Changed from /compliance-posture
router.get('/compliance/framework/:id', cisoAuth, c.getComplianceFrameworkDetail); // New Framework drill-down
router.get('/gap-analysis',       cisoAuth, c.getGapAnalysis);
router.get('/department-risk',    cisoAuth, c.getDepartmentRisk);

// ── Phishing Campaigns ────────────────────────────────────
router.post('/campaigns/create',  cisoAuth, c.createCampaign);
router.get('/campaigns',          cisoAuth, c.getCampaignsList);
router.get('/campaign-results',   cisoAuth, c.getCampaignResults);
router.get('/campaign-funnel',    cisoAuth, c.getCampaignFunnel);

// ── Training & Remedial ───────────────────────────────────
router.get('/training-status',    cisoAuth, c.getTrainingStatus);
router.get('/remedial-tracking',  cisoAuth, c.getRemedialTracking);

// ── Certificates ──────────────────────────────────────────
router.get('/certificates',           cisoAuth, c.getCertificates);
router.post('/certificates/generate', cisoAuth, c.generateCertificate);

// ── Users Directory ───────────────────────────────────────
router.get('/users', cisoAuth, c.getAllUsers);

// ── Reports & Exports ─────────────────────────────────────
router.get('/export',          cisoAuth, c.exportAuditLog);
router.get('/compliance/export',   cisoAuth, c.exportCompliance);
router.post('/evidence-pack',  cisoAuth, c.generateEvidencePack);
router.get('/audit-log',       cisoAuth, c.getAuditLog);

// ── Board Report Data ──
router.get('/board-report/export',  cisoAuth, c.exportBoardReport);
router.get('/board-report/summary', cisoAuth, c.getBoardReportSummary);
router.get('/board-report/metrics', cisoAuth, c.getBoardReportMetrics);
router.get('/board-report/risks',   cisoAuth, c.getBoardReportRisks);
router.post('/board-report/generate', cisoAuth, c.generateBoardReport); 

module.exports = router;
