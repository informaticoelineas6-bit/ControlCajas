"use client";

import { usePathname, useRouter } from "next/navigation";
import { NavProps, pageTabs } from "@/app/(app)/tabs";
import { prettyName } from "@/lib/utils";

export default function Sidebar({ usuario, pageAccess }: NavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const tabs = pageAccess[usuario.rol];

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
            <button
              key={item}
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
              <p
                className={`mt-1 text-sm ${
                  isActive ? "text-blue-50" : "text-slate-400"
                }`}
              >
                {pageTabs[item].description}
              </p>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
