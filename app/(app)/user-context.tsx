"use client";

import { createContext, useContext } from "react";
import { Usuario } from "@/lib/constants";

const UserContext = createContext<Usuario | null>(null);

export const useUser = () => useContext(UserContext);

export function UserProvider({
  children,
  usuario,
}: {
  children: React.ReactNode;
  usuario: Usuario;
}) {
  return <UserContext.Provider value={usuario}>{children}</UserContext.Provider>;
}
