import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuditDemoPage } from './AuditDemoPage'

export function mountAuditDemo(root: HTMLElement) {
  createRoot(root).render(<StrictMode><AuditDemoPage /></StrictMode>)
}
