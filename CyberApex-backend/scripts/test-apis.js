const http = require('http');

console.clear();
console.log("========================================");
console.log("🚀 CyberApex API End-to-End Test Suite");
console.log("========================================\n");

const BASE_URL = 'http://localhost:5000/api';

const makeRequest = (method, path, data = null, token = null) => {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null }));
        });

        req.on('error', (e) => reject(e));

        if (data) req.write(JSON.stringify(data));
        req.end();
    });
};

const runSuite = async () => {
    let superToken = '';
    
    try {
        // 1. Health Check
        process.stdout.write("Test: Health Check... ");
        const health = await makeRequest('GET', '/health');
        if (health.status === 200 && health.body.success) console.log(`✅ Passed (Version: ${health.body.version})`);
        else throw new Error('Health check failed');

        // 2. Authentication Login (Super Admin)
        process.stdout.write("Test: Auth Login (Super Admin)... ");
        const loginRes = await makeRequest('POST', '/auth/login', { email: 'admin@cyberapex.io', password: 'Admin@1234' });
        if (loginRes.status === 200 && loginRes.body.data.token) {
            superToken = loginRes.body.data.token;
            console.log(`✅ Passed (Token obtained for ${loginRes.body.data.user.name})`);
        } else throw new Error('Login failed');

        // 3. /me Endpoint
        process.stdout.write("Test: Auth /me... ");
        const meRes = await makeRequest('GET', '/auth/me', null, superToken);
        if (meRes.status === 200 && meRes.body.data.role === 'super_admin') console.log(`✅ Passed`);
        else throw new Error('/me failed');

        // 4. Rate Limiter Security Check (Auth Endpoint)
        process.stdout.write("Test: Rate Limiter Security (Auth)... ");
        let hitLimit = false;
        for(let i=0; i<12; i++) {
            const spamRes = await makeRequest('POST', '/auth/login', { email: 'invalid@test.com', password: 'bad' });
            if (spamRes.status === 429) hitLimit = true;
        }
        if (hitLimit) console.log(`✅ Passed (Brute-force blocked, returned 429)`);
        else console.log(`❌ Failed (Rate limiter did not block spam requests)`);

        console.log("\n========================================");
        console.log("🏆 API TEST SUITE COMPLETED SUCCESSFULLY");
        console.log("========================================");

    } catch (err) {
        console.log(`❌ FAILED`);
        console.error("Error Details:", err.message);
    }
};

runSuite();
