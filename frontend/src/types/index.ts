export interface DashboardResponse {
  totals: {
    products: number;
    criticalStock: number;
    nearExpiration: number;
    stockoutRisk: number;
    inventoryValue: string;
    financialExposure: string;
  };
  charts: {
    byCategory: { category: string; value: number }[];
    salesTrend: { date: string; quantity: number }[];
    riskDistribution: { severity: string; count: number }[];
  };
  replenishment: ReplenishmentItem[];
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string | null;
  unit: string;
  cost_price: string;
  sale_price: string;
  stock_quantity: number;
  minimum_quantity: number;
  is_active: boolean;
}

export interface ProductDetail extends Product {
  supplier: string | null;
  lead_time_days: number | null;
  stock: {
    quantity: number;
    minimum_quantity: number;
    safety_stock: number;
  };
  batches: Batch[];
  recent_sales: Sale[];
}

export interface Batch {
  id: number;
  batch_code: string;
  quantity: number;
  expiration_date: string;
  unit_cost: string;
}

export interface Sale {
  date: string;
  quantity: number;
  unit_price: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface ExpirationRisk {
  batchId: number;
  productId: number;
  productName: string;
  productSku: string;
  category: string | null;
  batchCode: string;
  quantity: number;
  expirationDate: string;
  daysRemaining: number;
  dailySales: number;
  estimatedSales: number;
  excess: number;
  exposure: number;
  unitCost: string;
  severity: 'critico' | 'atencao' | 'normal';
}

export interface ExpirationResponse {
  items: ExpirationRisk[];
  total: number;
}

export interface ReplenishmentItem {
  productId: number;
  sku: string;
  name: string;
  category: string | null;
  currentStock: number;
  minimumQuantity: number;
  dailySales7d: number;
  dailySales30d: number;
  dailySalesUsed: number;
  leadTimeDays: number;
  leadTimeDefaulted: boolean;
  safetyStock: number;
  safetyStockDefaulted: boolean;
  reorderPoint: number;
  projectedStock: number;
  desiredStock: number;
  suggestedQuantity: number;
  supplier: string;
  unitCost: string;
  estimatedCost: number;
}

export interface ReplenishmentResponse {
  items: ReplenishmentItem[];
  total: number;
}

export interface Alert {
  id: number;
  type: string;
  severity: 'critico' | 'atencao' | 'normal';
  message: string;
  status: 'open' | 'acknowledged' | 'resolved' | 'dismissed';
  productId: number;
  productName: string | null;
  productSku: string | null;
  batchId: number | null;
  batchCode: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AlertsResponse {
  items: Alert[];
  total: number;
}

export interface ImportResponse {
  job_id: number;
  accepted: number;
  rejected: number;
  errors: ImportError[];
}

export interface ImportError {
  row_number: number;
  field: string | null;
  message: string;
}

export interface ImportJob {
  id: number;
  filename: string;
  file_type: string;
  status: string;
  imported_at: string;
  accepted_rows: number;
  rejected_rows: number;
  error_summary: string | null;
}

export interface ChatRequest {
  question: string;
}

export interface ChatReference {
  type: 'product' | 'batch' | 'metric';
  id: string;
  label: string;
}

export interface ChatResponse {
  answer: string;
  references: ChatReference[];
  fallback: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}