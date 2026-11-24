import { useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useDashboard } from '../hooks';
import { KPICard } from '../components/ui/KPICard';
import { Card, CardBody } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const SEVERITY_COLORS = {
  critico: '#ef4444',
  atencao: '#f59e0b',
  normal: '#22c55e',
};

export function Dashboard() {
  const { data, loading, error, refetch } = useDashboard();

  if (loading) return <Loading text="Carregando dashboard..." />;
  if (error) return <EmptyState title="Erro ao carregar" description={error} action={{ label: 'Tentar novamente', onClick: refetch }} />;

  const totals = data?.totals;
  const charts = data?.charts;

  const kpis = useMemo(() => [
    {
      label: 'Produtos Cadastrados',
      value: totals?.products || 0,
      icon: <Package className="w-6 h-6" />,
      color: 'blue' as const,
    },
    {
      label: 'Estoque Crítico',
      value: totals?.criticalStock || 0,
      trend: totals?.criticalStock ? { value: totals.criticalStock, label: 'produtos', direction: 'up' as const } : undefined,
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'danger' as const,
    },
    {
      label: 'Próximos ao Vencimento',
      value: totals?.nearExpiration || 0,
      trend: totals?.nearExpiration ? { value: totals.nearExpiration, label: 'lotes', direction: 'up' as const } : undefined,
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'warning' as const,
    },
    {
      label: 'Risco de Ruptura',
      value: totals?.stockoutRisk || 0,
      trend: totals?.stockoutRisk ? { value: totals.stockoutRisk, label: 'produtos', direction: 'up' as const } : undefined,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'danger' as const,
    },
    {
      label: 'Valor do Estoque',
      value: `R$ ${Number(totals?.inventoryValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'primary' as const,
    },
    {
      label: 'Exposição Financeira',
      value: `R$ ${Number(totals?.financialExposure || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      trend: totals?.financialExposure && Number(totals.financialExposure) > 0
        ? { value: Number(totals.financialExposure), label: 'em risco', direction: 'up' as const }
        : undefined,
      icon: <TrendingDown className="w-6 h-6" />,
      color: 'warning' as const,
    },
  ], [totals]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Executivo</h1>
          <p className="text-gray-500 mt-1">Visão geral dos indicadores de estoque</p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products by Category */}
        <Card>
          <CardBody className="p-0">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Produtos por Categoria</h2>
            </div>
            <div className="p-6 h-80">
              {charts?.byCategory?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: number) => [value, 'produtos']}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarWidth={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="Sem dados" description="Importe dados para ver o gráfico" />
              )}
            </div>
          </CardBody>
        </Card>

        {/* Sales Trend */}
        <Card>
          <CardBody className="p-0">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Tendência de Vendas (30 dias)</h2>
            </div>
            <div className="p-6 h-80">
              {charts?.salesTrend?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: number) => [value.toFixed(1), 'unidades']}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="quantity"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="Sem dados" description="Importe vendas para ver a tendência" />
              )}
            </div>
          </CardBody>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardBody className="p-0">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Distribuição de Risco</h2>
            </div>
            <div className="p-6 h-80">
              {charts?.riskDistribution?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="severity"
                      label={({ severity, count }) => `${severity}: ${count}`}
                      labelLine={false}
                    >
                      {charts.riskDistribution.map((entry, index) => (
                        <Cell key={index} fill={SEVERITY_COLORS[entry.severity as keyof typeof SEVERITY_COLORS] || '#9ca3af'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [value, 'alertas']}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="Sem alertas" description="Nenhum alerta ativo no momento" />
              )}
            </div>
          </CardBody>
        </Card>

        {/* Replenishment Summary */}
        <Card>
          <CardBody className="p-0">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Top 5 Reposições Urgentes</h2>
            </div>
            <div className="p-6">
              {data?.replenishment?.length ? (
                <div className="space-y-3">
                  {data.replenishment.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.sku} • {item.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{item.suggestedQuantity.toFixed(0)} un</p>
                        <p className="text-xs text-gray-500">R$ {item.estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="Sem sugestões" description="Nenhuma reposição necessária no momento" />
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}