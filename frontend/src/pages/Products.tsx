import { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useProducts, useCategories } from '../hooks';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table } from '../components/ui/Table';
import { Card, CardBody } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'critical', label: 'Crítico' },
  { value: 'low', label: 'Baixo' },
  { value: 'ok', label: 'OK' },
];

export function Products() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const limit = 20;

  const { data, loading, error, refetch } = useProducts({ skip: page * limit, limit, search, category_id: categoryId || undefined, status: status || undefined });
  const { data: categories } = useCategories();

  const handleRowClick = (product: any) => {
    setSelectedProduct(product);
  };

  if (loading && page === 0) return <Loading text="Carregando produtos..." />;
  if (error) return <EmptyState title="Erro ao carregar" description={error} action={{ label: 'Tentar novamente', onClick: refetch }} />;

  const columns = [
    { key: 'sku', header: 'SKU', className: 'font-mono text-sm' },
    { key: 'name', header: 'Produto' },
    { key: 'category', header: 'Categoria' },
    { key: 'stock_quantity', header: 'Estoque', render: (row: any) => (
      <div>
        <span className="font-medium">{row.stock_quantity.toLocaleString('pt-BR')}</span>
        <span className="text-gray-500 text-xs ml-2">/ {row.minimum_quantity.toLocaleString('pt-BR')}</span>
      </div>
    )},
    { key: 'status', header: 'Status', render: (row: any) => {
      if (row.stock_quantity === 0) return <Badge variant="critico">Zerado</Badge>;
      if (row.stock_quantity <= row.minimum_quantity) return <Badge variant="critico">Crítico</Badge>;
      if (row.stock_quantity <= row.minimum_quantity * 1.5) return <Badge variant="atencao">Baixo</Badge>;
      return <Badge variant="success">OK</Badge>;
    }},
    { key: 'actions', header: '', render: (row: any) => (
      <Button variant="outline" size="sm" onClick={() => navigate(`/produtos/${row.id}`)}>
        Ver detalhes
      </Button>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos & Estoque</h1>
          <p className="text-gray-500 mt-1">Gerencie produtos, categorias e níveis de estoque</p>
        </div>
        <Button onClick={() => navigate('/produtos/novo')}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Produto
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
            <Input
              placeholder="Buscar por nome ou SKU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="lg:col-span-2"
            >
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </Input>
            <Select
              label="Categoria"
              options={[{ value: '', label: 'Todas' }, ...(categories?.map(c => ({ value: c.id, label: c.name })) || [])]}
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value ? Number(e.target.value) : ''); setPage(0); }}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(0); }}
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
                onRowClick={handleRowClick}
              />
              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Mostrando {page * limit + 1} a {Math.min((page + 1) * limit, data.total)} de {data.total} produtos
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
            <EmptyState
              title="Nenhum produto encontrado"
              description={search || categoryId || status ? 'Tente ajustar os filtros' : 'Cadastre o primeiro produto'}
              action={!search && !categoryId && !status ? { label: 'Cadastrar produto', onClick: () => navigate('/produtos/novo') } : undefined}
            />
          )}
        </CardBody>
      </Card>

      {/* Product Detail Modal */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name || 'Detalhes do Produto'}
        size="lg"
      >
        {selectedProduct && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">SKU</p>
                <p className="font-mono text-gray-900">{selectedProduct.sku}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Categoria</p>
                <p className="text-gray-900">{selectedProduct.category || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unidade</p>
                <p className="text-gray-900">{selectedProduct.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fornecedor</p>
                <p className="text-gray-900">{selectedProduct.supplier || 'Não definido'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Preço de Custo</p>
                <p className="text-gray-900">R$ {Number(selectedProduct.cost_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Preço de Venda</p>
                <p className="text-gray-900">R$ {Number(selectedProduct.sale_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Estoque Atual</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Quantidade</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedProduct.stock_quantity.toLocaleString('pt-BR')}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Mínimo</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedProduct.minimum_quantity.toLocaleString('pt-BR')}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Estoque de Segurança</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedProduct.stock?.safety_stock?.toLocaleString('pt-BR') || '0'}</p>
                </div>
              </div>
            </div>

            {selectedProduct.batches && selectedProduct.batches.length > 0 && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Lotes</h3>
                <Table
                  columns={[
                    { key: 'batch_code', header: 'Lote' },
                    { key: 'quantity', header: 'Qtd', render: (row: any) => row.quantity.toLocaleString('pt-BR') },
                    { key: 'expiration_date', header: 'Validade', render: (row: any) => format(new Date(row.expiration_date), 'dd/MM/yyyy', { locale: ptBR }) },
                    { key: 'unit_cost', header: 'Custo Unit.', render: (row: any) => `R$ ${Number(row.unit_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
                  ]}
                  data={selectedProduct.batches}
                  keyExtractor={(row) => row.id}
                />
              </div>
            )}

            {selectedProduct.recent_sales && selectedProduct.recent_sales.length > 0 && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Vendas Recentes (30 dias)</h3>
                <Table
                  columns={[
                    { key: 'date', header: 'Data', render: (row: any) => format(new Date(row.date), 'dd/MM/yyyy', { locale: ptBR }) },
                    { key: 'quantity', header: 'Qtd', render: (row: any) => row.quantity.toLocaleString('pt-BR') },
                    { key: 'unit_price', header: 'Preço Unit.', render: (row: any) => `R$ ${Number(row.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
                  ]}
                  data={selectedProduct.recent_sales}
                  keyExtractor={(row, i) => i}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}