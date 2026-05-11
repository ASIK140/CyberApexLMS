
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const payload = {
    id: "super-admin-id",
    role: "super_admin",
    email: "admin@cyberapex.io"
};

const secret = process.env.JWT_SECRET || 'cyberapex_super_secret_jwt_key_2026';
const token = jwt.sign(payload, secret, { expiresIn: '365d' });

console.log('NEW_TOKEN:' + token);
