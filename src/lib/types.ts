export type Role = "user" | "bot";

export interface ChatMessage {
  id: string;           // uuid no frontend
  role: Role;
  content: string;
  createdAt: string;    // ISO
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
}

export interface WebhookRawResponse {
  output: string;
}

