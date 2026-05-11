'use strict';
const { v4: uuidv4 } = require('uuid');
const { calculateUserRisk, calculateOrgRisk } = require('../services/riskEngine');
const ExportUtil = require('../utils/exportUtility');
const {
    getUsers, getDepts, getCampaigns, getCompliance,
    getCourses, getRemedial, getCerts, getAuditLogs, MOCK_CAMPAIGNS,
} = require('../services/cisoData');

// Extract tenant_id from JWT; fallback to 'tenant_001' for demo
const getTenant = (req) => {
    if (req.user && req.user.role === 'super_admin') {
        return req.query.tenant_id || req.user.tenant_id || 'tenant_001';
    }
    return req.tenantId;
};

/* ══════════════════════════════════════════════
   1. GET /ciso/dashboard
══════════════════════════════════════════════ */
const getDashboard = (req, res) => {
    try {
        const tenant_id = getTenant(req);
        const users = getUsers(tenant_id);
        const compliance = getCompliance(tenant_id);

        const totalUsers = users.length;
        const totalPhishSent = users.reduce((s, u) => s + u.phish_total, 0);
        const totalPhishClicks = users.reduce((s, u) => s + u.phish_clicks, 0);
        const totalCredSubmit = users.filter(u => u.credential_submitted).length;

        const avgTrainingCompletion = Math.round(users.reduce((s, u) => s + u.training_pct, 0) / totalUsers);
        const avgExamScore = Math.round(users.reduce((s, u) => s + u.exam_score, 0) / totalUsers);
        const criticalUsers = users.filter(u => u.risk_level === 'Critical' || u.risk_level === 'High').length;
        const overdueUsers = users.filter(u => u.training_pct < 50 && u.risk_level !== 'Low').length;

        const orgRiskScore = calculateOrgRisk(users.map(u => u.risk_score));
        const phishClickRate = totalPhishSent > 0 ? ((totalPhishClicks / totalPhishSent) * 100).toFixed(1) : 0;
        const validCerts = Math.floor(totalUsers * 0.65);

        const complianceAvg = Math.round(compliance.reduce((s, c) => s + c.coverage_pct, 0) / compliance.length);

        return res.json({
            success: true,
            data: {
                organization_risk_score: orgRiskScore,
                risk_level: orgRiskScore >= 60 ? 'High' : orgRiskScore >= 40 ? 'Medium' : 'Low',
                critical_users_count: criticalUsers,
                phishing_click_rate: parseFloat(phishClickRate),
                training_completion_rate: avgTrainingCompletion,
                average_exam_score: avgExamScore,
                credential_submissions: totalCredSubmit,
                overdue_learners: overdueUsers,
                certificates_valid: validCerts,
                compliance_coverage: complianceAvg,
                risk_trend: [44, 48, 51, 53, 56, orgRiskScore],
                risk_trend_labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
                top_threats: [
                    { label: 'Credential Submissions', count: totalCredSubmit, severity: 'critical' },
                    { label: 'Repeated Phishing Clicks', count: users.filter(u => u.phish_clicks > 2).length, severity: 'high' },
                    { label: 'Overdue Training', count: overdueUsers, severity: 'medium' },
                ],
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════
   2. GET /ciso/risk-users
══════════════════════════════════════════════ */
const getRiskUsers = (req, res) => {
    try {
        const tenant_id = getTenant(req);
        const users = getUsers(tenant_id);
        const { min_score = 0, department, risk_level, page = 1, limit = 20 } = req.query;

        let filtered = users.filter(u => u.risk_score >= parseFloat(min_score));
        if (department) filtered = filtered.filter(u => u.department.toLowerCase() === department.toLowerCase());
        if (risk_level) filtered = filtered.filter(u => u.risk_level.toLowerCase() === risk_level.toLowerCase());
        filtered.sort((a, b) => b.risk_score - a.risk_score);

        const paginated = filtered.slice((page - 1) * limit, page * limit);

        const result = paginated.map(u => ({
            employee_id: u.id,
            employee_name: u.name,
            email: u.email,
            department: u.department,
            risk_score: u.risk_score,
            risk_level: u.risk_level,
            phish_clicks: u.phish_clicks,
            credential_submissions: u.credential_submitted ? 1 : 0,
            training_completion: u.training_pct,
            exam_score: u.exam_score,
            last_login: u.last_login,
            recommended_action: u.risk_score >= 80 ? 'Immediate remedial training + manager alert'
                : u.risk_score >= 60 ? 'Assign phishing awareness course'
                : u.risk_score >= 40 ? 'Monitor and send reminder'
                : 'No action required',
        }));

        return res.json({ success: true, total: filtered.length, page: parseInt(page), data: result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════
   3. GET /ciso/compliance-posture
══════════════════════════════════════════════ */
const getCompliancePosture = (req, res) => {
    try {
        const tenant_id = getTenant(req);
        const compliance = getCompliance(tenant_id);

        const overallCoverage = Math.round(compliance.reduce((s, c) => s + c.coverage_pct, 0) / compliance.length);
        const compliantCount = compliance.filter(c => c.status === 'Compliant').length;

        return res.json({
            success: true,
            overall_compliance: overallCoverage,
            alert: { message: "DORA and NIS2 frameworks are currently 'At Risk' due to overdue training in Sales." },
            compliant_frameworks: compliantCount,
            total_frameworks: compliance.length,
            frameworks: compliance.map((c, i) => ({
                id: `fw_${i}`,
                name: c.framework,
                description: `Mandatory compliance mapping for ${c.framework}`,
                score: c.coverage_pct,
                training_required: c.training_required,
                training_completed: c.training_completed,
                status: c.status,
                deadline: c.deadline,
                gap_percentage: c.gap_pct,
            })),
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════
   4. GET /ciso/gap-analysis
══════════════════════════════════════════════ */
const getGapAnalysis = (req, res) => {
    try {
        const tenant_id = getTenant(req);
        const compliance = getCompliance(tenant_id);

        const gaps = compliance.map(c => ({
            framework: c.framework,
            requirement: `Complete all ${c.training_required} required training modules`,
            current_completion: c.training_completed,
            target_completion: c.training_required,
            current_coverage_pct: c.coverage_pct,
            gap_percentage: c.gap_pct,
            deadline: c.deadline,
            priority: c.gap_pct >= 50 ? 'Critical' : c.gap_pct >= 30 ? 'High' : c.gap_pct >= 15 ? 'Medium' : 'Low',
            status: c.status,
            recommended_action: c.gap_pct >= 50
                ? 'Immediately launch mandatory training campaign'
                : c.gap_pct >= 30
                ? 'Schedule training sessions within 30 days'
                : 'Regular monitoring recommended',
        })).sort((a, b) => b.gap_percentage - a.gap_percentage);

        const criticalGaps = gaps.filter(g => g.priority === 'Critical').length;

        return res.json({
            success: true,
            data: {
                critical_gaps: criticalGaps,
                total_gaps: gaps.filter(g => g.gap_percentage > 0).length,
                gaps,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════
   5. GET /ciso/department-risk
══════════════════════════════════════════════ */
const getDepartmentRisk = (req, res) => {
    try {
        const tenant_id = getTenant(req);
        const depts = getDepts(tenant_id);

        const sorted = [...depts].sort((a, b) => b.avg_risk - a.avg_risk);
        return res.json({
            success: true,
            data: sorted.map(d => ({
                department_id: d.id,
                department_name: d.name,
                user_count: d.employee_count,
                risk_score: d.avg_risk,
                risk_level: d.avg_risk >= 80 ? 'Critical' : d.avg_risk >= 60 ? 'High' : d.avg_risk >= 40 ? 'Medium' : 'Low',
                phish_click_rate: d.phish_click_rate,
                training_completion: d.training_completion,
                action_required: d.avg_risk >= 60,
            })),
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════
   6. POST /ciso/campaigns/create
══════════════════════════════════════════════ */
const createCampaign = (req, res) => {
    try {
        const tenant_id = getTenant(req);
        const { campaign_name, template_type = 'it_support', difficulty = 'medium', audience = 'all', audience_filter, launch_date } = req.body;

        if (!campaign_name) return res.status(400).json({ success: false, message: 'campaign_name is required' });

        const newCampaign = {
            id: `camp_${uuidv4().slice(0, 8)}`,
            tenant_id,
            campaign_name,
            template_type,
            difficulty,
            audience,
            audience_filter: audience_filter || null,
            target_count: audience === 'all' ? 340 : audience === 'department' ? 45 : 12,
            status: launch_date ? 'scheduled' : 'draft',
            launch_date: launch_date || null,
            created_by: req.user?.id || 'ciso_user',
            created_at: new Date().toISOString(),
        };

        // In production: save to DB and queue schedule job
        return res.status(201).json({ success: true, message: 'Campaign created successfully', data: newCampaign });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════
   7. GET /ciso/campaigns
══════════════════════════════════════════════ */
const getCampaignsList = (req, res) => {
    try {
        const tenant_id = getTenant(req);
        const { status, page = 1, limit = 10 } = req.query;
        let campaigns = getCampaigns(tenant_id);
        if (status) campaigns = campaigns.filter(c => c.status === status);
        const paginated = campaigns.slice((page - 1) * limit, page * limit);
        return res.json({ success: true, total: campaigns.length, page: parseInt(page), data: paginated });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════
   8. GET /ciso/campaign-results
══════════════════════════════════════════════ */
const getCampaignResults = (req, res) => {
    try {
        const tenant_id = getTenant(req);
        const campaigns = getCampaigns(tenant_id);
        const completedCampaigns = campaigns.filter(c => c.status === 'completed' || c.status === 'running');

        return res.json({
            success: true,
            data: completedCampaigns.map(c => ({
                campaign_id: c.id,
                campaign_name: c.campaign_name,
                status: c.status,
                target_count: c.target_count,
                click_rate: c.click_rate,
                submitted_rate: c.submitted_rate,
                launch_date: c.launch_date,
                completed_at: c.completed_at,
                template_type: c.template_type,
                difficulty: c.difficulty,
            })),
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════
   9. GET /ciso/campaign-funnel
══════════════════════════════════════════════ */
const getCampaignFunnel = (req, res) => {
    try {
        const tenant_id = getTenant(req);
        const { campaign_id } = req.query;
        const campaigns = getCampaigns(tenant_id);
        const camp = campaign_id ? campaigns.find(c => c.id === campaign_id) : campaigns.find(c => c.status === 'completed');

        if (!camp) return res.status(404).json({ success: false, message: 'No campaign found' });

        const sent = camp.target_count;
        const opened = Math.floor(sent * 0.72);
        const clicked = Math.floor(sent * (camp.click_rate || 18) / 100);
        const submitted = camp.submitted_rate ? Math.floor(sent * camp.submitted_rate / 100) : Math.floor(clicked * 0.32);
        const reported = Math.floor(sent * 0.08);

        return res.json({
            success: true,
            data: {
                campaign_id: camp.id,
                campaign_name: camp.campaign_name,
                funnel: [
                    { stage: 'Emails Sent',             count: sent,      pct: 100 },
                    { stage: 'Emails Opened',           count: opened,    pct: Math.round(opened / sent * 100) },
                    { stage: 'Links Clicked',           count: clicked,   pct: Math.round(clicked / sent * 100) },
                    { stage: 'Credentials Submitted',   count: submitted, pct: Math.round(submitted / sent * 100) },
                    { stage: 'Reported Phishing',       count: reported,  pct: Math.round(reported / sent * 100) },
                ],
                risk_insight: submitted > 0 ? `${submitted} users submitted credentials — immediate remedial training recommended` : null,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════
   10. GET /ciso/training-status
══════════════════════════════════════════════ */
const getTrainingStatus = (req, res) => {
    try {
        const tenant_id = getTenant(req);
        const courses = getCourses(tenant_id);

        const totalEnrolled = courses.reduce((s, c) => s + c.enrolled, 0);
        const totalCompleted = courses.reduce((s, c) => s + c.completed, 0);
        const overallRate = Math.round(totalCompleted / totalEnrolled * 100);

        return res.json({
            success: true,
            data: {
                overall_completion_rate: overallRate,
                total_enrolled: totalEnrolled,
                total_completed: totalCompleted,
                courses: courses.map(c => ({
                    course_id: c.course_id,
                    course_name: c.course_name,
                    enrolled: c.enrolled,
                    completed: c.completed,
                    in_progress: c.in_progress,
                    not_started: c.not_started,
                    completion_rate: Math.round(c.completed / c.enrolled * 100),
                    average_score: c.avg_score,
                    pass_rate: c.pass_rate,
                    overdue_count: c.overdue,
                    framework_tags: c.framework_tags,
                })),
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════
   11. GET /ciso/remedial-tracking
══════════════════════════════════════════════ */
const getRemedialTracking = (req, res) => {
    try {
        const tenant_id = getTenant(req);
        const { status, trigger_event } = req.query;
        let remedial = getRemedial(tenant_id);
        if (status) remedial = remedial.filter(r => r.status === status);
        if (trigger_event) remedial = remedial.filter(r => r.trigger_event === trigger_event);

        return res.json({
            success: true,
            total: remedial.length,
            overdue: remedial.filter(r => r.status === 'overdue').length,
            data: remedial,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════
   12a. GET /ciso/certificates
══════════════════════════════════════════════ */
const getCertificates = (req, res) => {
    try {
        const tenant_id = getTenant(req);
        const { department, status, page = 1, limit = 20 } = req.query;
        let certs = getCerts(tenant_id);
        if (department) certs = certs.filter(c => c.department.toLowerCase() === department.toLowerCase());
        if (status) certs = certs.filter(c => c.status === status);

        const paginated = certs.slice((page - 1) * limit, page * limit);
        return res.json({
            success: true,
            total: certs.length,
            expiring_soon: certs.filter(c => c.status === 'expiring_soon').length,
            data: paginated,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════
   12b. POST /ciso/certificates/generate
══════════════════════════════════════════════ */
const generateCertificate = (req, res) => {
    try {
        const tenant_id = getTenant(req);
        const { user_id, course_id, score } = req.body;
        if (!user_id || !course_id) return res.status(400).json({ success: false, message: 'user_id and course_id required' });

        const cert = {
            cert_id: `CERT-${uuidv4().slice(0, 8).toUpperCase()}`,
            tenant_id,
            user_id,
            course_id,
            score: score || 80,
            issued_date: new Date().toISOString().split('T')[0],
            expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            cpd_hours: 3,
            status: 'active',
            pdf_url: `https://s3.cyberapex.io/${tenant_id}/certs/${uuidv4()}.pdf`,
        };

        // In production: save to DB, trigger PDF generation job
        return res.status(201).json({ success: true, message: 'Certificate generated', data: cert });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════
   13. GET /ciso/users
══════════════════════════════════════════════ */
const getAllUsers = (req, res) => {
    try {
        const tenant_id = getTenant(req);
        const { search, department, risk_level, page = 1, limit = 20 } = req.query;
        let users = getUsers(tenant_id);

        if (search) users = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
        if (department) users = users.filter(u => u.department.toLowerCase() === department.toLowerCase());
        if (risk_level) users = users.filter(u => u.risk_level.toLowerCase() === risk_level.toLowerCase());

        const paginated = users.slice((page - 1) * limit, page * limit);

        return res.json({
            success: true,
            total: users.length,
            page: parseInt(page),
            data: paginated.map(u => ({
                user_id: u.id,
                employee_name: u.name,
                email: u.email,
                department: u.department,
                role: u.role,
                risk_score: u.risk_score,
                risk_level: u.risk_level,
                training_completion: u.training_pct,
                exam_score: u.exam_score,
                certificate_status: u.training_pct >= 80 ? 'Certified' : u.training_pct >= 50 ? 'In Progress' : 'Not Certified',
                last_login: u.last_login,
            })),
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════
   14. POST /ciso/board-report
══════════════════════════════════════════════ */
const exportBoardReport = async (req, res) => {
    try {
        const tenant_id = getTenant(req);
        const users = getUsers(tenant_id);
        const compliance = getCompliance(tenant_id);
        const orgRisk = calculateOrgRisk(users.map(u => u.risk_score));
        const phishTotal = users.reduce((s, u) => s + u.phish_total, 0);
        const phishClicks = users.reduce((s, u) => s + u.phish_clicks, 0);
        const phishRate = phishTotal > 0 ? ((phishClicks / phishTotal) * 100).toFixed(1) : '0.0';

        const data = [
            { metric: 'Organization Risk Score', value: orgRisk, target: '< 40', status: orgRisk < 40 ? 'Good' : 'Critical' },
            { metric: 'Phishing Click Rate', value: `${phishRate}%`, target: '< 5%', status: parseFloat(phishRate) < 5 ? 'Good' : 'High Risk' },
            { metric: 'Training Completion', value: `${Math.round(users.reduce((s, u) => s + u.training_pct, 0) / users.length)}%`, target: '> 95%', status: 'Warning' },
            { metric: 'Credential Submissions', value: users.filter(u => u.credential_submitted).length, target: '0', status: users.some(u => u.credential_submitted) ? 'Critical' : 'Good' },
            { metric: 'Compliance Coverage', value: `${Math.round(compliance.reduce((s, c) => s + c.coverage_pct, 0) / compliance.length)}%`, target: '100%', status: 'Warning' }
        ];

        const columns = [
            { header: 'Metric', key: 'metric', width: 180 },
            { header: 'Current Value', key: 'value', width: 100 },
            { header: 'Corporate Target', key: 'target', width: 100 },
            { header: 'Status', key: 'status', width: 80 }
        ];

        const filename = `executive_board_report_${new Date().toISOString().split('T')[0]}.pdf`;
        return await ExportUtil.generatePDF(res, 'Executive Security Briefing', columns, data, filename);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const exportCompliance = async (req, res) => {
    try {
        const { format = 'csv' } = req.query;
        const tenant_id = getTenant(req);
        const compliance = getCompliance(tenant_id);
        
        const data = compliance.map(c => ({
            framework: c.framework,
            coverage: `${c.coverage_pct}%`,
            reqs: c.training_required,
            done: c.training_completed,
            status: c.status,
            gap: `${c.gap_pct}%`,
            deadline: c.deadline
        }));

        const columns = [
            { header: 'Framework', key: 'framework', width: 150 },
            { header: 'Coverage', key: 'coverage', width: 70 },
            { header: 'Required', key: 'reqs', width: 60 },
            { header: 'Completed', key: 'done', width: 70 },
            { header: 'Status', key: 'status', width: 80 },
            { header: 'Gap', key: 'gap', width: 60 },
            { header: 'Deadline', key: 'deadline', width: 80 }
        ];

        const filename = `compliance_posture_report_${new Date().toISOString().split('T')[0]}`;

        if (format === 'pdf') {
            return await ExportUtil.generatePDF(res, 'Compliance Framework Posture', columns, data, `${filename}.pdf`);
        } else if (format === 'excel') {
            return await ExportUtil.generateExcel(res, 'Compliance Framework Posture', columns, data, `${filename}.xlsx`);
        } else {
            return ExportUtil.generateCSV(res, columns, data, `${filename}.csv`);
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const exportAuditLog = async (req, res) => {
    try {
        const { format = 'csv' } = req.query;
        const tenant_id = getTenant(req);
        const logs = getAuditLogs(tenant_id);
        
        const columns = [
            { header: 'Timestamp', key: 'timestamp', width: 120 },
            { header: 'Actor', key: 'actor', width: 100 },
            { header: 'Role', key: 'role', width: 80 },
            { header: 'Action', key: 'action', width: 120 },
            { header: 'Target', key: 'target', width: 150 },
            { header: 'IP Address', key: 'ip', width: 100 },
            { header: 'Result', key: 'result', width: 80 }
        ];

        const filename = `tenant_audit_log_${new Date().toISOString().split('T')[0]}`;

        if (format === 'pdf') {
            return await ExportUtil.generatePDF(res, 'Tenant Security Audit Log', columns, logs, `${filename}.pdf`);
        } else if (format === 'excel') {
            return await ExportUtil.generateExcel(res, 'Tenant Security Audit Log', columns, logs, `${filename}.xlsx`);
        } else {
            return ExportUtil.generateCSV(res, columns, logs, `${filename}.csv`);
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════
   15. POST /ciso/evidence-pack
══════════════════════════════════════════════ */
const generateEvidencePack = (req, res) => {
    try {
        const tenant_id = getTenant(req);
        const { frameworks, include_certs = true, include_phishing = true, date_from, date_to } = req.body;

        const pack = {
            export_id: `EVD-${uuidv4().slice(0, 8).toUpperCase()}`,
            tenant_id,
            status: 'processing',
            requested_by: req.user?.email || 'ciso@acme.com',
            created_at: new Date().toISOString(),
            includes: {
                training_completion_logs: true,
                certificates: include_certs,
                exam_results: true,
                phishing_campaign_reports: include_phishing,
                remedial_logs: true,
                frameworks_covered: frameworks || ['ISO 27001', 'GDPR', 'DORA'],
                date_range: { from: date_from || '2026-01-01', to: date_to || new Date().toISOString().split('T')[0] },
            },
            zip_url: `https://s3.cyberapex.io/${tenant_id}/evidence/${Date.now()}.zip`,
            estimated_size_mb: 12,
            estimated_ready_in: '60 seconds',
        };

        return res.status(202).json({ success: true, message: 'Evidence pack generation queued', data: pack });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════
   16. GET /ciso/audit-log
══════════════════════════════════════════════ */
const getAuditLog = (req, res) => {
    try {
        const tenant_id = getTenant(req);
        const { action, actor, result, from, to, page = 1, limit = 25 } = req.query;
        const format = req.query.format;

        let logs = getAuditLogs(tenant_id);
        if (action) logs = logs.filter(l => l.action.toLowerCase().includes(action.toLowerCase()));
        if (actor) logs = logs.filter(l => l.actor.toLowerCase().includes(actor.toLowerCase()));
        if (result) logs = logs.filter(l => l.result === result);

        // CSV export
        if (format === 'csv') {
            const csv = [
                'Timestamp,Actor,Role,Action,Target,IP,Result',
                ...logs.map(l => `${l.timestamp},${l.actor},${l.role || ''},${l.action},${l.target},${l.ip},${l.result}`),
            ].join('\n');
            res.set('Content-Type', 'text/csv');
            res.set('Content-Disposition', `attachment; filename="audit-log-${Date.now()}.csv"`);
            return res.send(csv);
        }

        const paginated = logs.slice((page - 1) * limit, page * limit);
        return res.json({ success: true, total: logs.length, page: parseInt(page), data: paginated });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const getComplianceFrameworkDetail = (req, res) => {
    try {
        const { id } = req.params;
        const fw = {
            id,
            name: 'Selected Framework',
            description: `Detailed operational evidence mapped to framework controls.`,
            score: 78,
            status: 'Review',
            controls: [
                { id: 'c1', name: 'Information Security Policy', requirement: 'Policies must be published and communicated.', status: 'Complete', evidence: ['doc1.pdf', 'doc2.pdf'] },
                { id: 'c2', name: 'Security Awareness Training', requirement: 'All users must complete annual security training.', status: 'In Progress', evidence: ['training_log.csv'] },
                { id: 'c3', name: 'Phishing Simulation Testing', requirement: 'Regular phishing simulations must be conducted.', status: 'At Risk', evidence: [] }
            ]
        };
        return res.json({ success: true, framework: fw });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getBoardReportSummary = (req, res) => {
    return res.json({
        success: true,
        quarter: 'Q1 2026',
        summary: 'CyberApex reports an overall elevated risk profile this quarter due to a 14% phishing failure rate in Sales. However, 88% of our compliance controls remain effectively mapped.',
        metadata: { prepared_by: req.user?.email || 'CISO', classification: 'CONFIDENTIAL - BOARD STRICT' }
    });
};

const getBoardReportMetrics = (req, res) => {
    return res.json({
        success: true,
        metrics: [
            { name: 'Organization Risk Score', history: {'Q3 2025': 42, 'Q4 2025': 49, 'Q1 2026': 58}, target: '< 40' },
            { name: 'Phishing Click Rate', history: {'Q3 2025': '11%', 'Q4 2025': '12%', 'Q1 2026': '14%'}, target: '< 5%' },
            { name: 'Training Completion', history: {'Q3 2025': '92%', 'Q4 2025': '89%', 'Q1 2026': '68%'}, target: '> 95%' },
            { name: 'Incident Reports', history: {'Q3 2025': 4, 'Q4 2025': 2, 'Q1 2026': 1}, target: '0' }
        ]
    });
};

const getBoardReportRisks = (req, res) => {
    return res.json({
        success: true,
        risks: [
            { type: 'Credential Harvesting Vulnerability', severity: 'Critical', description: 'Over 6.2% of users submitted credentials during the last IT Support phishing simulation.' },
            { type: 'Training Fatigue in Sales', severity: 'Warning', description: 'Sales department completion rates dropped to 25%, drastically elevating localized risk.' }
        ],
        recommendations: [
            { action: 'Mandatory Re-training for Clickers', owner: 'HR & CISO', timeline: 'Next 14 Days' },
            { action: 'Deploy Harder Smishing Scenarios', owner: 'SOC Team', timeline: 'Q2 2026' }
        ]
    });
};

const generateBoardReport = (req, res) => {
    return res.json({ success: true, message: 'New Board Report successfully generated from live data!' });
};

module.exports = {
    getDashboard, getRiskUsers, getCompliancePosture, getGapAnalysis, getDepartmentRisk,
    createCampaign, getCampaignsList, getCampaignResults, getCampaignFunnel,
    getTrainingStatus, getRemedialTracking,
    getCertificates, generateCertificate,
    getAllUsers, generateEvidencePack, getAuditLog,
    exportBoardReport, exportCompliance, exportAuditLog,
    getComplianceFrameworkDetail, getBoardReportSummary, getBoardReportMetrics, getBoardReportRisks, generateBoardReport
};
