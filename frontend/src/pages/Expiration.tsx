import { useState } from 'react';
import { AlertTriangle, TrendingDown, DollarSign, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useExpirationRisks } from '../hooks';
import { Table } from '../components/ui/Table';
import { Card, CardBody } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SEVERITY_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'critico', label: 'Crítico' },
  { value: 'atencao', label: 'Atenção' },
  { value: 'normal', label: 'Normal' },
];

const DAYS_OPTIONS = [
  { value: '7', label: '7 dias' },
  { value: '15', label: '15 dias' },
  { value: '30', label: '30 dias' },
  { value: '60', label: '60 dias' },
  { value: '90', label: '90 dias' },
];

export function Expiration() {
  const [daysAhead, setDaysAhead] = useState('30');
  const [severity, setSeverity] = useState('');

  const { data, loading, error, refetch } = useExpirationRisks({ days_ahead: Number(daysAhead), severity: severity || undefined });

  if (loading) return <Loading text="Carregando riscos de vencimento..." />;
  if (error) return <EmptyState title="Erro ao carregar" description={error} action={{ label: 'Tentar novamente', onClick: refetch }} />;

  const columns = [
    { key: 'productName', header: 'Produto' },
    { key: 'productSku', header: 'SKU', className: 'font-mono text-sm hidden md:table-cell' },
    { key: 'category', header: 'Categoria', className: 'hidden lg:table-cell' },
    { key: 'batchCode', header: 'Lote' },
    { key: 'quantity', header: 'Qtd', render: (row: any) => row.quantity.toLocaleString('pt-BR'), className: 'text-right' },
    { key: 'expirationDate', header: 'Validade', render: (row: any) => format(new Date(row.expirationDate), 'dd/MM/yyyy', { locale: ptBR }) },
    { key: 'daysRemaining', header: 'Dias Rest.', render: (row: any) => (
      <span className={row.daysRemaining <= 3 ? 'text-danger-600 font-medium' : row.daysRemaining <= 7 ? 'text-warning-600' : ''}>
        {row.daysRemaining}
      </span>
    ), className: 'text-center' },
    { key: 'dailySales', header: 'Venda/Dia', render: (row: any) => row.dailySales.toFixed(1), className: 'text-right' },
    { key: 'estimatedSales', header: 'Venda Est.', render: (row: any) => row.estimatedSales.toFixed(0), className: 'text-right' },
    { key: 'excess', header: 'Excesso', render: (row: any) => row.excess.toFixed(0), className: 'text-right font-medium text-danger-600' },
    { key: 'exposure', header: 'Exposição (R$)', render: (row: any) => row.exposure.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), className: 'text-right font-medium text-danger-600' },
    { key: 'severity', header: 'Severidade', render: (row: any) => (
      <Badge variant={row.severity}>{row.severity.charAt(0).toUpperCase() + row.severity.slice(1)}</Badge>
    ), className: 'text-center' },
  ];

  // Summary cards
  const criticos = data?.items.filter(i => i.severity === 'critico').length || 0;
  const atencao = data?.items.filter(i => i.severity === 'atencao').length || 0;
  const totalExposure = data?.items.reduce((sum, i) => sum + i.exposure, 0) || 0;
  const totalExcess = data?.items.reduce((sum, i) => sum + i.excess, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inteligência de Vencimentos</h1>
          <p className="text-gray-500 mt-1">Análise FEFO de lotes próximos ao vencimento</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <Select
            label="Período"
            options={DAYS_OPTIONS}
            value={daysAhead}
            onChange={(e) => setDaysAhead(e.target.value)}
            className="w-40"
          />
          <Select
            label="Severidade"
            options={SEVERITY_OPTIONS}
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-l-4 border-danger-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Lotes Críticos</p>
              <p className="text-3xl font-bold text-danger-600">{criticos}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-danger-200" />
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-warning-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Lotes em Atenção</p>
              <p className="text-3xl font-bold text-warning-600">{atencao}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-warning-200" />
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-danger-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unidades em Risco</p>
              <p className="text-3xl font-bold text-gray-900">{totalExcess.toLocaleString('pt-BR')}</p>
            </div>
            <Package className="w-8 h-8 text-danger-200" />
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-danger-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Exposição Financeira</p>
              <p className="text-3xl font-bold text-danger-600">R$ {totalExposure.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <DollarSign className="w-8 h-8 text-danger-200" />
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardBody className="p-0">
          {data?.items.length ? (
            <Table
              columns={columns}
              data={data.items}
              keyExtractor={(row) => row.batchId}
            />
          ) : (
            <EmptyState
              title="Nenhum lote com risco encontrado"
              description={severity ? 'Tente remover o filtro de severidade' : 'Nenhum lote vencendo no período selecionado'}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}

// Need to import Package for the summary card
import { Package } from 'lucide-react';