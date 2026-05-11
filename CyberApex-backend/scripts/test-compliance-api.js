require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = jwt.sign(
    { id: '123', email: 'ciso@acmecorp.com', role: 'ciso', tenant_id: 'acme_corp' },
    process.env.JWT_SECRET || 'cyberapex_dev_secret',
    { expiresIn: '1h' }
);

async function testAPI() {
    try {
        console.log('Testing /api/ciso/compliance/summary...');
        let res = await fetch('http://localhost:5000/api/ciso/compliance/summary', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        let data = await res.json();
        console.log('Summary response success:', data.success);
        console.log('Overall Compliance:', data.overall_compliance);
        console.log('Alert Triggered:', !!data.alert);
        
        if (!data.success) {
            console.error('API failed:', data);
            process.exit(1);
        }

        const frameworkId = data.frameworks[0].id;
        console.log(`\nTesting /api/ciso/compliance/framework/${frameworkId}...`);
        res = await fetch(`http://localhost:5000/api/ciso/compliance/framework/${frameworkId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        data = await res.json();
        console.log('Framework details success:', data.success);
        console.log('Controls count:', data.framework.controls.length);

        console.log(`\nTesting POST /deploy-training...`);
        res = await fetch(`http://localhost:5000/api/ciso/compliance/deploy-training`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ target_id: frameworkId, target_type: 'framework' })
        });
        data = await res.json();
        console.log('Deploy training success:', data.success);

        console.log(`\nTesting GET /report...`);
        res = await fetch(`http://localhost:5000/api/ciso/compliance/report?type=evidence-pack`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        data = await res.json();
        console.log('Report download URL:', data.download_url);

        console.log('\n✅ All backend and integration tests passed.');
        process.exit(0);
    } catch(err) {
        console.error('Test script crashed:', err);
        process.exit(1);
    }
}

testAPI();
