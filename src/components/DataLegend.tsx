import { useState } from 'react';

interface FieldInfo {
  name: string;
  description: string;
  category: 'identificação' | 'campanha' | 'métricas' | 'orçamento' | 'engajamento' | 'segmentação';
}

const dataFields: FieldInfo[] = [
  { name: 'id', description: 'Identificador único do registro', category: 'identificação' },
  { name: 'date', description: 'Data do registro', category: 'identificação' },
  { name: 'campaign_name', description: 'Nome da campanha', category: 'campanha' },
  { name: 'adset_name', description: 'Nome do conjunto de anúncios', category: 'campanha' },
  { name: 'ad_name', description: 'Nome do anúncio', category: 'campanha' },
  { name: 'adset_start_time', description: 'Data/hora de início do conjunto de anúncios', category: 'campanha' },
  { name: 'adset_end_time', description: 'Data/hora de término do conjunto de anúncios', category: 'campanha' },
  { name: 'adset_lifetime_budget', description: 'Orçamento total do conjunto de anúncios', category: 'orçamento' },
  { name: 'impressions', description: 'Número de impressões', category: 'métricas' },
  { name: 'reach', description: 'Alcance (pessoas únicas)', category: 'métricas' },
  { name: 'frequency', description: 'Frequência média de visualização', category: 'métricas' },
  { name: 'link_clicks', description: 'Cliques em links', category: 'métricas' },
  { name: 'sony_conversoes_todos_os_players', description: 'Conversões Sony (todos os players)', category: 'métricas' },
  { name: 'thruplay_actions', description: 'Ações de reprodução completa', category: 'métricas' },
  { name: 'landing_page_views', description: 'Visualizações da página de destino', category: 'métricas' },
  { name: 'cost', description: 'Custo total', category: 'orçamento' },
  { name: 'post_engagements', description: 'Engajamentos no post', category: 'engajamento' },
  { name: 'genero', description: 'Gênero do público-alvo', category: 'segmentação' },
  { name: 'tipo_campanha', description: 'Tipo de campanha', category: 'campanha' },
  { name: 'tipo_compra', description: 'Tipo de compra', category: 'campanha' },
  { name: 'artista', description: 'Artista relacionado', category: 'segmentação' },
];

const categoryColors: Record<FieldInfo['category'], string> = {
  'identificação': 'bg-blue-100 text-blue-800',
  'campanha': 'bg-purple-100 text-purple-800',
  'métricas': 'bg-green-100 text-green-800',
  'orçamento': 'bg-yellow-100 text-yellow-800',
  'engajamento': 'bg-pink-100 text-pink-800',
  'segmentação': 'bg-indigo-100 text-indigo-800',
};

const categoryLabels: Record<FieldInfo['category'], string> = {
  'identificação': 'Identificação',
  'campanha': 'Campanha',
  'métricas': 'Métricas',
  'orçamento': 'Orçamento',
  'engajamento': 'Engajamento',
  'segmentação': 'Segmentação',
};

export function DataLegend() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FieldInfo['category'] | 'all'>('all');

  const categories = Array.from(new Set(dataFields.map(f => f.category))) as FieldInfo['category'][];
  const filteredFields = selectedCategory === 'all' 
    ? dataFields 
    : dataFields.filter(f => f.category === selectedCategory);

  return (
    <div className="relative">
      {/* Botão para abrir/fechar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 top-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        aria-label={isOpen ? 'Fechar legenda' : 'Abrir legenda'}
      >
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="hidden sm:inline">Legenda de Campos</span>
      </button>

      {/* Painel lateral */}
      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Painel */}
          <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 overflow-hidden flex flex-col">
            {/* Cabeçalho */}
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Legenda de Campos</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Fechar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filtros por categoria */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Todos
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory === category
                        ? categoryColors[category]
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {categoryLabels[category]}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de campos */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-3">
                {filteredFields.map((field) => (
                  <div
                    key={field.name}
                    className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                            {field.name}
                          </code>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[field.category]}`}>
                            {categoryLabels[field.category]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{field.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredFields.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p>Nenhum campo encontrado nesta categoria.</p>
                </div>
              )}
            </div>

            {/* Rodapé com contagem */}
            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
              <p className="text-xs text-gray-600 text-center">
                {filteredFields.length} {filteredFields.length === 1 ? 'campo' : 'campos'} 
                {selectedCategory !== 'all' && ` em ${categoryLabels[selectedCategory]}`}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

