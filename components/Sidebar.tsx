"use client";

import { usePathname, useRouter } from "next/navigation";
import { NavProps, pageTabs } from "@/app/(app)/tabs";
import { prettyName } from "@/lib/utils";
import { useSidebarSubmenu } from "@/app/(app)/sidebar-submenu-context";

export default function Sidebar({ usuario, pageAccess }: NavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const tabs = pageAccess[usuario.rol];
  const { submenu } = useSidebarSubmenu();

  return (
    <aside className="hidden md:flex md:flex-col rounded-[34px] bg-[linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(15,23,42,0.92))] p-2 lg:p-5 text-white shadow-[0_30px_90px_-42px_rgba(15,23,42,0.95)] md:w-[260px] md:shrink-0 md:overflow-y-auto">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sky-200/80">
          Control de cajas
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          {usuario.nombre ? prettyName(usuario.nombre) : "-"}
        </h2>
        <p className="mt-2 text-sm capitalize text-slate-300">{usuario.rol}</p>
      </div>

      <nav className="mt-6 space-y-2">
        {tabs.map((item) => {
          const isActive = pathname === `/${item}`;
          return (
            <div key={item}>
              <button
                title={pageTabs[item].helper}
                onClick={() => router.push(`/${item}`)}
                className={`w-full rounded-[22px] px-4 py-4 text-left transition ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-[0_18px_35px_-18px_rgba(59,130,246,0.9)]"
                    : "bg-white/0 text-slate-200 hover:bg-white/8 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  {pageTabs[item].icons}
                  <p className="text-base font-semibold">
                    {pageTabs[item].title}
                  </p>
                </div>
                <p className="mt-1 text-sm text-white/70">
                  {pageTabs[item].description}
                </p>
              </button>
              {isActive && submenu?.route === pathname && (
                <div className="mt-2 space-y-1 rounded-[22px] border border-white/10 bg-white/5 p-2">
                  {submenu.items.map((submenuItem) => {
                    const isSubmenuActive =
                      submenu.activeKey === submenuItem.key;

                    return (
                      <button
                        key={submenuItem.key}
                        type="button"
                        onClick={() => submenu.onSelect(submenuItem.key)}
                        className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition text-slate-300 ${
                          isSubmenuActive
                            ? "bg-gradient-to-r from-blue-600 to-cyan-500 shadow-sm"
                            : "hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {submenuItem.icon}
                        {submenuItem.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
