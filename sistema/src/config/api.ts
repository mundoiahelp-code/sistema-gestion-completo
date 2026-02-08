import axios from 'axios';

// Usar variable de entorno o fallback a localhost
export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Configurar axios para enviar cookies
axios.defaults.withCredentials = true;
