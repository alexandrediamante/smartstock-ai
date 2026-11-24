import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type {
  DashboardResponse,
  Product,
  ProductDetail,
  Category,
  ExpirationResponse,
  ReplenishmentResponse,
  AlertsResponse,
  Alert,
  ImportJob,
  ChatResponse,
} from '../types';

// Generic fetch hook
export function useFetch<T>(fetchFn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// Dashboard
export function useDashboard() {
  return useFetch(() => api.getDashboard());
}

// Products
export function useProducts(params?: { skip?: number; limit?: number; search?: string; category_id?: number; status?: string }) {
  return useFetch(() => api.getProducts(params), [params]);
}

export function useProduct(id: number | null) {
  return useFetch(() => id ? api.getProduct(id) : Promise.reject('No ID'), [id]);
}

export function useCategories() {
  return useFetch(() => api.getCategories());
}

// Stock
export function useCriticalStock(params?: { skip?: number; limit?: number }) {
  return useFetch(() => api.getCriticalStock(params), [params]);
}

// Expiration
export function useExpirationRisks(params?: { days_ahead?: number; severity?: string }) {
  return useFetch(() => api.getExpirationRisks(params), [params]);
}

// Replenishment
export function useReplenishment() {
  return useFetch(() => api.getReplenishment());
}

// Alerts
export function useAlerts(params?: { status?: string; severity?: string; type?: string; skip?: number; limit?: number }) {
  return useFetch(() => api.getAlerts(params), [params]);
}

// Imports
export function useImports(params?: { skip?: number; limit?: number }) {
  return useFetch(() => api.getImports(params), [params]);
}

// AI Assistant
export function useChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (question: string): Promise<ChatResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.chat(question);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading, error };
}

export function useSuggestedQuestions() {
  return useFetch(() => api.getSuggestedQuestions());
}