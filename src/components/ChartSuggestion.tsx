interface ChartSuggestionProps {
  onVisualize: () => void;
}

export function ChartSuggestion({ onVisualize }: ChartSuggestionProps) {
  return (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-xs text-blue-800 mb-2">
        💡 Você pode visualizar esses dados em um gráfico!
      </p>
      <button
        onClick={onVisualize}
        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
      >
        Visualizar em Gráfico
      </button>
    </div>
  );
}

