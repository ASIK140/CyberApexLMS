const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = ['node_modules', '.next', 'dist', '.git', 'logs', 'coverage'];
const ALLOWED_EXTS = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.css', '.html', '.env', '.yml', '.yaml'];

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        // Let's do a case-sensitive and case-insensitive check if needed?
        // Usually, the name is CyberApex exactly, but we can do a global replace for "CyberApex" -> "CyberApex"
        // Also lowercase "cyberapex" -> "cyberapex" to catch URLs.
        let original = content;

        content = content.replace(/CyberApex/g, 'CyberApex');
        content = content.replace(/cyberapex/g, 'cyberapex');

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Updated: ${filePath}`);
        }
    } catch (err) {
        console.error(`❌ Error processing ${filePath}: ${err.message}`);
    }
}

function traverse(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                traverse(fullPath);
            }
        } else if (stat.isFile()) {
            const ext = path.extname(file).toLowerCase();
            // Allow exact filename matches like .env without extension, or valid extensions
            if (ALLOWED_EXTS.includes(ext) || file === '.env') {
                processFile(fullPath);
            }
        }
    }
}

console.log('🚀 Starting Deep-Sweep Rename Migration...');
// process Frontend
traverse(path.join(__dirname, '..')); 
// process Backend
traverse(path.join(__dirname, '..', '..', 'cyberapex-backend')); 
console.log('🎉 Global Rename Complete.');
