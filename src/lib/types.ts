export type Role = "user" | "bot";

export interface ChatMessage {
  id: string;           // uuid no frontend
  role: Role;
  content: string;
  createdAt: string;    // ISO
  chartData?: ChartData; // Dados opcionais para gráfico
}

export interface ChatState {
  conversationId: string;
  messages: ChatMessage[];
  isLoading: boolean;       // quando está aguardando resposta do webhook
  error?: string | null;    // mensagem de erro (se houver)
}

export interface WebhookRequest {
  conversationId: string;
  message: string;
  history: {
    role: "user" | "bot";
    content: string;
  }[];
}

export interface WebhookResponse {
  output: string;
  chartData?: ChartData; // Dados opcionais para gráfico
}

export interface WebhookRawResponse {
  output: string;
  chartData?: ChartData; // Dados opcionais para gráfico
}

export type ChartType = 'bar' | 'line' | 'pie' | 'area';

export interface ChartData {
  type: ChartType;
  data: Array<Record<string, string | number>>;
  xKey: string; // Chave para o eixo X
  yKey: string | string[]; // Chave para o eixo Y (ou array de chaves para múltiplas séries)
  title?: string;
  labels?: Record<string, string>; // Mapeamento de chaves para labels legíveis
}

