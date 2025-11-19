/**
 * Rate Limiter simples no frontend
 * Previne spam de requisições
 */

interface RateLimitState {
  count: number;
  resetTime: number;
}

const RATE_LIMIT = {
  MAX_REQUESTS: 10, // máximo de requisições
  WINDOW_MS: 60000, // janela de 1 minuto
} as const;

class RateLimiter {
  private requests: Map<string, RateLimitState> = new Map();

  /**
   * Verifica se uma requisição pode ser feita
   * @param key - Chave única (ex: conversationId)
   * @returns true se permitido, false se excedeu o limite
   */
  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const state = this.requests.get(key);

    // Se não existe estado ou a janela expirou, resetar
    if (!state || now > state.resetTime) {
      this.requests.set(key, {
        count: 1,
        resetTime: now + RATE_LIMIT.WINDOW_MS,
      });
      return true;
    }

    // Se excedeu o limite
    if (state.count >= RATE_LIMIT.MAX_REQUESTS) {
      return false;
    }

    // Incrementar contador
    state.count++;
    return true;
  }

  /**
   * Obtém o tempo restante até poder fazer nova requisição
   */
  getTimeUntilReset(key: string): number {
    const state = this.requests.get(key);
    if (!state) {
      return 0;
    }

    const now = Date.now();
    const remaining = state.resetTime - now;
    return Math.max(0, remaining);
  }

  /**
   * Limpa o estado (útil para testes ou reset manual)
   */
  clear(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

// Instância singleton
export const rateLimiter = new RateLimiter();

/**
 * Mensagem de erro amigável quando excede o rate limit
 */
export function getRateLimitErrorMessage(timeUntilReset: number): string {
  const seconds = Math.ceil(timeUntilReset / 1000);
  return `Muitas requisições. Aguarde ${seconds} segundo${seconds > 1 ? 's' : ''} antes de tentar novamente.`;
}

