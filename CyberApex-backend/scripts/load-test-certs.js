import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50, // 50 Virtual Users
  duration: '30s', // For 30 seconds
};

// Assuming we have a valid certificate verification hash to test the load
const CERT_HASH = 'test_hash_123'; 
const API_BASE = 'http://localhost:5000/api/v1';

export default function () {
  // Simulating public verification endpoint hit
  const res = http.get(`${API_BASE}/verify/${CERT_HASH}`);
  
  check(res, {
    'is status 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  sleep(1);
}
