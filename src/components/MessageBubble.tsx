import type { ChatMessage, ChartType } from '../lib/types';
import { ChartRenderer } from './ChartRenderer';
import { ChartStyleButtons } from './ChartStyleButtons';
import { ChartSuggestion } from './ChartSuggestion';

interface MessageBubbleProps {
  message: ChatMessage;
  onSelectChartType?: (messageId: string, type: ChartType) => void;
  onVisualizeChart?: (messageId: string) => void;
}

export function MessageBubble({ message, onSelectChartType, onVisualizeChart }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // Converter \n em quebras de linha reais
  const formatContent = (content: string) => {
    return content.split('\n').map((line, index, array) => (
      <span key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </span>
    ));
  };

  // Debug em desenvolvimento
  if (import.meta.env.DEV && message.chartData) {
    console.log('Rendering chart in MessageBubble:', message.chartData);
  }

  const handleSelectChartType = (type: ChartType) => {
    if (onSelectChartType) {
      onSelectChartType(message.id, type);
    }
  };

  const handleVisualizeChart = () => {
    if (onVisualizeChart) {
      onVisualizeChart(message.id);
    }
  };

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[80%] md:max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        {message.content && (
          <p className="text-sm break-words">
            {formatContent(message.content)}
          </p>
        )}
        {message.chartSuggestion && (
          <ChartSuggestion
            onVisualize={handleVisualizeChart}
          />
        )}
        {message.chartData && (
          <ChartRenderer chartData={message.chartData} />
        )}
        {message.chartOptions && (
          <ChartStyleButtons
            chartOptions={message.chartOptions}
            selectedType={message.chartData?.type}
            onSelectChartType={handleSelectChartType}
          />
        )}
      </div>
    </div>
  );
}

