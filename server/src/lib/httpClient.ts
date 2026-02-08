import axios, { AxiosInstance, AxiosError } from 'axios';
import { ExternalServiceError, TimeoutError } from './errors';

/**
 * Cliente HTTP configurado con timeout y manejo de errores
 * Para llamadas a servicios externos (WhatsApp bot, APIs, etc)
 */
export const httpClient: AxiosInstance = axios.create({
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para logging en desarrollo
httpClient.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🌐 HTTP Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejo de errores
httpClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ HTTP Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError) => {
    // Timeout
    if (error.code === 'ECONNABORTED') {
      throw new TimeoutError(error.config?.url || 'servicio externo');
    }

    // Error de conexión
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new ExternalServiceError(
        error.config?.url || 'servicio externo',
        'Servicio no disponible'
      );
    }

    // Error de respuesta del servidor
    if (error.response) {
      const service = error.config?.url || 'servicio externo';
      const status = error.response.status;
      const message = error.response.data || error.message;

      if (process.env.NODE_ENV !== 'production') {
        console.error(`❌ HTTP Error: ${status} ${service}`, message);
      }

      throw new ExternalServiceError(service, {
        status,
        message
      });
    }

    // Error genérico
    throw new ExternalServiceError('servicio externo', error.message);
  }
);

/**
 * Cliente HTTP con timeout más corto para operaciones rápidas
 */
export const fastHttpClient: AxiosInstance = axios.create({
  timeout: 5000, // 5 segundos
  headers: {
    'Content-Type': 'application/json'
  }
});

// Aplicar los mismos interceptores
fastHttpClient.interceptors.request.use(httpClient.interceptors.request.handlers[0].fulfilled);
fastHttpClient.interceptors.response.use(
  httpClient.interceptors.response.handlers[0].fulfilled,
  httpClient.interceptors.response.handlers[0].rejected
);

/**
 * Cliente HTTP con timeout largo para operaciones pesadas
 */
export const slowHttpClient: AxiosInstance = axios.create({
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json'
  }
});

// Aplicar los mismos interceptores
slowHttpClient.interceptors.request.use(httpClient.interceptors.request.handlers[0].fulfilled);
slowHttpClient.interceptors.response.use(
  httpClient.interceptors.response.handlers[0].fulfilled,
  httpClient.interceptors.response.handlers[0].rejected
);
