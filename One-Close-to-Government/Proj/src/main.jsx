import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { NotificationProvider } from './NotificationContext.jsx'
import { ReportsProvider } from './ReportsContext.jsx'
import { ClerkProvider } from '@clerk/clerk-react'

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_placeholder_key_for_development"

if (!PUBLISHABLE_KEY || PUBLISHABLE_KEY === "pk_test_placeholder_key_for_development") {
  console.warn("Using placeholder Clerk key. Please set VITE_CLERK_PUBLISHABLE_KEY in your .env file for production.")
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      signInFallbackRedirectUrl="/role-redirect"
      signUpFallbackRedirectUrl="/role-redirect"
      appearance={{
        elements: {
          organizationSwitcher: {
            display: "none"
          }
        }
      }}
    >
      <ReportsProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ReportsProvider>
    </ClerkProvider>
  </React.StrictMode>,
);
