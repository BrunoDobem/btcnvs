import type { WebhookRequest, WebhookResponse, WebhookRawResponse, ChartData } from './types';
import { isValidUrl, SECURITY_LIMITS, validateHistory, validateMessage, validateConversationId, sanitizeString } from './validation';
import { extractChartData } from './chartUtils';

// Validar e obter URL do webhook
function getWebhookUrl(): string {
  const url = import.meta.env.VITE_WEBHOOK_URL || 
    'https://n8n.autografia.app.br/webhook/bot';
  
  if (!isValidUrl(url)) {
    throw new Error('URL do webhook inválida');
  }
  
  return url;
}

const WEBHOOK_URL = getWebhookUrl();

/**
 * Cria um AbortController com timeout
 */
function createTimeoutController(timeoutMs: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

/**
 * Envia uma mensagem para o webhook e retorna a resposta
 * Inclui validações de segurança e timeout
 */
export async function sendMessageToWebhook(
  params: WebhookRequest
): Promise<WebhookResponse> {
  // Validações de entrada
  const conversationIdValidation = validateConversationId(params.conversationId);
  if (!conversationIdValidation.valid) {
    throw new Error(conversationIdValidation.error || 'ConversationId inválido');
  }

  const messageValidation = validateMessage(params.message);
  if (!messageValidation.valid) {
    throw new Error(messageValidation.error || 'Mensagem inválida');
  }

  const historyValidation = validateHistory(params.history);
  if (!historyValidation.valid) {
    throw new Error(historyValidation.error || 'Histórico inválido');
  }

  // Sanitizar dados antes de enviar
  const sanitizedParams: WebhookRequest = {
    conversationId: sanitizeString(params.conversationId),
    message: sanitizeString(params.message),
    history: params.history.map((msg) => ({
      role: msg.role,
      content: sanitizeString(msg.content),
    })),
  };

  // Criar controller com timeout
  const controller = createTimeoutController(SECURITY_LIMITS.REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitizedParams),
      signal: controller.signal,
    });

    if (!response.ok) {
      // Não expor detalhes do erro HTTP para o usuário
      if (response.status >= 500) {
        throw new Error('Erro no servidor. Tente novamente mais tarde.');
      } else if (response.status === 404) {
        throw new Error('Endpoint não encontrado.');
      } else if (response.status === 403 || response.status === 401) {
        throw new Error('Acesso negado.');
      } else {
        throw new Error('Erro ao processar requisição. Tente novamente.');
      }
    }

    const data = await response.json();
    
    // O webhook retorna um array com objetos contendo "output"
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Resposta do servidor em formato inválido');
    }

    const firstItem = data[0] as WebhookRawResponse;
    
    if (!firstItem.output || typeof firstItem.output !== 'string') {
      throw new Error('Resposta do servidor não contém dados válidos');
    }

    // Sanitizar resposta antes de retornar (proteção XSS)
    const sanitizedOutput = sanitizeString(firstItem.output);

    // Tentar extrair dados de gráfico do output ou usar chartData direto
    let chartData: ChartData | undefined = firstItem.chartData;
    if (!chartData) {
      chartData = extractChartData(sanitizedOutput) || undefined;
    }

    // Debug em desenvolvimento
    if (import.meta.env.DEV) {
      console.log('Webhook response:', { 
        hasChartData: !!firstItem.chartData, 
        extractedChartData: !!chartData,
        outputPreview: sanitizedOutput.substring(0, 200) 
      });
      if (chartData) {
        console.log('Chart data:', chartData);
      }
    }

    return {
      output: sanitizedOutput,
      chartData,
    };
  } catch (error) {
    // Tratar erros de timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Tempo de espera esgotado. Tente novamente.');
    }

    // Re-throw erros conhecidos
    if (error instanceof Error) {
      throw error;
    }

    // Erro desconhecido
    throw new Error('Erro desconhecido ao comunicar com o servidor.');
  }
}
