"use client";

import { format } from "date-fns";
import { createContext, useContext, useMemo, useState } from "react";

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

export function FechaProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd"));
  const payload = useMemo(() => ({ fecha, setFecha }), [fecha, setFecha]);
  return (
    <FechaContext.Provider value={payload}>{children}</FechaContext.Provider>
  );
}
