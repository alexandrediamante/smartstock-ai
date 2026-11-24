import { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useAlerts } from '../hooks';
import { Table } from '../components/ui/Table';
import { Card, CardBody } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '../components/ui/Toast';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'open', label: 'Abertos' },
  { value: 'acknowledged', label: 'Reconhecidos' },
  { value: 'resolved', label: 'Resolvidos' },
  { value: 'dismissed', label: 'Descartados' },
];

const SEVERITY_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'critico', label: 'Crítico' },
  { value: 'atencao', label: 'Atenção' },
  { value: 'normal', label: 'Normal' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'expiring_soon', label: 'Vencendo' },
  { value: 'loss_risk', label: 'Risco de Perda' },
  { value: 'below_reorder', label: 'Abaixo do Ponto' },
  { value: 'stockout_risk', label: 'Risco de Ruptura' },
  { value: 'demand_drop', label: 'Queda de Demanda' },
  { value: 'import_issues', label: 'Problemas Importação' },
];

const TYPE_LABELS: Record<string, string> = {
  expiring_soon: 'Vencendo',
  loss_risk: 'Risco Perda',
  below_reorder: 'Abaixo Ponto',
  stockout_risk: 'Risco Ruptura',
  demand_drop: 'Queda Demanda',
  import_issues: 'Importação',
};

export function Alerts() {
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;
  const { addToast } = useToast();

  const { data, loading, error, refetch } = useAlerts({ status: status || undefined, severity: severity || undefined, type: type || undefined, skip: page * limit, limit });

  const handleAcknowledge = async (id: number) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/alerts/${id}/acknowledge`, { method: 'POST' });
      addToast('success', 'Alerta reconhecido');
      refetch();
    } catch {
      addToast('error', 'Erro ao reconhecer alerta');
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/alerts/${id}/resolve`, { method: 'POST' });
      addToast('success', 'Alerta resolvido');
      refetch();
    } catch {
      addToast('error', 'Erro ao resolver alerta');
    }
  };

  if (loading && page === 0) return <Loading text="Carregando alertas..." />;
  if (error) return <EmptyState title="Erro ao carregar" description={error} action={{ label: 'Tentar novamente', onClick: refetch }} />;

  const columns = [
    { key: 'type', header: 'Tipo', render: (row: any) => <Badge variant="gray">{TYPE_LABELS[row.type] || row.type}</Badge> },
    { key: 'severity', header: 'Severidade', render: (row: any) => <Badge variant={row.severity}>{row.severity.charAt(0).toUpperCase() + row.severity.slice(1)}</Badge>, className: 'text-center' },
    { key: 'message', header: 'Mensagem', className: 'max-w-md' },
    { key: 'productName', header: 'Produto', render: (row: any) => row.productName || '—' },
    { key: 'batchCode', header: 'Lote', render: (row: any) => row.batchCode || '—', className: 'hidden md:table-cell' },
    { key: 'status', header: 'Status', render: (row: any) => {
      const statusLabels: Record<string, string> = {
        open: 'Aberto',
        acknowledged: 'Reconhecido',
        resolved: 'Resolvido',
        dismissed: 'Descartado',
      };
      const statusColors: Record<string, 'critico' | 'atencao' | 'normal' | 'success'> = {
        open: 'critico',
        acknowledged: 'atencao',
        resolved: 'success',
        dismissed: 'gray',
      };
      return <Badge variant={statusColors[row.status] || 'gray'}>{statusLabels[row.status] || row.status}</Badge>;
    }, className: 'text-center' },
    { key: 'createdAt', header: 'Criado em', render: (row: any) => format(new Date(row.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }), className: 'hidden lg:table-cell' },
    { key: 'actions', header: 'Ações', render: (row: any) => (
      <div className="flex items-center gap-1">
        {row.status === 'open' && (
          <Button variant="outline" size="sm" onClick={() => handleAcknowledge(row.id)}>
            <CheckCircle className="w-4 h-4" />
          </Button>
        )}
        {(row.status === 'open' || row.status === 'acknowledged') && (
          <Button variant="outline" size="sm" onClick={() => handleResolve(row.id)}>
            <CheckCircle className="w-4 h-4 text-primary-600" />
          </Button>
        )}
        {row.status !== 'dismissed' && (
          <Button variant="outline" size="sm" onClick={() => handleDismiss(row.id)}>
            <X className="w-4 h-4 text-gray-500" />
          </Button>
        )}
      </div>
    )},
  ];

  const handleDismiss = async (id: number) => {
    // For now, just resolve as dismissed
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/alerts/${id}/resolve`, { method: 'POST' });
      addToast('success', 'Alerta descartado');
      refetch();
    } catch {
      addToast('error', 'Erro ao descartar alerta');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Central de Alertas</h1>
          <p className="text-gray-500 mt-1">Monitore e gerencie alertas de estoque</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            />
            <Select
              label="Severidade"
              options={SEVERITY_OPTIONS}
              value={severity}
              onChange={(e) => { setSeverity(e.target.value); setPage(0); }}
            />
            <Select
              label="Tipo"
              options={TYPE_OPTIONS}
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(0); }}
            />
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardBody className="p-0">
          {data?.items.length ? (
            <>
              <Table
                columns={columns}
                data={data.items}
                keyExtractor={(row) => row.id}
              />
              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Mostrando {page * limit + 1} a {Math.min((page + 1) * limit, data.total)} de {data.total} alertas
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={(page + 1) * limit >= data.total}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <EmptyState title="Nenhum alerta encontrado" description="Todos os alertas foram resolvidos ou não há alertas para os filtros selecionados" />
          )}
        </CardBody>
      </Card>
    </div>
  );
}