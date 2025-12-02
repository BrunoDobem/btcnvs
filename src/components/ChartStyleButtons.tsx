import type { ChartType, ChartOptions } from '../lib/types';

interface ChartStyleButtonsProps {
  chartOptions: ChartOptions;
  selectedType?: ChartType;
  onSelectChartType: (type: ChartType) => void;
}

const chartTypeLabels: Record<ChartType, string> = {
  bar: 'Barras',
  line: 'Linha',
  pie: 'Pizza',
  area: 'Área',
};

const chartTypeIcons: Record<ChartType, string> = {
  bar: '📊',
  line: '📈',
  pie: '🥧',
  area: '📉',
};

export function ChartStyleButtons({ chartOptions, selectedType, onSelectChartType }: ChartStyleButtonsProps) {
  const { availableTypes } = chartOptions;

  if (availableTypes.length === 0) {
    return null;
  }

  const hasSelectedType = selectedType !== undefined;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-gray-600 mb-2">
        {hasSelectedType ? 'Alterar estilo do gráfico:' : 'Escolha o estilo do gráfico:'}
      </p>
      <div className="flex flex-wrap gap-2">
        {availableTypes.map((type) => {
          const isSelected = type === selectedType;
          return (
            <button
              key={type}
              onClick={() => onSelectChartType(type)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                isSelected
                  ? 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-600'
              }`}
            >
              <span className="mr-1">{chartTypeIcons[type]}</span>
              {chartTypeLabels[type]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

