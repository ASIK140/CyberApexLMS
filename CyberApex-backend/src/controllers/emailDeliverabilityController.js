const { v4: uuidv4 } = require('uuid');

// Mock data for email domains
const EMAIL_DOMAINS = [
    {
        domain_id: uuidv4(),
        tenant_name: 'Acme Corp',
        tenant_id: 'tenant_001',
        sim_domain: 'sim.acmecorp.com',
        spf_status: 'PASS',
        dkim_status: 'PASS',
        dmarc_policy: 'p=reject',
        bounce_rate: 0.5,
        inbox_rate: 98.2,
        status: 'Healthy',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        domain_id: uuidv4(),
        tenant_name: 'MedGroup Ltd',
        tenant_id: 'tenant_002',
        sim_domain: 'mail.medgroup.org',
        spf_status: 'PASS',
        dkim_status: 'PASS',
        dmarc_policy: 'v=DMARC1; p=none',
        bounce_rate: 3.5,
        inbox_rate: 85.0,
        status: 'Degraded',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        domain_id: uuidv4(),
        tenant_name: 'HealthCo',
        tenant_id: 'tenant_003',
        sim_domain: 'sim.healthco.io',
        spf_status: 'FAIL',
        dkim_status: 'PASS',
        dmarc_policy: 'p=quarantine',
        bounce_rate: 1.2,
        inbox_rate: 92.5,
        status: 'Critical',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        domain_id: uuidv4(),
        tenant_name: 'RetailCo',
        tenant_id: 'tenant_004',
        sim_domain: 'alerts.retailco.com',
        spf_status: 'PASS',
        dkim_status: 'PASS',
        dmarc_policy: '', // Missing DMARC
        bounce_rate: 0.8,
        inbox_rate: 99.0,
        status: 'ActionNeeded',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

// Helper to calculate status based on prompt logic
const calculateStatus = (domain) => {
    if (domain.spf_status === 'FAIL' || domain.dkim_status === 'FAIL') return 'Critical';
    if (!domain.dmarc_policy || domain.dmarc_policy === '') return 'ActionNeeded';
    if (domain.bounce_rate > 3) return 'Degraded';
    return 'Healthy';
};

exports.getDeliverabilityData = async (req, res) => {
    try {
        // In a real app, we'd fetch from DB and recalculate or store status
        const domains = EMAIL_DOMAINS.map(d => ({
            ...d,
            status: calculateStatus(d)
        }));

        res.status(200).json({
            success: true,
            data: domains
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getEmailAlerts = async (req, res) => {
    try {
        const alerts = EMAIL_DOMAINS
            .filter(d => ['Critical', 'ActionNeeded', 'Degraded'].includes(calculateStatus(d)))
            .map(d => {
                const status = calculateStatus(d);
                let type = 'general';
                if (status === 'Critical') type = 'spf';
                else if (status === 'ActionNeeded') type = 'dmarc';
                else if (status === 'Degraded') type = 'delivery';

                return {
                    id: d.domain_id,
                    tenant_name: d.tenant_name,
                    severity: status === 'Critical' ? 'critical' : 'warning',
                    type,
                    message: status === 'Critical' 
                        ? `Unauthenticated simulation emails for ${d.tenant_name} will be spam filtered. Fix SPF/DKIM failures.` 
                        : `DMARC configuration missing or delivery issues detected for ${d.tenant_name}.`
                };
            });

        res.status(200).json({
            success: true,
            alerts
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.fixSPF = async (req, res) => {
    try {
        const { domain_id } = req.body;
        // In reality, we'd find the domain and generate a specific record
        res.status(200).json({
            success: true,
            recommended_record: 'v=spf1 include:cyberapex.io ~all',
            instructions: 'Add this TXT record to your DNS configuration for the simulation domain.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.fixDMARC = async (req, res) => {
    try {
        const { domain_id } = req.body;
        res.status(200).json({
            success: true,
            recommended_record: 'v=DMARC1; p=reject; rua=mailto:dmarc@cyberapex.io',
            instructions: 'Create a TXT record named _dmarc with this value.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.generateDKIM = async (req, res) => {
    try {
        const { domain_id } = req.body;
        res.status(200).json({
            success: true,
            public_key: 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDnxjt...',
            selector: 'cyberapex',
            instructions: 'Add this TXT record to cyberapex._domainkey.[your-domain]'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.exportCSV = async (req, res) => {
    try {
        const headers = 'Tenant,Sim Domain,SPF,DKIM,DMARC,Bounce Rate,Inbox Rate,Status\n';
        const rows = EMAIL_DOMAINS.map(d => 
            `${d.tenant_name},${d.sim_domain},${d.spf_status},${d.dkim_status},"${d.dmarc_policy}",${d.bounce_rate}%,${d.inbox_rate}%,${calculateStatus(d)}`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=email_deliverability.csv');
        res.status(200).send(headers + rows);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.exportExcel = async (req, res) => {
    try {
        // Simplified Excel (just sending CSV with xls extension for mock purposes)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=email_deliverability.xlsx');
        res.status(200).send('Mock Excel Content');
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
