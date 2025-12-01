/**
 * Sistema de tradução automática global
 * Similar ao comportamento do navegador, detecta e traduz textos automaticamente
 */

import { t as translate } from './translations';

/**
 * Mapa de traduções automáticas para textos comuns em inglês
 * Este sistema permite traduzir textos hardcoded automaticamente
 */
const autoTranslateMap: Record<string, Record<string, string>> = {
  'pt-BR': {
    'Appointment Calendar': 'Calendário de Agendamentos',
    'Loyalty': 'Fidelidade',
    'Loyalty Programs': 'Programas de Fidelidade',
    'Status': 'Status',
    'Select status': 'Selecione o status',
    'Scheduled': 'Agendado',
    'Confirmed': 'Confirmado',
    'Completed': 'Concluído',
    'Cancelled': 'Cancelado',
    'Pending': 'Pendente',
    'Total Duration': 'Duração Total',
    'minutes': 'minutos',
    'Automatically calculated from selected procedures': 'Calculado automaticamente a partir dos procedimentos selecionados',
    'Please select services first to see available appointment times': 'Por favor, selecione os serviços primeiro para ver os horários disponíveis',
    'Client Analytics': 'Análises de Clientes',
    'Coming soon...': 'Em breve...',
    'Add your first client': 'Adicione seu primeiro cliente',
    'Duration': 'Duração',
  },
  'en-NZ': {},
  'en-US': {},
  'es-ES': {
    'Appointment Calendar': 'Calendario de Citas',
    'Loyalty': 'Fidelidad',
    'Loyalty Programs': 'Programas de Fidelidad',
    'Status': 'Estado',
    'Select status': 'Seleccione el estado',
    'Scheduled': 'Programado',
    'Confirmed': 'Confirmado',
    'Completed': 'Completado',
    'Cancelled': 'Cancelado',
    'Pending': 'Pendiente',
    'Total Duration': 'Duración Total',
    'minutes': 'minutos',
    'Automatically calculated from selected procedures': 'Calculado automáticamente a partir de los procedimientos seleccionados',
    'Please select services first to see available appointment times': 'Por favor, seleccione los servicios primero para ver los horarios disponibles',
    'Client Analytics': 'Análisis de Clientes',
    'Coming soon...': 'Próximamente...',
    'Add your first client': 'Agregue su primer cliente',
    'Duration': 'Duración',
  },
};

/**
 * Traduz automaticamente um texto se estiver no mapa de traduções
 * @param text - Texto a ser traduzido
 * @param language - Idioma atual
 * @returns Texto traduzido ou o texto original se não houver tradução
 */
export function autoTranslate(text: string, language: string = 'pt-BR'): string {
  if (!text || typeof text !== 'string') return text;
  
  const trimmedText = text.trim();
  const translations = autoTranslateMap[language];
  
  if (translations && translations[trimmedText]) {
    return translations[trimmedText];
  }
  
  // Se não encontrar tradução exata, retorna o texto original
  return text;
}

/**
 * Hook para usar tradução automática em componentes
 * Combina tradução manual (via chaves) com tradução automática
 */
export function useAutoTranslate(language: string = 'pt-BR') {
  return {
    /**
     * Traduz usando chave (método preferido)
     */
    t: (key: string) => translate(key as any, language),
    
    /**
     * Traduz automaticamente texto hardcoded (fallback)
     */
    auto: (text: string) => autoTranslate(text, language),
    
    /**
     * Traduz texto ou chave automaticamente
     */
    translate: (textOrKey: string) => {
      // Se começa com letra minúscula e tem underscore, provavelmente é uma chave
      if (textOrKey.includes('_') || textOrKey.match(/^[a-z]/)) {
        return translate(textOrKey as any, language);
      }
      // Caso contrário, tenta tradução automática
      return autoTranslate(textOrKey, language);
    },
  };
}


