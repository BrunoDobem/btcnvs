import type { ChartData, ChartType } from './types';

/**
 * Tenta extrair dados de gráfico do output do webhook
 * Procura por JSON estruturado no formato esperado
 */
export function extractChartData(output: string): ChartData | null {
  try {
    // Tentar encontrar JSON no output (pode estar entre ```json ou como objeto direto)
    const jsonMatch = output.match(/```json\s*([\s\S]*?)\s*```/) || 
                      output.match(/```\s*([\s\S]*?)\s*```/) ||
                      output.match(/\{[\s\S]*"chartData"[\s\S]*\}/) ||
                      output.match(/\{[\s\S]*"type"[\s\S]*"data"[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      try {
        const parsed = JSON.parse(jsonStr);
        
        if (parsed.chartData) {
          return validateChartData(parsed.chartData);
        }
        
        // Se o objeto inteiro é um ChartData
        if (parsed.type && parsed.data && parsed.xKey && parsed.yKey) {
          return validateChartData(parsed);
        }
      } catch (parseError) {
        // JSON inválido, continuar
      }
    }

    // Tentar encontrar JSON inline (sem code blocks)
    const inlineJsonMatch = output.match(/\{[^{}]*"type"[\s\S]*"data"[\s\S]*"xKey"[\s\S]*"yKey"[\s\S]*\}/);
    if (inlineJsonMatch) {
      try {
        const parsed = JSON.parse(inlineJsonMatch[0]);
        if (parsed.type && parsed.data && parsed.xKey && parsed.yKey) {
          return validateChartData(parsed);
        }
      } catch {
        // Continuar
      }
    }

    // Tentar parsear o output inteiro como JSON
    try {
      const parsed = JSON.parse(output);
      if (parsed.chartData) {
        return validateChartData(parsed.chartData);
      }
      if (parsed.type && parsed.data && parsed.xKey && parsed.yKey) {
        return validateChartData(parsed);
      }
    } catch {
      // Não é JSON válido, continuar
    }

    return null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error extracting chart data:', error);
    }
    return null;
  }
}

/**
 * Valida e normaliza dados de gráfico
 */
function validateChartData(data: any): ChartData | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Validar campos obrigatórios
  if (!data.type || !data.data || !data.xKey || !data.yKey) {
    return null;
  }

  // Validar tipo
  const validTypes = ['bar', 'line', 'pie', 'area'];
  if (!validTypes.includes(data.type)) {
    return null;
  }

  // Validar data
  if (!Array.isArray(data.data) || data.data.length === 0) {
    return null;
  }

  // Validar que xKey e yKey existem nos dados
  const firstItem = data.data[0];
  if (!firstItem || !(data.xKey in firstItem)) {
    return null;
  }

  const yKeys = Array.isArray(data.yKey) ? data.yKey : [data.yKey];
  const hasValidYKey = yKeys.some((key: string) => key in firstItem);
  if (!hasValidYKey) {
    return null;
  }

  return {
    type: data.type,
    data: data.data,
    xKey: data.xKey,
    yKey: data.yKey,
    title: data.title,
    labels: data.labels,
  };
}

/**
 * Detecta se a mensagem do usuário solicita um gráfico
 */
export function isChartRequest(message: string): boolean {
  const chartKeywords = [
    'gráfico',
    'grafico',
    'chart',
    'visualizar',
    'visualização',
    'visualizacao',
    'plotar',
    'plot',
    'gráficos',
    'graficos',
    'mostrar gráfico',
    'fazer gráfico',
    'criar gráfico',
  ];

  const lowerMessage = message.toLowerCase();
  return chartKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Tenta inferir tipo de gráfico baseado nos dados
 */
export function inferChartType(data: Array<Record<string, string | number>>, xKey: string): ChartType {
  // Se há poucos dados (menos de 5), usar pizza
  if (data.length <= 5) {
    return 'pie';
  }

  // Se o eixo X parece ser temporal ou sequencial, usar linha
  const firstX = data[0]?.[xKey];
  if (typeof firstX === 'string' && (firstX.includes('/') || firstX.includes('-') || firstX.match(/^\d{4}/))) {
    return 'line';
  }

  // Padrão: gráfico de barras
  return 'bar';
}

/**
 * Extrai dados de gráfico de texto formatado (ex: "- Mês: R$ valor")
 * Útil quando o webhook retorna apenas texto mas o usuário pediu um gráfico
 */
export function extractChartDataFromText(output: string, userMessage: string): ChartData | null {
  // Só tentar extrair se o usuário pediu um gráfico
  if (!isChartRequest(userMessage)) {
    return null;
  }

  try {
    // Primeiro, tentar extrair dados de arrays Python se existirem
    const pythonData = extractFromPythonCode(output);
    if (pythonData) {
      return pythonData;
    }
    
    // Remover blocos de código do texto antes de processar
    // Isso evita que código Python/JavaScript seja interpretado como dados
    let cleanOutput = output;
    
    // Remover code blocks (```python, ```js, ```json, etc.) - mais robusto
    cleanOutput = cleanOutput.replace(/```[\w]*\s*\n?[\s\S]*?```/g, '');
    
    // Remover blocos de código inline que possam confundir
    // Mas manter o texto com dados formatados
    
    // Padrão 1: Lista com "- Item: R$ valor" ou "- Item: valor"
    // Ex: "- Junho: R$ 252.951,59" ou "- Agosto: 647.279,86"
    // Também captura casos como "- Novembro (até 19/11): R$ 218.903,93"
    const listPattern = /^[-•]\s*([^:]+?):\s*(?:R\$\s*)?([\d.,]+)/gm;
    const matches = Array.from(cleanOutput.matchAll(listPattern));
    
    if (matches.length >= 2) {
      const data = matches.map(match => {
        const label = match[1].trim();
        // Converter valor brasileiro (R$ 252.951,59) para número
        const valueStr = match[2].replace(/\./g, '').replace(',', '.');
        const value = parseFloat(valueStr);
        
        return {
          label,
          value: isNaN(value) ? 0 : value,
        };
      });

      if (data.length > 0) {
        // Determinar tipo de gráfico baseado no contexto
        // Para dados temporais (meses), usar gráfico de linha
        const firstLabel = data[0].label.toLowerCase();
        const isTemporal = /(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i.test(firstLabel) ||
                          /\d{4}/.test(firstLabel);
        
        const chartType: ChartType = isTemporal && data.length >= 3 ? 'line' : 
                                     data.length <= 5 ? 'bar' : 'bar';
        
        return {
          type: chartType,
          data: data.map(item => ({
            [chartType === 'line' ? 'periodo' : 'item']: item.label,
            valor: item.value,
          })),
          xKey: chartType === 'line' ? 'periodo' : 'item',
          yKey: 'valor',
          title: extractTitleFromText(cleanOutput) || 'Gráfico de Dados',
          labels: {
            [chartType === 'line' ? 'periodo' : 'item']: chartType === 'line' ? 'Período' : 'Item',
            valor: 'Valor',
          },
        };
      }
    }

    // Padrão 2: Tabela ou dados em formato "Item | Valor" ou "Item: Valor"
    const tablePattern = /([^:\n|]+)[:|]\s*(?:R\$\s*)?([\d.,]+)/g;
    const tableMatches = Array.from(cleanOutput.matchAll(tablePattern));
    
    if (tableMatches.length >= 2 && matches.length < 2) {
      const data = tableMatches.map(match => {
        const label = match[1].trim();
        const valueStr = match[2].replace(/\./g, '').replace(',', '.');
        const value = parseFloat(valueStr);
        
        return {
          label,
          value: isNaN(value) ? 0 : value,
        };
      }).filter(item => item.label && !isNaN(item.value));

      if (data.length > 0) {
        // Determinar tipo de gráfico baseado no contexto
        const firstLabel = data[0].label.toLowerCase();
        const isTemporal = /(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i.test(firstLabel) ||
                          /\d{4}/.test(firstLabel);
        
        const chartType: ChartType = isTemporal && data.length >= 3 ? 'line' : 
                                     data.length <= 5 ? 'bar' : 'bar';
        
        return {
          type: chartType,
          data: data.map(item => ({
            [chartType === 'line' ? 'periodo' : 'item']: item.label,
            valor: item.value,
          })),
          xKey: chartType === 'line' ? 'periodo' : 'item',
          yKey: 'valor',
          title: extractTitleFromText(cleanOutput) || 'Gráfico de Dados',
          labels: {
            [chartType === 'line' ? 'periodo' : 'item']: chartType === 'line' ? 'Período' : 'Item',
            valor: 'Valor',
          },
        };
      }
    }

    return null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error extracting chart data from text:', error);
    }
    return null;
  }
}

/**
 * Tenta extrair dados de gráfico de código Python
 * Procura por arrays como: meses = [...] e investimentos = [...]
 */
function extractFromPythonCode(output: string): ChartData | null {
  try {
    // Procurar por padrões de arrays Python
    // Ex: meses = ["Junho 2025", "Julho 2025", ...]
    // Ex: investimentos = [613531.23, 702742.58, ...]
    
    const mesesMatch = output.match(/(?:meses|mes|periodo|periodos)\s*=\s*\[([^\]]+)\]/i);
    const investimentosMatch = output.match(/(?:investimentos|investimento|valores|valor|dados|data|impressoes|impressões|cpm)\s*=\s*\[([^\]]+)\]/i);
    
    if (mesesMatch && investimentosMatch) {
      // Extrair valores dos arrays
      const mesesStr = mesesMatch[1];
      const valoresStr = investimentosMatch[1];
      
      // Parsear meses (remover aspas e espaços)
      const meses = mesesStr
        .split(',')
        .map(m => m.trim().replace(/['"]/g, ''))
        .filter(m => m.length > 0);
      
      // Parsear valores (remover espaços e converter para número)
      const valores = valoresStr
        .split(',')
        .map(v => {
          const num = parseFloat(v.trim());
          return isNaN(num) ? 0 : num;
        })
        .filter(v => v !== 0 || valoresStr.includes('0'));
      
      // Validar que temos dados correspondentes
      if (meses.length === valores.length && meses.length >= 2) {
        const isTemporal = meses.some(m => 
          /(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|\d{4})/i.test(m)
        );
        
        const chartType: ChartType = isTemporal && meses.length >= 3 ? 'line' : 'bar';
        
        return {
          type: chartType,
          data: meses.map((mes, index) => ({
            [chartType === 'line' ? 'periodo' : 'item']: mes,
            valor: valores[index] || 0,
          })),
          xKey: chartType === 'line' ? 'periodo' : 'item',
          yKey: 'valor',
          title: 'Gráfico de Dados',
          labels: {
            [chartType === 'line' ? 'periodo' : 'item']: chartType === 'line' ? 'Período' : 'Item',
            valor: 'Valor',
          },
        };
      }
    }
    
    return null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error extracting from Python code:', error);
    }
    return null;
  }
}

/**
 * Remove código Python do texto quando um gráfico foi gerado
 */
export function cleanOutputFromCode(output: string): string {
  // Remover blocos de código Python/JavaScript/JSON
  let cleaned = output;
  
  // Remover code blocks (```python, ```js, ```json, etc.)
  cleaned = cleaned.replace(/```[\w]*\s*\n?[\s\S]*?```/g, '');
  
  // Remover código Python inline - padrão mais abrangente
  // Detecta desde frases introdutórias até plt.show()
  const pythonCodePatterns = [
    // Padrão 1: "Vou criar..." até plt.show()
    /Vou criar.*?gráfico.*?plt\.show\(\)/gis,
    // Padrão 2: "Agora vou criar..." até plt.show()
    /Agora vou criar.*?plt\.show\(\)/gis,
    // Padrão 3: "import matplotlib" até plt.show()
    /import\s+matplotlib[\s\S]*?plt\.show\(\)/gis,
    // Padrão 4: Qualquer import seguido de código até plt.show()
    /import\s+\w+[\s\S]*?plt\.show\(\)/gis,
    // Padrão 5: Arrays Python seguidos de código matplotlib
    /\w+\s*=\s*\[[^\]]+\][\s\S]*?plt\.show\(\)/gis,
  ];
  
  for (const pattern of pythonCodePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Remover linhas que são claramente código Python
  const lines = cleaned.split('\n');
  let inCodeBlock = false;
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();
    
    // Detectar início de bloco de código
    if (trimmed.match(/^(Vou criar|Agora vou criar).*?gráfico/i)) {
      inCodeBlock = true;
      return false;
    }
    
    // Se estamos em um bloco de código, remover até plt.show()
    if (inCodeBlock) {
      if (trimmed === 'plt.show()' || trimmed.match(/plt\.show\(\)/)) {
        inCodeBlock = false;
        return false;
      }
      return false;
    }
    
    // Remover linhas que são código Python
    if (trimmed.startsWith('import ') || 
        trimmed.startsWith('from ') ||
        trimmed.startsWith('plt.') ||
        trimmed.match(/^\w+\s*=\s*\[/) ||
        trimmed === 'plt.show()' ||
        trimmed.match(/^meses\s*=\s*\[/) ||
        trimmed.match(/^cpm\s*=\s*\[/) ||
        trimmed.match(/^investimentos\s*=\s*\[/) ||
        trimmed.match(/^impressoes\s*=\s*\[/) ||
        trimmed.match(/^impressões\s*=\s*\[/) ||
        trimmed.match(/^valores\s*=\s*\[/) ||
        trimmed.match(/^dados\s*=\s*\[/)) {
      return false;
    }
    
    return true;
  });
  
  cleaned = filteredLines.join('\n');
  
  // Remover frases que indicam que código será mostrado (mais padrões)
  const introPhrases = [
    /Vou criar.*?gráfico.*?para você\./gi,
    /Agora vou criar.*?visualização\./gi,
    /Vou criar.*?gráfico\./gi,
    /Agora vou.*?gráfico\./gi,
  ];
  
  for (const pattern of introPhrases) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Limpar múltiplas quebras de linha e espaços em branco
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/[ \t]+$/gm, ''); // Remove espaços no final das linhas
  
  return cleaned.trim();
}

/**
 * Tenta extrair um título do texto
 */
function extractTitleFromText(text: string): string | undefined {
  // Procurar por padrões como "Aqui está o gráfico com..." ou "Gráfico de..."
  const titlePatterns = [
    /(?:Aqui está|Gráfico|gráfico)\s+(?:com|de|do|da)\s+([^:\.\n]+)/i,
    /([^:\.\n]+?)\s*:\s*(?:[-•]|$)/,
  ];

  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Determina quais tipos de gráfico são possíveis com os dados fornecidos
 */
export function getAvailableChartTypes(
  data: Array<Record<string, string | number>>,
  xKey: string,
  yKey: string | string[]
): ChartType[] {
  const availableTypes: ChartType[] = [];
  
  if (!data || data.length === 0) {
    return [];
  }

  const yKeys = Array.isArray(yKey) ? yKey : [yKey];
  const firstItem = data[0];
  
  if (!firstItem || !(xKey in firstItem)) {
    return [];
  }

  const hasValidYKey = yKeys.some((key: string) => key in firstItem);
  if (!hasValidYKey) {
    return [];
  }

  // Todos os tipos básicos são sempre possíveis se temos dados válidos
  availableTypes.push('bar');
  availableTypes.push('line');
  availableTypes.push('area');

  // Pizza só é adequada se temos poucos itens (até 8) e uma única série
  if (data.length <= 8 && yKeys.length === 1) {
    availableTypes.push('pie');
  }

  return availableTypes;
}

/**
 * Verifica se os dados podem ser visualizados em um gráfico
 */
export function canVisualizeAsChart(
  data: Array<Record<string, string | number>>,
  xKey: string,
  yKey: string | string[]
): boolean {
  return getAvailableChartTypes(data, xKey, yKey).length > 0;
}

