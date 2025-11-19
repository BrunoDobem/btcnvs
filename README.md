# Assistente de Dados - Chatbot

Aplicação web Single Page Application (SPA) com interface de chatbot, desenvolvida com React + Vite, TypeScript e Tailwind CSS.

## 🚀 Tecnologias

- **React 18** - Biblioteca UI
- **Vite** - Build tool e dev server
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização

## 📋 Funcionalidades

- Interface de chatbot moderna e responsiva
- Integração com webhook n8n
- Gerenciamento de conversas com `conversationId` persistido em localStorage
- Indicador de digitação do bot
- Scroll automático para última mensagem
- Tratamento de erros
- Suporte a Enter para enviar e Shift+Enter para nova linha

## 🛠️ Instalação

```bash
npm install
```

## 🏃 Executar em desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 📦 Build para produção

```bash
npm run build
```

## ⚙️ Configuração

### Variável de Ambiente

O webhook pode ser configurado através da variável de ambiente `VITE_WEBHOOK_URL`.

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_WEBHOOK_URL=https://n8n.autografia.app.br/webhook/bot
```

Se não for definida, será usado o valor padrão: `https://n8n.autografia.app.br/webhook/bot`

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ChatContainer.tsx
│   ├── MessageBubble.tsx
│   ├── MessageInput.tsx
│   ├── MessageList.tsx
│   └── TypingIndicator.tsx
├── lib/                 # Utilitários e lógica
│   ├── chatApi.ts       # Função para chamar o webhook
│   ├── storage.ts       # Helpers para localStorage
│   └── types.ts         # Tipos TypeScript
├── App.tsx              # Componente principal
├── main.tsx             # Entry point
└── index.css            # Estilos globais
```

## 🔄 Fluxo de Funcionamento

1. Ao carregar a página, um `conversationId` (UUID) é gerado e salvo no localStorage
2. O usuário digita uma mensagem e pressiona Enter
3. A mensagem é adicionada imediatamente na UI (otimista)
4. Uma requisição POST é enviada ao webhook com:
   - `conversationId`
   - `message` (texto do usuário)
   - `history` (histórico completo da conversa)
5. O webhook processa e retorna uma resposta
6. A resposta é exibida como mensagem do bot
7. Em caso de erro, uma mensagem de erro é exibida

## 📝 Formato da Requisição ao Webhook

```json
{
  "conversationId": "uuid-da-conversa",
  "message": "texto da mensagem do usuário",
  "history": [
    {
      "role": "user",
      "content": "..."
    },
    {
      "role": "bot",
      "content": "..."
    }
  ]
}
```

## 📝 Formato da Resposta do Webhook

```json
{
  "reply": "texto de resposta do bot"
}
```

## 🎨 Personalização

Os estilos podem ser personalizados através do arquivo `tailwind.config.js` ou modificando as classes Tailwind nos componentes.

