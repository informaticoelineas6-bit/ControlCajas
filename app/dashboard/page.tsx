"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import FormularioEvento from "@/components/FormularioEvento";
import TablaExpedicionTransporte from "@/components/TablaExpedicionTransporte";
import TablaDevolucionRecogida from "@/components/TablaDevolucionRecogida";
import TablaExpedicion from "@/components/TablaExpedicion";
import TablaTransporte from "@/components/TablaTransporte";
import TablaDevolucionSimple from "@/components/TablaDevolucionSimple";
import TablaRecogidaSimple from "@/components/TablaRecogidaSimple";

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
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);

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
        ) : activeTab === "mis_eventos" ? (
          <div className="space-y-8">
            {/* Mostrar 4 tablas separadas. La API limitará por usuario si no es informático */}
            <div className="bg-white rounded-lg shadow p-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <TablaExpedicion usuario={usuario} fecha={fecha} />
              <TablaTransporte usuario={usuario} fecha={fecha} />
              <TablaRecogidaSimple usuario={usuario} fecha={fecha} />
              <TablaDevolucionSimple usuario={usuario} fecha={fecha} />
            </div>
          </div>
        ) : usuario.rol === "informatico" ? (
          <div className="space-y-8 bg-white rounded-lg shadow p-6">
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
