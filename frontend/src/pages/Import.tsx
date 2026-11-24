import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { useImports } from '../hooks';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '../components/ui/Toast';

const FILE_TYPES = [
  { value: 'produtos', label: 'Produtos', description: 'SKU, nome, categoria, preços' },
  { value: 'estoque', label: 'Estoque', description: 'Quantidade atual, mínimo' },
  { value: 'lotes', label: 'Lotes', description: 'Código, quantidade, validade' },
  { value: 'vendas', label: 'Vendas', description: 'Data, produto, quantidade' },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Concluído',
  failed: 'Falhou',
  partial: 'Parcial',
};

const STATUS_COLORS: Record<string, 'success' | 'atencao' | 'critico' | 'gray'> = {
  completed: 'success',
  processing: 'atencao',
  failed: 'critico',
  partial: 'atencao',
  pending: 'gray',
};

export function Import() {
  const [selectedType, setSelectedType] = useState('produtos');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [showErrors, setShowErrors] = useState<number | null>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const { addToast } = useToast();

  const { data: imports, loading, error, refetch } = useImports({ skip: 0, limit: 20 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleImport = async () => {
    if (!file) {
      addToast('error', 'Selecione um arquivo');
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/imports?file_type=${selectedType}`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        setErrors(result.errors);
        setShowErrors(result.job_id);
      }

      addToast(result.rejected > 0 ? 'warning' : 'success',
        `Importação concluída: ${result.accepted} aceitos, ${result.rejected} rejeitados`);
      setFile(null);
      refetch();
    } catch (err) {
      addToast('error', 'Erro na importação');
    } finally {
      setImporting(false);
    }
  };

  const handleLoadDemo = async () => {
    setImporting(true);
    try {
      // TODO: Implement demo data loading
      addToast('info', 'Carregando dados de demonstração...');
    } catch {
      addToast('error', 'Erro ao carregar demo');
    } finally {
      setImporting(false);
    }
  };

  const formatStatus = (status: string) => STATUS_LABELS[status] || status;
  const getStatusColor = (status: string) => STATUS_COLORS[status] || 'gray';

  if (loading) return <Loading text="Carregando histórico..." />;

  const historyColumns = [
    { key: 'filename', header: 'Arquivo' },
    { key: 'file_type', header: 'Tipo', render: (row: any) => {
      const type = FILE_TYPES.find(t => t.value === row.file_type);
      return <Badge variant="gray">{type?.label || row.file_type}</Badge>;
    }},
    { key: 'status', header: 'Status', render: (row: any) => <Badge variant={getStatusColor(row.status)}>{formatStatus(row.status)}</Badge>, className: 'text-center' },
    { key: 'imported_at', header: 'Data', render: (row: any) => format(new Date(row.imported_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) },
    { key: 'accepted_rows', header: 'Aceitos', render: (row: any) => row.accepted_rows.toLocaleString('pt-BR'), className: 'text-right' },
    { key: 'rejected_rows', header: 'Rejeitados', render: (row: any) => row.rejected_rows.toLocaleString('pt-BR'), className: 'text-right' },
    { key: 'actions', header: 'Ações', render: (row: any) => (
      row.rejected_rows > 0 && (
        <Button variant="outline" size="sm" onClick={() => { setErrors([]); setShowErrors(row.id); }}>
          <AlertCircle className="w-4 h-4" />
        </Button>
      )
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Importação de CSV</h1>
          <p className="text-gray-500 mt-1">Carregue dados de produtos, estoque, lotes e vendas</p>
        </div>
        <Button variant="outline" onClick={handleLoadDemo} disabled={importing}>
          <Download className="w-4 h-4 mr-2" />
          Carregar Demo
        </Button>
      </div>

      {/* Upload Form */}
      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nova Importação</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Arquivo</label>
              <div className="space-y-2">
                {FILE_TYPES.map((type) => (
                  <label key={type.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedType === type.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="fileType"
                      value={type.value}
                      checked={selectedType === type.value}
                      onChange={() => setSelectedType(type.value)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{type.label}</p>
                      <p className="text-sm text-gray-500">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Arquivo CSV</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                  disabled={importing}
                />
                <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="w-10 h-10 text-gray-400" />
                  <p className="text-gray-600">Clique ou arraste um arquivo CSV</p>
                  <p className="text-sm text-gray-400">Máximo 10MB • Separador: vírgula ou ponto e vírgula</p>
                </label>
                {file && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="text-green-800 font-medium">{file.name}</span>
                    </div>
                    <span className="text-sm text-green-600">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={handleImport} disabled={importing || !file} className="flex-1">
              {importing && <Loading size="sm" />}
              {importing ? 'Importando...' : 'Importar'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* History */}
      <Card>
        <CardBody className="pt-0">
          <h2 className="text-lg font-semibold text-gray-900 p-6 border-b border-gray-100">Histórico de Importações</h2>
          {imports?.length ? (
            <Table
              columns={historyColumns}
              data={imports}
              keyExtractor={(row) => row.id}
            />
          ) : (
            <EmptyState
              title="Nenhuma importação realizada"
              description="Faça sua primeira importação usando o formulário acima"
            />
          )}
        </CardBody>
      </Card>

      {/* Errors Modal */}
      <Modal
        isOpen={!!showErrors}
        onClose={() => { setShowErrors(null); setErrors([]); }}
        title="Erros de Importação"
        size="lg"
      >
        {errors.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {errors.map((error, index) => (
              <div key={index} className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                <p className="font-medium text-danger-800">Linha {error.row_number}</p>
                {error.field && <p className="text-sm text-danger-600">Campo: {error.field}</p>}
                <p className="text-sm text-danger-700">{error.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Nenhum erro" description="Esta importação não teve erros ou os erros não estão disponíveis" />
        )}
      </Modal>
    </div>
  );
}