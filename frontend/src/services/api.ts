import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  DashboardResponse,
  Product,
  ProductDetail,
  Category,
  ExpirationResponse,
  ReplenishmentResponse,
  AlertsResponse,
  Alert,
  ImportResponse,
  ImportJob,
  ChatResponse,
  ChatReference,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const message = error.response?.data?.detail || error.message;
        console.error('API Error:', message);
        return Promise.reject(new Error(message));
      }
    );
  }

  // Health
  async healthCheck() {
    return this.client.get('/api/health');
  }

  // Dashboard
  async getDashboard(): Promise<DashboardResponse> {
    const response = await this.client.get('/api/dashboard');
    return response.data;
  }

  // Products
  async getProducts(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    category_id?: number;
    status?: string;
  }): Promise<{ items: Product[]; total: number }> {
    const response = await this.client.get('/api/products', { params });
    return response.data;
  }

  async getProduct(id: number): Promise<ProductDetail> {
    const response = await this.client.get(`/api/products/${id}`);
    return response.data;
  }

  async getCategories(): Promise<Category[]> {
    const response = await this.client.get('/api/categories');
    return response.data;
  }

  // Stock
  async getCriticalStock(params?: { skip?: number; limit?: number }) {
    const response = await this.client.get('/api/stock/critical', { params });
    return response.data;
  }

  // Expiration
  async getExpirationRisks(params?: {
    days_ahead?: number;
    severity?: string;
  }): Promise<ExpirationResponse> {
    const response = await this.client.get('/api/expiration/risks', { params });
    return response.data;
  }

  // Replenishment
  async getReplenishment(): Promise<ReplenishmentResponse> {
    const response = await this.client.get('/api/replenishment');
    return response.data;
  }

  // Alerts
  async getAlerts(params?: {
    status?: string;
    severity?: string;
    type?: string;
    skip?: number;
    limit?: number;
  }): Promise<AlertsResponse> {
    const response = await this.client.get('/api/alerts', { params });
    return response.data;
  }

  async acknowledgeAlert(id: number) {
    return this.client.post(`/api/alerts/${id}/acknowledge`);
  }

  async resolveAlert(id: number) {
    return this.client.post(`/api/alerts/${id}/resolve`);
  }

  // Imports
  async importCsv(file: File, fileType: string): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post('/api/imports', formData, {
      params: { file_type: fileType },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async getImports(params?: { skip?: number; limit?: number }): Promise<ImportJob[]> {
    const response = await this.client.get('/api/imports', { params });
    return response.data;
  }

  async getImportErrors(jobId: number) {
    const response = await this.client.get(`/api/imports/${jobId}/errors`);
    return response.data;
  }

  // AI Assistant
  async chat(question: string): Promise<ChatResponse> {
    const response = await this.client.post('/api/ai/chat', { question });
    return response.data;
  }

  async getSuggestedQuestions(): Promise<{ questions: string[] }> {
    const response = await this.client.get('/api/ai/suggestions');
    return response.data;
  }
}

export const api = new ApiService();