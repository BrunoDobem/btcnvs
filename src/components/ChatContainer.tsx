import { useState, useEffect } from 'react';
import type { ChatMessage, ChatState, ChartType, ChartOptions, ChartSuggestion } from '../lib/types';
import { getOrCreateConversationId } from '../lib/storage';
import { sendMessageToWebhook } from '../lib/chatApi';
import { rateLimiter, getRateLimitErrorMessage } from '../lib/rateLimiter';
import { validateMessage } from '../lib/validation';
import { extractChartDataFromText, cleanOutputFromCode, isChartRequest, getAvailableChartTypes, canVisualizeAsChart } from '../lib/chartUtils';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

// Helper para gerar UUID (fallback caso crypto.randomUUID não esteja disponível)
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para navegadores antigos
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function ChatContainer() {
  const [chatState, setChatState] = useState<ChatState>({
    conversationId: '',
    messages: [],
    isLoading: false,
    error: null,
  });

  // Inicializar conversationId ao montar o componente
  useEffect(() => {
    const conversationId = getOrCreateConversationId();
    setChatState((prev) => ({ ...prev, conversationId }));
  }, []);

  const handleClearConversation = () => {
    setChatState((prev) => ({
      ...prev,
      messages: [],
      error: null,
    }));
  };

  const handleSelectChartType = (messageId: string, type: ChartType) => {
    setChatState((prev) => {
      const updatedMessages = prev.messages.map((msg) => {
        if (msg.id === messageId && msg.chartOptions) {
          // Criar chartData a partir das opções selecionadas
          const chartData = {
            type,
            data: msg.chartOptions.data,
            xKey: msg.chartOptions.xKey,
            yKey: msg.chartOptions.yKey,
            title: msg.chartOptions.title,
            labels: msg.chartOptions.labels,
          };
          
          // Manter chartOptions para permitir alteração posterior
          return {
            ...msg,
            chartData,
            // chartOptions permanece para permitir alteração
          };
        }
        return msg;
      });
      
      return {
        ...prev,
        messages: updatedMessages,
      };
    });
  };

  const handleVisualizeChart = (messageId: string) => {
    setChatState((prev) => {
      const updatedMessages = prev.messages.map((msg) => {
        if (msg.id === messageId && msg.chartSuggestion) {
          // Converter sugestão em chartOptions para o usuário escolher o tipo
          const chartOptions: ChartOptions = {
            data: msg.chartSuggestion.data,
            xKey: msg.chartSuggestion.xKey,
            yKey: msg.chartSuggestion.yKey,
            availableTypes: msg.chartSuggestion.availableTypes,
            title: msg.chartSuggestion.title,
            labels: msg.chartSuggestion.labels,
          };
          
          // Remover chartSuggestion e adicionar chartOptions
          return {
            ...msg,
            chartSuggestion: undefined,
            chartOptions,
          };
        }
        return msg;
      });
      
      return {
        ...prev,
        messages: updatedMessages,
      };
    });
  };

  const handleSendMessage = async (content: string) => {
    if (!chatState.conversationId || chatState.isLoading) {
      return;
    }

    // Validar mensagem antes de processar
    const validation = validateMessage(content);
    if (!validation.valid) {
      const errorBotMessage: ChatMessage = {
        id: generateUUID(),
        role: 'bot',
        content: `❌ ${validation.error || 'Mensagem inválida'}`,
        createdAt: new Date().toISOString(),
      };
      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, errorBotMessage],
      }));
      return;
    }

    // Verificar rate limit
    if (!rateLimiter.canMakeRequest(chatState.conversationId)) {
      const timeUntilReset = rateLimiter.getTimeUntilReset(chatState.conversationId);
      const errorBotMessage: ChatMessage = {
        id: generateUUID(),
        role: 'bot',
        content: `❌ ${getRateLimitErrorMessage(timeUntilReset)}`,
        createdAt: new Date().toISOString(),
      };
      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, errorBotMessage],
      }));
      return;
    }

    // Criar mensagem do usuário
    const userMessage: ChatMessage = {
      id: generateUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    // Adicionar mensagem otimisticamente
    const updatedMessages = [...chatState.messages, userMessage];
    setChatState((prev) => ({
      ...prev,
      messages: updatedMessages,
      isLoading: true,
      error: null,
    }));

    try {
      // Preparar histórico para o webhook (sem id e createdAt)
      const history = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Chamar webhook
      const response = await sendMessageToWebhook({
        conversationId: chatState.conversationId,
        message: content,
        history,
      });

      // Se não há chartData na resposta mas o usuário pediu um gráfico,
      // tentar extrair dados do texto automaticamente
      let chartData = response.chartData;
      let cleanedOutput = response.output;
      let chartOptions: ChartOptions | undefined;
      let chartSuggestion: ChartSuggestion | undefined;
      
      // Tentar extrair dados do texto se não houver chartData
      const extractedChartData = chartData || extractChartDataFromText(response.output, content) || undefined;
      
      if (extractedChartData) {
        // Se o usuário pediu um gráfico, mostrar opções de estilo
        if (isChartRequest(content)) {
          const availableTypes = getAvailableChartTypes(
            extractedChartData.data,
            extractedChartData.xKey,
            extractedChartData.yKey
          );
          
          if (availableTypes.length > 0) {
            chartOptions = {
              data: extractedChartData.data,
              xKey: extractedChartData.xKey,
              yKey: extractedChartData.yKey,
              availableTypes,
              title: extractedChartData.title,
              labels: extractedChartData.labels,
            };
            // Limpar o código do output quando há opções de gráfico
            cleanedOutput = cleanOutputFromCode(response.output);
          } else {
            // Se não há tipos disponíveis, usar o gráfico extraído diretamente
            chartData = extractedChartData;
            cleanedOutput = cleanOutputFromCode(response.output);
          }
        } else {
          // Se o usuário não pediu gráfico mas há dados visualizáveis, sugerir
          if (canVisualizeAsChart(
            extractedChartData.data,
            extractedChartData.xKey,
            extractedChartData.yKey
          )) {
            const availableTypes = getAvailableChartTypes(
              extractedChartData.data,
              extractedChartData.xKey,
              extractedChartData.yKey
            );
            
            chartSuggestion = {
              data: extractedChartData.data,
              xKey: extractedChartData.xKey,
              yKey: extractedChartData.yKey,
              availableTypes,
              title: extractedChartData.title,
              labels: extractedChartData.labels,
            };
          }
        }
      } else if (chartData) {
        // Se há chartData direto da resposta e o usuário pediu gráfico, mostrar opções
        if (isChartRequest(content)) {
          const availableTypes = getAvailableChartTypes(
            chartData.data,
            chartData.xKey,
            chartData.yKey
          );
          
          if (availableTypes.length > 0) {
            chartOptions = {
              data: chartData.data,
              xKey: chartData.xKey,
              yKey: chartData.yKey,
              availableTypes,
              title: chartData.title,
              labels: chartData.labels,
            };
            // Não mostrar o gráfico ainda, apenas as opções
            chartData = undefined;
          }
        } else {
          // Se o usuário não pediu gráfico mas há dados visualizáveis, sugerir
          if (canVisualizeAsChart(
            chartData.data,
            chartData.xKey,
            chartData.yKey
          )) {
            const availableTypes = getAvailableChartTypes(
              chartData.data,
              chartData.xKey,
              chartData.yKey
            );
            
            chartSuggestion = {
              data: chartData.data,
              xKey: chartData.xKey,
              yKey: chartData.yKey,
              availableTypes,
              title: chartData.title,
              labels: chartData.labels,
            };
            // Não mostrar o gráfico ainda, apenas a sugestão
            chartData = undefined;
          }
        }
      }

      // Criar mensagem do bot
      const botMessage: ChatMessage = {
        id: generateUUID(),
        role: 'bot',
        content: cleanedOutput,
        createdAt: new Date().toISOString(),
        chartData,
        chartOptions,
        chartSuggestion,
      };

      // Adicionar resposta do bot
      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, botMessage],
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      // Log detalhado apenas em desenvolvimento
      if (import.meta.env.DEV) {
        console.error('Erro ao enviar mensagem:', error);
      }
      
      // Mensagem de erro genérica para o usuário (não expor detalhes técnicos)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Ocorreu um erro ao comunicar com o servidor. Tente novamente.';

      // Adicionar mensagem de erro do bot
      const errorBotMessage: ChatMessage = {
        id: generateUUID(),
        role: 'bot',
        content: `❌ ${errorMessage}`,
        createdAt: new Date().toISOString(),
      };

      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, errorBotMessage],
        isLoading: false,
        error: errorMessage,
      }));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200 px-6 py-4 bg-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">Assistente de Dados</h1>
          {chatState.messages.length > 0 && (
            <button
              onClick={handleClearConversation}
              disabled={chatState.isLoading}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Limpar conversa"
            >
              Limpar conversa
            </button>
          )}
        </div>
      </div>
      
      <MessageList 
        messages={chatState.messages} 
        isLoading={chatState.isLoading}
        onSelectChartType={handleSelectChartType}
        onVisualizeChart={handleVisualizeChart}
      />
      
      <MessageInput 
        onSendMessage={handleSendMessage}
        disabled={chatState.isLoading || !chatState.conversationId}
      />
    </div>
  );
}

