import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// API calls should use the api instance from config/api.js which uses the proxy
// Don't set axios.defaults.baseURL here as it conflicts with the proxy setup
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
