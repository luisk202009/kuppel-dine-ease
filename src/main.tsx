import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeMonitoring } from '@/lib/monitoring'
import { apiClient } from '@/lib/apiClient'

// Initialize monitoring
initializeMonitoring();

// Initialize secure token loading
apiClient.initializeToken();

createRoot(document.getElementById("root")!).render(<App />);
