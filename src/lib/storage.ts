const CONVERSATION_ID_KEY = "chatbot_conversation_id";

/**
 * Gera um novo UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Obtém o conversationId do localStorage ou gera um novo
 */
export function getOrCreateConversationId(): string {
  if (typeof window === 'undefined') {
    return generateUUID();
  }

  const stored = localStorage.getItem(CONVERSATION_ID_KEY);
  if (stored) {
    return stored;
  }

  const newId = generateUUID();
  localStorage.setItem(CONVERSATION_ID_KEY, newId);
  return newId;
}

/**
 * Limpa o conversationId do localStorage (útil para resetar a conversa)
 */
export function clearConversationId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CONVERSATION_ID_KEY);
  }
}

