import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Currency = 'ARS' | 'USD';
interface CurrencyContextProps {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatCurrency: (amount: number) => string;
  dolarBlue: number;
  loadingDolar: boolean;
}

const CurrencyContext = createContext<CurrencyContextProps | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>('ARS');
  const [dolarBlue, setDolarBlue] = useState<number>(1200);
  const [loadingDolar, setLoadingDolar] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem('currency');
    if (saved === 'ARS' || saved === 'USD') setCurrencyState(saved);
  }, []);

  const fetchDolar = async () => {
    setLoadingDolar(true);
    try {
      const res = await fetch('/api/dolar-blue');
      const data = await res.json();
      if (data.valor) setDolarBlue(data.valor);
    } catch {
      setDolarBlue(1200);
    } finally {
      setLoadingDolar(false);
    }
  };

  useEffect(() => {
    fetchDolar();
    
    // Actualizar el valor cada 30 minutos
    const interval = setInterval(fetchDolar, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('currency', c);
  };

  const formatCurrency = (amount: number) => {
    if (currency === 'ARS') {
      return `$${amount.toLocaleString('es-AR')} ARS`;
    }
    const usdAmount = amount / dolarBlue;
    return `$${usdAmount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })} USD`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, dolarBlue, loadingDolar }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency debe usarse dentro de CurrencyProvider');
  return ctx;
}; 