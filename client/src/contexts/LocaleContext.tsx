import { createContext, useContext, ReactNode, useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency as formatCurrencyUtil, getCurrencySymbol as getCurrencySymbolUtil } from "@/lib/currency";
import { t as translate } from "@/lib/translations";

type LocaleContextType = {
  language: string;
  currency: string;
  setLanguage: (lang: string) => void;
  setCurrency: (curr: string) => void;
  formatCurrency: (amount: number | string) => string;
  getCurrencySymbol: () => string;
  t: (key: string) => string; // Função de tradução
};

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Inicializar com defaults
  const [language, setLanguageState] = useState<string>("pt-BR");
  const [currency, setCurrencyState] = useState<string>("BRL");

  // Sincronizar com dados do usuário quando fizer login ou quando user mudar
  useEffect(() => {
    if (user) {
      const newLanguage = user.language || "pt-BR";
      const newCurrency = user.currency || "BRL";
      
      
      // Sempre atualizar para garantir sincronização
      if (newLanguage !== language) {
        setLanguageState(newLanguage);
        document.documentElement.lang = newLanguage;
      }
      if (newCurrency !== currency) {
        setCurrencyState(newCurrency);
      }
    } else {
      // Resetar para defaults quando usuário faz logout
      setLanguageState("pt-BR");
      setCurrencyState("BRL");
      document.documentElement.lang = "pt-BR";
    }
  }, [user?.id, user?.language, user?.currency, language, currency]); // Incluir language e currency para detectar mudanças

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
  };

  const setCurrency = (curr: string) => {
    setCurrencyState(curr);
  };

  // Usar useCallback para garantir que sempre use os valores mais recentes
  // Priorizar valores do usuário se disponíveis, senão usar estado local
  const formatCurrency = useCallback((amount: number | string): string => {
    const activeCurrency = user?.currency || currency;
    const activeLanguage = user?.language || language;
    return formatCurrencyUtil(amount, activeCurrency, activeLanguage);
  }, [currency, language, user?.currency, user?.language]);

  const getCurrencySymbol = useCallback((): string => {
    const activeCurrency = user?.currency || currency;
    return getCurrencySymbolUtil(activeCurrency);
  }, [currency, user?.currency]);

  // Função de tradução que usa o idioma atual
  const t = useCallback((key: string): string => {
    const activeLanguage = user?.language || language;
    return translate(key as any, activeLanguage);
  }, [language, user?.language]);

  return (
    <LocaleContext.Provider
      value={{
        language,
        currency,
        setLanguage,
        setCurrency,
        formatCurrency,
        getCurrencySymbol,
        t,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}

