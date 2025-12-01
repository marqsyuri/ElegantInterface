/**
 * Formata um valor numérico como moeda baseado no código da moeda
 * @param amount - Valor numérico a ser formatado
 * @param currency - Código da moeda (BRL, USD, EUR, etc.)
 * @param locale - Locale opcional (padrão baseado na moeda)
 * @returns String formatada como moeda
 */
export function formatCurrency(
  amount: number | string,
  currency: string = 'BRL',
  locale?: string
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0,00';
  }

  // Mapear moedas para locales apropriados
  const currencyLocaleMap: Record<string, string> = {
    'BRL': 'pt-BR',
    'USD': 'en-US',
    'EUR': 'de-DE', // ou 'pt-PT' dependendo da preferência
    'GBP': 'en-GB',
    'NZD': 'en-NZ',
    'AUD': 'en-AU',
    'CAD': 'en-CA',
    'MXN': 'es-MX',
    'ARS': 'es-AR',
    'CLP': 'es-CL',
    'COP': 'es-CO',
    'CHF': 'de-CH',
    'NOK': 'nb-NO',
    'SEK': 'sv-SE',
  };

  const selectedLocale = locale || currencyLocaleMap[currency] || 'pt-BR';

  try {
    return new Intl.NumberFormat(selectedLocale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  } catch (error) {
    // Fallback caso a moeda não seja suportada
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  }
}

/**
 * Lista de moedas suportadas com seus nomes
 */
export const CURRENCIES = [
  { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$' },
  { code: 'USD', name: 'Dólar Americano', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'Libra Esterlina', symbol: '£' },
  { code: 'NZD', name: 'Dólar Neozelandês', symbol: '$' },
  { code: 'AUD', name: 'Dólar Australiano', symbol: '$' },
  { code: 'CAD', name: 'Dólar Canadense', symbol: '$' },
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
  { code: 'CLP', name: 'Peso Chileno', symbol: '$' },
  { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
  { code: 'CHF', name: 'Franco Suíço', symbol: 'CHF' },
  { code: 'NOK', name: 'Coroa Norueguesa', symbol: 'kr' },
  { code: 'SEK', name: 'Coroa Sueca', symbol: 'kr' },
] as const;

/**
 * Lista de idiomas suportados
 */
export const LANGUAGES = [
  { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'en-NZ', name: 'English (New Zealand)' },
  { code: 'en-US', name: 'English (USA)' },
  { code: 'es-ES', name: 'Español' },
] as const;

/**
 * Obtém o nome da moeda pelo código
 */
export function getCurrencyName(code: string): string {
  const currency = CURRENCIES.find(c => c.code === code);
  return currency ? currency.name : code;
}

/**
 * Obtém o símbolo da moeda pelo código
 */
export function getCurrencySymbol(code: string): string {
  const currency = CURRENCIES.find(c => c.code === code);
  return currency ? currency.symbol : code;
}

/**
 * Obtém o nome do idioma pelo código
 */
export function getLanguageName(code: string): string {
  const language = LANGUAGES.find(l => l.code === code);
  return language ? language.name : code;
}

