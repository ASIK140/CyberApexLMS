'use strict';

let IS_PAUSED = false;

let JOBS = [
  { id: 'JOB-8841', type: 'Email Notification', tenant: 'Global Finance Ltd.', status: 'Completed', priority: 'High', added: '2025-03-07 14:50', duration: '1.2s', retries: 0 },
  { id: 'JOB-8840', type: 'Phishing Simulation Launch', tenant: 'TechNova Inc.', status: 'Running', priority: 'Critical', added: '2025-03-07 14:48', duration: '12.4s', retries: 0 },
  { id: 'JOB-8839', type: 'Compliance Report PDF', tenant: 'MediCare Group', status: 'Queued', priority: 'Normal', added: '2025-03-07 14:45', duration: '—', retries: 0 },
  { id: 'JOB-8838', type: 'Bulk User Import', tenant: 'SecureBank PLC', status: 'Failed', priority: 'High', added: '2025-03-07 14:40', duration: '30.1s', retries: 3 },
  { id: 'JOB-8837', type: 'Course Completion Certificate', tenant: 'Acme Corporation', status: 'Completed', priority: 'Normal', added: '2025-03-07 14:35', duration: '0.8s', retries: 0 },
  { id: 'JOB-8836', type: 'Reminder Email Batch', tenant: 'RetailMax', status: 'Queued', priority: 'Low', added: '2025-03-07 14:30', duration: '—', retries: 0 },
  { id: 'JOB-8835', type: 'Risk Score Recalculation', tenant: 'All Tenants', status: 'Running', priority: 'High', added: '2025-03-07 14:25', duration: '44.7s', retries: 1 },
  { id: 'JOB-8834', type: 'Data Export (CSV)', tenant: 'SecureBank PLC', status: 'Failed', priority: 'Normal', added: '2025-03-07 14:20', duration: '8.2s', retries: 2 },
  { id: 'JOB-8833', type: 'Webhook Delivery', tenant: 'LegalShield', status: 'Completed', priority: 'Normal', added: '2025-03-07 14:10', duration: '0.4s', retries: 0 },
  { id: 'JOB-8832', type: 'Audit Log Archive', tenant: 'Global Finance Ltd.', status: 'Completed', priority: 'Low', added: '2025-03-07 14:00', duration: '5.1s', retries: 0 },
];

let EMAILS = [
  { id: 'EML-904', recipient: 'j.harris@globalfinance.com', subject: 'Your Phishing Awareness Certificate', tenant: 'Global Finance Ltd.', status: 'Delivered', sentAt: '14:52', opens: 1 },
  { id: 'EML-903', recipient: 'team@techno.io', subject: 'Simulation Campaign Started', tenant: 'TechNova Inc.', status: 'Sending', sentAt: '14:48', opens: 0 },
  { id: 'EML-902', recipient: '89 users', subject: 'Monthly Training Reminder', tenant: 'MediCare Group', status: 'Queued', sentAt: '—', opens: 0 },
  { id: 'EML-901', recipient: 'admin@securebank.com', subject: 'Bulk Import Error: Action Required', tenant: 'SecureBank PLC', status: 'Bounced', sentAt: '14:42', opens: 0 },
  { id: 'EML-900', recipient: 'a.patel@acme.com', subject: 'Course Completion: Advanced Phishing', tenant: 'Acme Corporation', status: 'Delivered', sentAt: '14:36', opens: 1 },
  { id: 'EML-899', recipient: '44 users', subject: 'Weekly Security Nudge', tenant: 'RetailMax', status: 'Queued', sentAt: '—', opens: 0 },
];

exports.getJobs = (req, res) => {
  res.json({ success: true, data: JOBS });
};

exports.getEmails = (req, res) => {
  res.json({ success: true, data: EMAILS });
};

exports.removeJob = (req, res) => {
  const { id } = req.params;
  JOBS = JOBS.filter(j => j.id !== id);
  res.json({ success: true, message: `Job ${id} removed` });
};

exports.cancelJob = (req, res) => {
  const { id } = req.params;
  const job = JOBS.find(j => j.id === id);
  if (job) {
    job.status = 'Queued'; // or some other status to indicate cancelled
    res.json({ success: true, data: job });
  } else {
    res.status(404).json({ success: false, message: 'Job not found' });
  }
};

exports.retryJob = (req, res) => {
  const { id } = req.params;
  const job = JOBS.find(j => j.id === id);
  if (job) {
    job.status = 'Queued';
    job.retries += 1;
    res.json({ success: true, data: job });
  } else {
    res.status(404).json({ success: false, message: 'Job not found' });
  }
};

exports.retryAllFailed = (req, res) => {
  JOBS.forEach(j => {
    if (j.status === 'Failed') {
      j.status = 'Queued';
      j.retries += 1;
    }
  });
  res.json({ success: true, message: 'All failed jobs re-queued' });
};

exports.cancelEmail = (req, res) => {
  const { id } = req.params;
  const email = EMAILS.find(e => e.id === id);
  if (email) {
    email.status = 'Cancelled';
    res.json({ success: true, data: email });
  } else {
    res.status(404).json({ success: false, message: 'Email not found' });
  }
};

exports.resendEmail = (req, res) => {
  const { id } = req.params;
  const email = EMAILS.find(e => e.id === id);
  if (email) {
    email.status = 'Queued';
    email.sentAt = '—';
    res.json({ success: true, data: email });
  } else {
    res.status(404).json({ success: false, message: 'Email not found' });
  }
};

exports.togglePause = (req, res) => {
  const { paused } = req.body;
  if (typeof paused === 'boolean') {
    IS_PAUSED = paused;
    res.json({ success: true, paused: IS_PAUSED });
  } else {
    res.status(400).json({ success: false, message: 'Invalid paused state' });
  }
};

exports.getPauseStatus = (req, res) => {
  res.json({ success: true, paused: IS_PAUSED });
};
