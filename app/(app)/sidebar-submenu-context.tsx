"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface SidebarSubmenuItem {
  icon: ReactNode;
  key: string;
  name: string;
}

export interface SidebarSubmenu {
  activeKey: string;
  items: SidebarSubmenuItem[];
  onSelect: (key: string) => void;
  route: string;
}

interface SidebarSubmenuContextValue {
  clearSubmenu: () => void;
  setSubmenu: (submenu: SidebarSubmenu) => void;
  submenu: SidebarSubmenu | null;
}

const SidebarSubmenuContext = createContext<SidebarSubmenuContextValue | null>(
  null,
);

export function SidebarSubmenuProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [submenu, setSubmenu] = useState<SidebarSubmenu | null>(null);
  const clearSubmenu = useCallback(() => setSubmenu(null), []);

  const value = useMemo(
    () => ({
      clearSubmenu,
      setSubmenu,
      submenu,
    }),
    [clearSubmenu, submenu],
  );

  return (
    <SidebarSubmenuContext.Provider value={value}>
      {children}
    </SidebarSubmenuContext.Provider>
  );
}

export function useSidebarSubmenu() {
  const context = useContext(SidebarSubmenuContext);

  if (!context) {
    throw new Error(
      "useSidebarSubmenu must be used within SidebarSubmenuProvider",
    );
  }

  return context;
}
