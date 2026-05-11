const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, '..', 'src');

const classMap = [
    // Backgrounds
    { from: /bg-neutral-950/g, to: 'bg-slate-50' },
    { from: /bg-neutral-900/g, to: 'bg-white shadow-sm' },
    { from: /bg-neutral-800\/50/g, to: 'bg-slate-50 border border-slate-100' },
    { from: /bg-neutral-800\/30/g, to: 'bg-slate-50/50' },
    { from: /bg-neutral-800/g, to: 'bg-slate-100' },
    { from: /hover:bg-neutral-900/g, to: 'hover:bg-white hover:shadow' },
    { from: /hover:bg-neutral-800/g, to: 'hover:bg-slate-50' },
    { from: /hover:bg-neutral-700/g, to: 'hover:bg-slate-100' },
    { from: /bg-black/g, to: 'bg-white' },

    // Borders
    { from: /border-neutral-800\/50/g, to: 'border-slate-100' },
    { from: /border-neutral-800/g, to: 'border-slate-200' },
    { from: /border-neutral-700/g, to: 'border-slate-300' },

    // Texts
    { from: /text-neutral-500/g, to: 'text-slate-500' },
    { from: /text-neutral-400/g, to: 'text-slate-600' },
    { from: /text-neutral-300/g, to: 'text-slate-700' },
    { from: /text-neutral-200/g, to: 'text-slate-800' },
    
    // We only replace text-white when it's standing alone, NOT next to primary colors.
    // A simple regex: replace 'text-white' but later we can manually fix the colored buttons, 
    // or use a more careful approach:
    { from: /(?<!bg-(?:red|blue|purple|green|indigo|orange|yellow|teal|pink)-[456]00.*)text-white(?!.*bg-(?:red|blue|purple|green|indigo|orange|yellow|teal|pink)-[456]00)/g, to: 'text-slate-900' }
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    classMap.forEach(rule => {
        content = content.replace(rule.from, rule.to);
    });

    // Exception fix: If a button has 'text-slate-900' but it's a solid primary color bg, switch it back to white
    // Next.js uses classNames. We'll find classes like "bg-red-600 text-slate-900" and fix them.
    content = content.replace(/bg-(blue|red|green|purple|indigo|orange|teal)-[56]00([^"']*)text-slate-900/g, 'bg-$1-600$2text-white');
    content = content.replace(/text-slate-900([^"']*)bg-(blue|red|green|purple|indigo|orange|teal)-[56]00/g, 'text-white$1bg-$2-600');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

console.log('Starting migration...');
traverse(directory);
console.log('Migration complete.');
