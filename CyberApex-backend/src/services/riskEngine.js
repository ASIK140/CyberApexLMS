'use strict';
const { logger } = require('../config/logger');

/**
 * Risk Score Formula:
 *   phishing_clicks         → 40 pts max
 *   training_incomplete     → 30 pts max
 *   exam_failure            → 20 pts max
 *   credential_submitted    → 10 pts max
 *   TOTAL                   → 0–100
 *
 * Risk Levels:
 *   0–39   → Low
 *   40–59  → Medium
 *   60–79  → High
 *   80–100 → Critical
 */

const getRiskLevel = (score) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
};

/**
 * Calculate risk score for a single user's data object.
 * @param {Object} userData - { phish_clicks, phish_total, training_completion_pct, exam_score, credential_submitted }
 * @returns {{ risk_score, risk_level, component_scores }}
 */
const calculateUserRisk = (userData) => {
    const {
        phish_clicks = 0,
        phish_total = 1,
        training_completion_pct = 100,
        exam_score = 100,
        credential_submitted = false,
    } = userData;

    // Each component scored 0–1, then weighted
    const clickRate = phish_total > 0 ? phish_clicks / phish_total : 0;
    const trainingIncomplete = Math.max(0, (100 - training_completion_pct) / 100);
    const examFailure = exam_score < 70 ? Math.max(0, (70 - exam_score) / 70) : 0;
    const credSubmit = credential_submitted ? 1 : 0;

    const phish_click_score     = Math.round(clickRate       * 40 * 100) / 100;
    const training_incomplete_score = Math.round(trainingIncomplete * 30 * 100) / 100;
    const exam_failure_score    = Math.round(examFailure     * 20 * 100) / 100;
    const credential_submit_score = Math.round(credSubmit    * 10 * 100) / 100;

    const risk_score = Math.min(100, Math.round(
        phish_click_score + training_incomplete_score + exam_failure_score + credential_submit_score
    ));

    return {
        risk_score,
        risk_level: getRiskLevel(risk_score),
        component_scores: {
            phish_click_score,
            training_incomplete_score,
            exam_failure_score,
            credential_submit_score,
        },
    };
};

/**
 * Calculate org-level risk score (average of all user risk scores).
 * @param {Array} userRiskScores - array of risk_score numbers
 * @returns {number}
 */
const calculateOrgRisk = (userRiskScores) => {
    if (!userRiskScores.length) return 0;
    const sum = userRiskScores.reduce((a, b) => a + b, 0);
    return Math.round(sum / userRiskScores.length);
};

/**
 * BullMQ job processor — recalculates risk for all users in a tenant.
 * In production this reads from DB; here we log the intention.
 */
const processRiskCalculationJob = async (job) => {
    const { tenant_id } = job.data;
    logger.info(`⚡ Risk Calculation Job started for tenant: ${tenant_id}`);

    // Production: query all users in tenant, compute scores, upsert to risk_scores table
    // const users = await User.findAll({ where: { tenant_id } });
    // for (const user of users) {
    //     const userData = await gatherUserRiskData(user.id, tenant_id);
    //     const { risk_score, risk_level, component_scores } = calculateUserRisk(userData);
    //     await RiskScore.upsert({ tenant_id, user_id: user.id, risk_score, risk_level, ...component_scores });
    // }

    logger.info(`✅ Risk Calculation Job completed for tenant: ${tenant_id}`);
    return { success: true, tenant_id, calculated_at: new Date().toISOString() };
};

module.exports = { calculateUserRisk, calculateOrgRisk, getRiskLevel, processRiskCalculationJob };
