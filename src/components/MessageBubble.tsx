import type { ChatMessage } from '../lib/types';
import { ChartRenderer } from './ChartRenderer';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
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
        {message.chartData && (
          <ChartRenderer chartData={message.chartData} />
        )}
      </div>
    </div>
  );
}

