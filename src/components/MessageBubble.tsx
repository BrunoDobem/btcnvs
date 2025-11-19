import type { ChatMessage } from '../lib/types';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // React escapa automaticamente o conteúdo, prevenindo XSS

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
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>
    </div>
  );
}

