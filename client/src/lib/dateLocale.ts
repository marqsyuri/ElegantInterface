/**
 * Helper para obter o locale do date-fns baseado no idioma do usuário
 */
import { enNZ, ptBR, es } from 'date-fns/locale';
import type { Locale } from 'date-fns';

export function getDateLocale(language: string = 'pt-BR'): Locale {
  switch (language) {
    case 'pt-BR':
      return ptBR;
    case 'en-NZ':
    case 'en-US':
      return enNZ;
    case 'es-ES':
      return es;
    default:
      return ptBR;
  }
}

/**
 * Retorna o locale string para toLocaleString/toLocaleDateString
 */
export function getLocaleString(language: string = 'pt-BR'): string {
  switch (language) {
    case 'pt-BR':
      return 'pt-BR';
    case 'en-NZ':
      return 'en-NZ';
    case 'en-US':
      return 'en-US';
    case 'es-ES':
      return 'es-ES';
    default:
      return 'pt-BR';
  }
}

/**
 * Retorna os nomes dos dias da semana traduzidos
 */
export function getDayNames(language: string = 'pt-BR'): string[] {
  switch (language) {
    case 'pt-BR':
      return ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    case 'en-NZ':
    case 'en-US':
      return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    case 'es-ES':
      return ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    default:
      return ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  }
}


