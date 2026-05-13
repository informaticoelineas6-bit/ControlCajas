"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Usuario } from "@/lib/constants";
import { pageAccess } from "./tabs";
import { UserProvider } from "@/app/(app)/user-context";
import { FechaProvider } from "@/app/(app)/fecha-context";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import NavFooter from "@/components/NavFooter";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (response.ok && data.usuario) {
          setUsuario(data.usuario);
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUsuario();
  }, [router]);

  useEffect(() => {
    if (usuario && pathname === "/") {
      router.replace(`/${pageAccess[usuario.rol][0]}`);
    }
  }, [usuario, pathname, router]);

  if (loading || !usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">Cargando...</p>
      </div>
    );
  }

  return (
    <UserProvider usuario={usuario}>
      <div className="flex min-h-screen flex-col h-full md:h-screen">
        <Header usuario={usuario} />
        <div className="flex flex-1 flex-col gap-6 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_22%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_48%,_#f8fafc_100%)] p-2 md:p-4 lg:p-6 xl:p-8 md:flex-row md:overflow-hidden">
          <Sidebar usuario={usuario} pageAccess={pageAccess} />
          <main className="min-w-0 flex-1 space-y-6 overflow-x-auto pb-20 md:pb-0 md:overflow-y-auto">
            <FechaProvider>{children}</FechaProvider>
          </main>
        </div>
        <NavFooter usuario={usuario} pageAccess={pageAccess} />
      </div>
    </UserProvider>
  );
}
