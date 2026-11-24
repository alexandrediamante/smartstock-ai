import { ShoppingCart, TrendingUp, DollarSign, AlertTriangle, Info } from 'lucide-react';
import { useReplenishment } from '../hooks';
import { Table } from '../components/ui/Table';
import { Card, CardBody } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Replenishment() {
  const { data, loading, error, refetch } = useReplenishment();

  if (loading) return <Loading text="Carregando sugestões de reposição..." />;
  if (error) return <EmptyState title="Erro ao carregar" description={error} action={{ label: 'Tentar novamente', onClick: refetch }} />;

  const columns = [
    { key: 'name', header: 'Produto' },
    { key: 'sku', header: 'SKU', className: 'font-mono text-sm hidden md:table-cell' },
    { key: 'category', header: 'Categoria', className: 'hidden lg:table-cell' },
    { key: 'currentStock', header: 'Estoque Atual', render: (row: any) => row.currentStock.toLocaleString('pt-BR'), className: 'text-right' },
    { key: 'minimumQuantity', header: 'Mínimo', render: (row: any) => row.minimumQuantity.toLocaleString('pt-BR'), className: 'text-right' },
    { key: 'dailySalesUsed', header: 'Venda/Dia', render: (row: any) => row.dailySalesUsed.toFixed(1), className: 'text-right' },
    { key: 'leadTimeDays', header: 'Prazo (dias)', render: (row: any) => (
      <span className={row.leadTimeDefaulted ? 'text-warning-600' : ''}>
        {row.leadTimeDays} {row.leadTimeDefaulted && <Info className="w-3 h-3 inline ml-1" title="Prazo padrão (fornecedor não definido)" />}
      </span>
    ), className: 'text-center' },
    { key: 'safetyStock', header: 'Segurança', render: (row: any) => (
      <span className={row.safetyStockDefaulted ? 'text-warning-600' : ''}>
        {row.safetyStock.toFixed(0)} {row.safetyStockDefaulted && <Info className="w-3 h-3 inline ml-1" title="Estoque de segurança padrão" />}
      </span>
    ), className: 'text-right' },
    { key: 'reorderPoint', header: 'Ponto Reposição', render: (row: any) => row.reorderPoint.toFixed(0), className: 'text-right font-medium' },
    { key: 'projectedStock', header: 'Est. Projetado', render: (row: any) => (
      <span className={row.projectedStock <= 0 ? 'text-danger-600 font-bold' : row.projectedStock <= row.safetyStock ? 'text-warning-600 font-medium' : ''}>
        {row.projectedStock.toFixed(0)}
      </span>
    ), className: 'text-right' },
    { key: 'suggestedQuantity', header: 'Qtd Sugerida', render: (row: any) => (
      <span className="font-bold text-primary-600">{row.suggestedQuantity.toFixed(0)}</span>
    ), className: 'text-right' },
    { key: 'supplier', header: 'Fornecedor', className: 'hidden xl:table-cell' },
    { key: 'estimatedCost', header: 'Custo Est. (R$)', render: (row: any) => row.estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), className: 'text-right font-medium' },
  ];

  const urgentes = data?.items.filter(i => i.projectedStock <= 0).length || 0;
  const atencao = data?.items.filter(i => i.projectedStock > 0 && i.projectedStock <= i.safetyStock).length || 0;
  const totalCost = data?.items.reduce((sum, i) => sum + i.estimatedCost, 0) || 0;
  const totalQty = data?.items.reduce((sum, i) => sum + i.suggestedQuantity, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reposição Inteligente</h1>
          <p className="text-gray-500 mt-1">Sugestões de compra baseadas em ponto de reposição e lead time</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-l-4 border-danger-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Compras Urgentes</p>
              <p className="text-3xl font-bold text-danger-600">{urgentes}</p>
              <p className="text-xs text-gray-500">Risco de ruptura imediata</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-danger-200" />
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-warning-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Atenção</p>
              <p className="text-3xl font-bold text-warning-600">{atencao}</p>
              <p className="text-xs text-gray-500">Estoque projetado abaixo da segurança</p>
            </div>
            <TrendingUp className="w-8 h-8 text-warning-200" />
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total de Unidades</p>
              <p className="text-3xl font-bold text-gray-900">{totalQty.toLocaleString('pt-BR')}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-primary-200" />
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Custo Estimado</p>
              <p className="text-3xl font-bold text-primary-600">R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <DollarSign className="w-8 h-8 text-primary-200" />
          </div>
        </Card>
      </div>

      {/* Legend */}
      <Card className="p-4 bg-gray-50">
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-danger-500"></span> Estoque projetado ≤ 0 (ruptura)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-warning-500"></span> Estoque projetado ≤ segurança</span>
          <span className="flex items-center gap-1"><Info className="w-3 h-3 text-warning-500" /> Valor padrão (fornecedor/segurança não definido)</span>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <CardBody className="p-0">
          {data?.items.length ? (
            <Table
              columns={columns}
              data={data.items}
              keyExtractor={(row) => row.productId}
            />
          ) : (
            <EmptyState
              title="Nenhuma sugestão de reposição"
              description="Todos os produtos estão com estoque adequado"
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}