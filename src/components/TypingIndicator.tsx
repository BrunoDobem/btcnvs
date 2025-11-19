export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-200 rounded-lg px-4 py-2 shadow-sm">
        <div className="flex space-x-1 items-center">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce-delay-1"></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce-delay-2"></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce-delay-3"></div>
        </div>
      </div>
    </div>
  );
}

