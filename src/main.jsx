import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'
import { aplicarColores, getColorInicial } from './theme.js'

const { principal, secundario } = getColorInicial()
aplicarColores(principal, secundario)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)