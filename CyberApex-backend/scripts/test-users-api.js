const http = require('http');

const BASE_URL = 'http://localhost:5000/api/v1/';

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
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null });
                } catch (e) {
                    resolve({ status: res.statusCode, body: body });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) req.write(JSON.stringify(data));
        req.end();
    });
};

const runTest = async () => {
    try {
        console.log("1. Logging in...");
        const loginRes = await makeRequest('POST', 'auth/login', { email: 'admin@acme.com', password: 'TenantAdmin123!' });
        if (loginRes.status !== 200) {
            console.error("Login failed:", loginRes.body);
            return;
        }
        const token = loginRes.body.data.accessToken;
        const tenantId = loginRes.body.data.user.tenantId;
        console.log(`LoggedIn. TenantID: ${tenantId}`);

        console.log(`2. Fetching users for tenant ${tenantId}...`);
        const usersRes = await makeRequest('GET', `tenants/${tenantId}/users`, null, token);
        console.log("Status:", usersRes.status);
        console.log("Body:", JSON.stringify(usersRes.body, null, 2));

    } catch (err) {
        console.error("Error during test:", err);
    }
};

runTest();
