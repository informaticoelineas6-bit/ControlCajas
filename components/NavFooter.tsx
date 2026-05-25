"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NavProps, pageTabs } from "@/app/(app)/tabs";
import { useSidebarSubmenu } from "@/app/(app)/sidebar-submenu-context";

export default function NavFooter({ usuario, pageAccess }: Readonly<NavProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const tabs = pageAccess[usuario.rol];
  const { submenu } = useSidebarSubmenu();
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(true);
  const footerRef = useRef<HTMLDivElement>(null);
  const activeSubmenu =
    submenu?.route === pathname && submenu.items.length > 0 ? submenu : null;

  useEffect(() => {
    setIsSubmenuOpen(true);
  }, [pathname]);

  useEffect(() => {
    if (!isSubmenuOpen) return;

    const handleOutsidePress = (event: PointerEvent) => {
      if (
        footerRef.current &&
        !footerRef.current.contains(event.target as Node)
      ) {
        setIsSubmenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsidePress);
    return () =>
      document.removeEventListener("pointerdown", handleOutsidePress);
  }, [isSubmenuOpen]);

  const handleTabClick = (item: string, isActive: boolean) => {
    if (isActive && activeSubmenu) {
      setIsSubmenuOpen((current) => !current);
      return;
    }

    setIsSubmenuOpen(false);
    router.push(`/${item}`);
  };

  return (
    <div
      ref={footerRef}
      className="fixed bottom-0 inset-x-0 z-40 md:hidden border-b border-white/10 bg-[linear-gradient(120deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.94),_rgba(14,165,233,0.88))] py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-white shadow-[0_-20px_60px_-20px_rgba(15,23,42,0.5)] backdrop-blur-sm"
    >
      {isSubmenuOpen && activeSubmenu && (
        <div className="absolute inset-x-3 bottom-[calc(100%+0.75rem)]">
          <div className="rounded-[24px] border border-white/15 bg-slate-950/95 p-2 shadow-[0_24px_55px_-24px_rgba(15,23,42,0.95)] backdrop-blur">
            <div className="grid grid-cols-2 gap-1">
              {activeSubmenu.items.map((submenuItem) => {
                const isActive = activeSubmenu.activeKey === submenuItem.key;

                return (
                  <button
                    key={submenuItem.key}
                    type="button"
                    onClick={() => {
                      activeSubmenu.onSelect(submenuItem.key);
                    }}
                    className={`flex min-h-12 items-center gap-2 rounded-[18px] px-3 py-2.5 text-left text-sm font-semibold transition ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm"
                        : "text-slate-200 active:bg-white/10"
                    }`}
                  >
                    <span className="shrink-0">{submenuItem.icon}</span>
                    <span className="min-w-0 leading-5">
                      {submenuItem.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mx-auto h-3 w-3 -translate-y-1 rotate-45 border-b border-r border-white/15 bg-slate-950/95" />
        </div>
      )}
      <nav className="flex items-center justify-around">
        {tabs.map((item) => {
          const isActive = pathname === `/${item}`;
          return (
            <button
              key={item}
              type="button"
              title={pageTabs[item].title}
              aria-expanded={
                isActive && activeSubmenu ? isSubmenuOpen : undefined
              }
              onClick={() => handleTabClick(item, isActive)}
              className={`rounded-[18px] p-3 transition-all ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-[0_8px_20px_-8px_rgba(59,130,246,0.8)]"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {pageTabs[item].icons}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
