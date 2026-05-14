"use client";

import { format } from "date-fns";
import { createContext, useContext, useState } from "react";

interface FechaContextValue {
  fecha: string;
  setFecha: (fecha: string) => void;
}

const FechaContext = createContext<FechaContextValue | null>(null);

export function useFecha() {
  const ctx = useContext(FechaContext);
  if (!ctx) throw new Error("useFecha must be used inside FechaProvider");
  return ctx;
}

export function FechaProvider({ children }: { children: React.ReactNode }) {
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd"));
  return (
    <FechaContext.Provider value={{ fecha, setFecha }}>
      {children}
    </FechaContext.Provider>
  );
}
