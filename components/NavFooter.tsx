"use client";

import { usePathname, useRouter } from "next/navigation";
import { NavProps, pageTabs } from "@/app/(app)/tabs";

export default function NavFooter({ usuario, pageAccess }: NavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const tabs = pageAccess[usuario.rol];

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 p-2 md:hidden bg-slate-50/90 backdrop-blur-sm">
      <nav className="flex items-center justify-around rounded-[28px] bg-[linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(15,23,42,0.92))] py-2 shadow-[0_-20px_60px_-20px_rgba(15,23,42,0.5)]">
        {tabs.map((item) => {
          const isActive = pathname === `/${item}`;
          return (
            <button
              key={item}
              title={pageTabs[item].title}
              onClick={() => router.push(`/${item}`)}
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
