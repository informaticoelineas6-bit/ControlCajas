"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import FormularioEvento from "@/components/FormularioEvento";
import TablaExpedicionTransporte from "@/components/TablaExpedicionTransporte";
import TablaDevolucionRecogida from "@/components/TablaDevolucionRecogida";

interface Usuario {
  id: string;
  nombre: string;
  rol: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [activeTab, setActiveTab] = useState<
    "eventos" | "mis_eventos" | "ver_eventos"
  >("eventos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener usuario desde el servidor
    const fetchUsuario = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (response.ok && data.usuario) {
          setUsuario(data.usuario);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUsuario();
  }, [router]);

  if (loading || !usuario) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <>
      <Header usuario={usuario} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex gap-4 border-b">
            <button
              onClick={() => setActiveTab("eventos")}
              className={`px-4 py-2 font-semibold border-b-2 transition ${
                activeTab === "eventos"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              Nuevo Evento
            </button>
            <button
              onClick={() => setActiveTab("mis_eventos")}
              className={`px-4 py-2 font-semibold border-b-2 transition ${
                activeTab === "mis_eventos"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              Mis Eventos
            </button>
            <button
              onClick={() => setActiveTab("ver_eventos")}
              className={`px-4 py-2 font-semibold border-b-2 transition ${
                activeTab === "ver_eventos"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              Ver Eventos
            </button>
          </div>
        </div>

        {activeTab === "eventos" ? (
          usuario.rol === "informatico" ? (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
              Los informáticos no pueden crear eventos
            </div>
          ) : (
            <FormularioEvento usuario={usuario} />
          )
        ) : usuario.rol === "informatico" ? (
          <div className="space-y-8">
            <TablaExpedicionTransporte />
            <TablaDevolucionRecogida />
          </div>
        ) : (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
            Sólo los informáticos pueden ver los eventos
          </div>
        )}
      </div>
    </>
  );
}
