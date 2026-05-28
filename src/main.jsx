// ─────────────────────────────────────────────────────────────────────────────
// src/main.jsx
//
// WHY THIS FILE EXISTS:
// This is the entry point of your entire React application.
// Vite reads this file first when starting/building.
//
// What happens here:
//   1. We import React (needed for JSX to work)
//   2. We import ReactDOM (connects React to the actual browser DOM)
//   3. We import our global CSS (Tailwind + custom styles)
//   4. We find the <div id="root"> in index.html
//   5. We "mount" our <App /> component inside that div
//
// After this, React takes over and handles everything.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import ReactDOM from 'react-dom/client'

// This import loads Tailwind CSS for the ENTIRE app.
// If you forget this line, you get zero styles.
import './index.css'

import App from './App.jsx'

// document.getElementById('root') finds <div id="root"> in index.html
// .createRoot() creates a React root (React 18+ way of rendering)
// .render(<App />) puts your entire App component tree inside that div
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode helps catch bugs during development.
  // It renders components twice to detect side effects.
  // It does NOT affect production builds — it's development-only.
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)