/**
 * Utilitários de validação e sanitização para segurança
 */

// Limites de segurança
export const SECURITY_LIMITS = {
  MAX_MESSAGE_LENGTH: 10000, // 10KB
  MAX_HISTORY_LENGTH: 100, // máximo de mensagens no histórico
  MAX_CONVERSATION_ID_LENGTH: 100,
  REQUEST_TIMEOUT_MS: 30000, // 30 segundos
} as const;

/**
 * Valida se uma string é um UUID válido
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Valida o tamanho e conteúdo de uma mensagem
 */
export function validateMessage(message: string): { valid: boolean; error?: string } {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Mensagem inválida' };
  }

  if (message.trim().length === 0) {
    return { valid: false, error: 'Mensagem não pode estar vazia' };
  }

  if (message.length > SECURITY_LIMITS.MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Mensagem muito longa. Máximo de ${SECURITY_LIMITS.MAX_MESSAGE_LENGTH} caracteres.`,
    };
  }

  return { valid: true };
}

/**
 * Valida um conversationId
 */
export function validateConversationId(conversationId: string): { valid: boolean; error?: string } {
  if (!conversationId || typeof conversationId !== 'string') {
    return { valid: false, error: 'ConversationId inválido' };
  }

  if (conversationId.length > SECURITY_LIMITS.MAX_CONVERSATION_ID_LENGTH) {
    return { valid: false, error: 'ConversationId muito longo' };
  }

  // Valida formato UUID básico
  if (!isValidUUID(conversationId)) {
    return { valid: false, error: 'ConversationId em formato inválido' };
  }

  return { valid: true };
}

/**
 * Valida uma URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Garantir que seja HTTPS em produção
    if (import.meta.env.PROD && urlObj.protocol !== 'https:') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitiza uma string removendo caracteres potencialmente perigosos
 * (proteção básica contra XSS)
 * Preserva quebras de linha (\n e \r) para formatação de texto
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove caracteres de controle, mas preserva \n (0x0A) e \r (0x0D) para quebras de linha
  // Remove: \x00-\x09, \x0B-\x0C, \x0E-\x1F, \x7F
  return input
    .replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove caracteres de controle (exceto \n e \r)
    .trim();
}

/**
 * Valida o histórico de mensagens
 */
export function validateHistory(history: Array<{ role: string; content: string }>): {
  valid: boolean;
  error?: string;
} {
  if (!Array.isArray(history)) {
    return { valid: false, error: 'Histórico deve ser um array' };
  }

  if (history.length > SECURITY_LIMITS.MAX_HISTORY_LENGTH) {
    return {
      valid: false,
      error: `Histórico muito longo. Máximo de ${SECURITY_LIMITS.MAX_HISTORY_LENGTH} mensagens.`,
    };
  }

  for (const msg of history) {
    if (msg.role !== 'user' && msg.role !== 'bot') {
      return { valid: false, error: 'Role inválida no histórico' };
    }

    const messageValidation = validateMessage(msg.content);
    if (!messageValidation.valid) {
      return messageValidation;
    }
  }

  return { valid: true };
}

