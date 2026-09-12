const fs = require('fs');
let content = fs.readFileSync('src/main.tsx', 'utf8');

if (!content.includes('AuthProvider')) {
  content = content.replace("import App from './App.tsx'", "import App from './App.tsx'\nimport { AuthProvider } from './contexts/AuthContext'");
  content = content.replace("<App />", "<AuthProvider><App /></AuthProvider>");
  fs.writeFileSync('src/main.tsx', content);
}

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
if (!appContent.includes('useAuth')) {
  appContent = appContent.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport { useAuth } from './contexts/AuthContext';\nimport { LoginScreen } from './components/LoginScreen';");
  
  // Find where function App() starts
  const funcStart = appContent.indexOf('function App() {');
  const insertIndex = appContent.indexOf('{', funcStart) + 1;
  
  appContent = appContent.substring(0, insertIndex) + "\n  const { isAuthenticated, isLoading } = useAuth();\n  if (isLoading) return null;\n  if (!isAuthenticated) return <LoginScreen />;\n" + appContent.substring(insertIndex);
  fs.writeFileSync('src/App.tsx', appContent);
}

console.log('Patched App for Auth');
