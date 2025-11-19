import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, disabled = false }: MessageInputProps) {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ajustar altura do textarea automaticamente
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !disabled) {
      onSendMessage(trimmed);
      setInputValue('');
      // Resetar altura do textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="border-t border-gray-200 p-4">
      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
          disabled={disabled}
          className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          rows={1}
          style={{ minHeight: '44px', maxHeight: '120px', overflowY: 'auto' }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !inputValue.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

