import React from 'react'
import ReactDOM from 'react-dom/client'
import AppShell from './App'
import './styles/globals.css'
import { HashRouter as Router } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <Router>
        <AppShell />
      </Router>
    </ThemeProvider>
  </React.StrictMode>
)
