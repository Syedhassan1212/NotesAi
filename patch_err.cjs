const fs = require('fs');
let content = fs.readFileSync('server/index.js', 'utf8');
content = content.replace(/catch \(err\) \{\n    res\.status\(500\)\.json\(\{ error: 'Server error' \}\);\n  \}/g, "catch (err) { console.error('API Error:', err); res.status(500).json({ error: 'Server error: ' + err.message }); }");
fs.writeFileSync('server/index.js', content);
console.log('Patched errors');
