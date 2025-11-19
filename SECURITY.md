# 🔒 Guia de Segurança

Este documento descreve as práticas de segurança implementadas na aplicação e recomendações para manter o código seguro.

## ✅ Medidas de Segurança Implementadas

### 1. Validação de Entrada
- ✅ Validação de tamanho máximo de mensagens (10KB)
- ✅ Validação de formato de UUID para `conversationId`
- ✅ Validação de histórico de mensagens
- ✅ Sanitização de strings antes de enviar ao servidor
- ✅ Validação de URLs do webhook

### 2. Proteção contra XSS (Cross-Site Scripting)
- ✅ React escapa automaticamente conteúdo renderizado
- ✅ Sanitização de dados recebidos do webhook
- ✅ Remoção de caracteres de controle

### 3. Rate Limiting
- ✅ Limite de 10 requisições por minuto por `conversationId`
- ✅ Mensagens de erro amigáveis quando excede o limite
- ✅ Prevenção de spam e ataques de força bruta

### 4. Timeout de Requisições
- ✅ Timeout de 30 segundos em todas as requisições
- ✅ Prevenção de requisições que ficam pendentes indefinidamente

### 5. Tratamento Seguro de Erros
- ✅ Mensagens de erro genéricas para usuários (não expõe detalhes técnicos)
- ✅ Logs detalhados apenas em modo desenvolvimento
- ✅ Não exposição de stack traces ou informações sensíveis

### 6. Configuração de Build
- ✅ Source maps desabilitados em produção
- ✅ Código minificado
- ✅ Variáveis de ambiente não expostas no bundle

### 7. Armazenamento Local
- ✅ Apenas `conversationId` (UUID) armazenado no localStorage
- ✅ Nenhum dado sensível armazenado localmente
- ✅ Validação de formato antes de usar dados do localStorage

## 🛡️ Recomendações Adicionais

### Para Desenvolvimento

1. **Nunca commitar arquivos `.env`**
   - O `.gitignore` já está configurado para ignorar arquivos `.env`
   - Use `.env.example` como template (sem valores reais)

2. **Use HTTPS em produção**
   - A aplicação valida que URLs do webhook usem HTTPS em produção
   - Configure seu servidor para servir apenas via HTTPS

3. **Monitore requisições**
   - Implemente logging no backend/webhook
   - Monitore padrões suspeitos de requisições

### Para Produção

1. **Headers de Segurança HTTP**
   Configure seu servidor web (Nginx, Apache, etc.) com:
   ```
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   X-XSS-Protection: 1; mode=block
   Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';
   Strict-Transport-Security: max-age=31536000; includeSubDomains
   ```

2. **CORS (Cross-Origin Resource Sharing)**
   - Configure CORS adequadamente no webhook
   - Permita apenas origens confiáveis

3. **Autenticação do Webhook (se necessário)**
   - Considere adicionar autenticação (API key, JWT, etc.) no webhook
   - Não exponha a URL do webhook no código frontend se contiver secrets

4. **Rate Limiting no Backend**
   - Implemente rate limiting também no webhook/backend
   - O rate limiting do frontend é apenas uma camada de proteção

5. **Validação no Backend**
   - Sempre valide dados no backend também
   - Não confie apenas na validação do frontend

6. **Monitoramento**
   - Implemente logging e monitoramento de erros
   - Use ferramentas como Sentry, LogRocket, etc.

7. **Atualizações de Dependências**
   - Mantenha dependências atualizadas
   - Execute `npm audit` regularmente
   - Use `npm audit fix` para corrigir vulnerabilidades conhecidas

## 🔍 Verificações de Segurança

### Antes de fazer deploy:

```bash
# Verificar vulnerabilidades nas dependências
npm audit

# Verificar código com linter
npm run lint

# Build de produção para verificar erros
npm run build
```

### Checklist de Segurança:

- [ ] Nenhum arquivo `.env` está sendo commitado
- [ ] URL do webhook usa HTTPS
- [ ] Source maps desabilitados em produção
- [ ] Headers de segurança configurados no servidor
- [ ] Dependências atualizadas e sem vulnerabilidades conhecidas
- [ ] Rate limiting configurado no backend
- [ ] Logs não expõem informações sensíveis
- [ ] CORS configurado adequadamente

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://reactjs.org/docs/dom-elements.html#security)
- [Vite Security](https://vitejs.dev/guide/security.html)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## 🚨 Reportar Vulnerabilidades

Se você encontrar uma vulnerabilidade de segurança, por favor:
1. **NÃO** abra uma issue pública
2. Entre em contato diretamente com o mantenedor do projeto
3. Forneça detalhes suficientes para reproduzir o problema

---

**Última atualização:** 2024

