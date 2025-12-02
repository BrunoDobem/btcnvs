export type Role = "user" | "bot";

export interface ChatMessage {
  id: string;           // uuid no frontend
  role: Role;
  content: string;
  createdAt: string;    // ISO
  chartData?: ChartData; // Dados opcionais para gráfico
  chartOptions?: ChartOptions; // Opções de gráfico quando o usuário solicita um gráfico
  chartSuggestion?: ChartSuggestion; // Sugestão de gráfico quando há dados visualizáveis
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

// Opções de gráfico quando o usuário solicita um gráfico
export interface ChartOptions {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string | string[];
  availableTypes: ChartType[]; // Tipos de gráfico possíveis com esses dados
  title?: string;
  labels?: Record<string, string>;
}

// Sugestão de gráfico quando há dados visualizáveis
export interface ChartSuggestion {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string | string[];
  availableTypes: ChartType[]; // Tipos de gráfico possíveis com esses dados
  title?: string;
  labels?: Record<string, string>;
}

