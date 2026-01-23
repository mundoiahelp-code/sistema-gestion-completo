import axios from 'axios';
import { config } from '../config/config.js';

const API_URL = process.env.BACKEND_URL || 'http://localhost:8000/api';
const TENANT_ID = process.env.TENANT_ID || '';

// Cliente HTTP para el backend
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token si existe
apiClient.interceptors.request.use((config) => {
  const token = process.env.BACKEND_TOKEN;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

class BackendClient {
  // ============ TURNOS ============
  async createAppointment(appointmentData) {
    try {
      const response = await apiClient.post('/appointments', {
        date: appointmentData.date,
        time: appointmentData.time,
        customerName: appointmentData.customerName,
        customerPhone: appointmentData.customerPhone,
        product: appointmentData.product,
        productId: appointmentData.productId,
        storeId: appointmentData.storeId,
        notes: appointmentData.notes,
        source: 'WHATSAPP',
      });
      return response.data;
    } catch (error) {
      console.error('Error creando turno:', error.response?.data || error.message);
      throw error;
    }
  }

  async checkAvailability(date, time, storeId = null) {
    try {
      const params = { date, time };
      if (storeId) params.storeId = storeId;
      
      const response = await apiClient.get('/appointments/check-availability', { params });
      return response.data.available;
    } catch (error) {
      console.error('Error verificando disponibilidad:', error.response?.data || error.message);
      return false;
    }
  }

  async getAppointments(date = null) {
    try {
      const params = {};
      if (date) params.date = date;
      
      const response = await apiClient.get('/appointments', { params });
      return response.data.appointments || [];
    } catch (error) {
      console.error('Error obteniendo turnos:', error.response?.data || error.message);
      return [];
    }
  }

  async updateAppointmentStatus(appointmentId, status) {
    try {
      const response = await apiClient.patch(`/appointments/${appointmentId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error actualizando estado de turno:', error.response?.data || error.message);
      throw error;
    }
  }

  async cancelAppointment(customerPhone) {
    try {
      // Buscar turno por teléfono
      const appointments = await this.getAppointments();
      const appointment = appointments.find(apt => 
        apt.customerPhone === customerPhone && 
        apt.status !== 'CANCELLED'
      );

      if (!appointment) return false;

      await this.updateAppointmentStatus(appointment.id, 'CANCELLED');
      return true;
    } catch (error) {
      console.error('Error cancelando turno:', error.response?.data || error.message);
      return false;
    }
  }

  // ============ PRODUCTOS ============
  async getProducts(filters = {}) {
    try {
      const params = { limit: 100 };
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.storeId) params.storeId = filters.storeId;
      
      const response = await apiClient.get('/products', { params });
      return response.data.products || [];
    } catch (error) {
      console.error('Error obteniendo productos:', error.response?.data || error.message);
      return [];
    }
  }

  async searchProducts(query) {
    try {
      const response = await apiClient.get('/products', {
        params: { search: query, limit: 50 }
      });
      return response.data.products || [];
    } catch (error) {
      console.error('Error buscando productos:', error.response?.data || error.message);
      return [];
    }
  }

  async updateProductStock(productId, newStock) {
    try {
      const response = await apiClient.put(`/products/${productId}`, {
        stock: newStock
      });
      return response.data;
    } catch (error) {
      console.error('Error actualizando stock:', error.response?.data || error.message);
      throw error;
    }
  }

  async reserveProduct(productId) {
    try {
      const response = await apiClient.get(`/products/${productId}`);
      const product = response.data;
      
      if (product.stock > 0) {
        await this.updateProductStock(productId, product.stock - 1);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error reservando producto:', error.response?.data || error.message);
      return false;
    }
  }

  // ============ VENTAS ============
  async createSale(saleData) {
    try {
      const response = await apiClient.post('/sales', {
        clientId: saleData.clientId,
        storeId: saleData.storeId,
        items: saleData.items,
        total: saleData.total,
        discount: saleData.discount || 0,
        paymentMethod: saleData.paymentMethod || 'CASH',
        notes: saleData.notes,
      });
      return response.data;
    } catch (error) {
      console.error('Error creando venta:', error.response?.data || error.message);
      throw error;
    }
  }

  async getSales(filters = {}) {
    try {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.clientId) params.clientId = filters.clientId;
      
      const response = await apiClient.get('/sales', { params });
      return response.data.sales || [];
    } catch (error) {
      console.error('Error obteniendo ventas:', error.response?.data || error.message);
      return [];
    }
  }

  // ============ CLIENTES ============
  async findOrCreateClient(clientData) {
    try {
      // Buscar cliente por teléfono
      const response = await apiClient.get('/clients', {
        params: { search: clientData.phone }
      });

      const clients = response.data.clients || [];
      const existingClient = clients.find(c => c.phone === clientData.phone);

      if (existingClient) {
        return existingClient;
      }

      // Crear nuevo cliente
      const newClient = await apiClient.post('/clients', {
        name: clientData.name,
        phone: clientData.phone,
        email: clientData.email,
        address: clientData.address,
      });

      return newClient.data;
    } catch (error) {
      console.error('Error con cliente:', error.response?.data || error.message);
      throw error;
    }
  }

  async getClient(clientId) {
    try {
      const response = await apiClient.get(`/clients/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo cliente:', error.response?.data || error.message);
      return null;
    }
  }

  // ============ ESTADÍSTICAS ============
  async getDashboardStats() {
    try {
      const response = await apiClient.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error.response?.data || error.message);
      return null;
    }
  }

  // ============ UTILIDADES ============
  formatProductForDisplay(products) {
    if (!products || products.length === 0) {
      return 'No hay productos disponibles en este momento 😔';
    }

    let message = '📱 *Stock disponible:*\n\n';
    
    products.forEach((product, index) => {
      message += `${index + 1}. ${product.name}\n`;
      if (product.model) message += `   📱 Modelo: ${product.model}\n`;
      if (product.storage) message += `   💾 Almacenamiento: ${product.storage}\n`;
      if (product.color) message += `   🎨 Color: ${product.color}\n`;
      if (product.battery) message += `   🔋 Batería: ${product.battery}%\n`;
      if (product.condition) message += `   ✨ Estado: ${product.condition}\n`;
      message += `   💰 Precio: $${product.price.toLocaleString('es-AR')}\n`;
      message += `   📦 Stock: ${product.stock}\n`;
      message += `\n`;
    });

    return message.trim();
  }
}

export const backendClient = new BackendClient();
