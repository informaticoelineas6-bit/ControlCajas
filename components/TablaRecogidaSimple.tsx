"use client";

import { useState, useEffect } from "react";

interface Evento {
  centro_distribucion: string;
  fecha: string;
  nombre: string;
  chapa?: string;
  cajas?: { blancas?: number; negras?: number; verdes?: number };
  cajas_rotas?: { blancas?: number; negras?: number; verdes?: number };
}

export default function TablaRecogidaSimple({
  fecha,
  usuario,
}: Readonly<{
  fecha: string;
  usuario: any;
}>) {
  const [datos, setDatos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDatos();
  }, [fecha]);

  const fetchDatos = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/eventos/list?fecha=${fecha}&tipo=Recogida`);
      const data = await res.json();
      if (res.ok) setDatos(data);
      else setError(data.error || "Error al cargar eventos");
    } catch {
      setError("Error en el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        usuario.rol === "informatico" || usuario.rol === "chofer"
          ? "mt-6"
          : "hidden"
      }
    >
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th
                  colSpan={6}
                  className="text-2xl font-bold border p-2 text-center text-gray-800 bg-blue-50"
                >
                  Recogidas
                </th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Centro</th>
                <th className="border p-2 text-left">Chofer</th>
                <th className="border p-2 text-left">Chapa</th>
                <th className="border p-2 text-center">Blancas</th>
                <th className="border p-2 text-center">Negras</th>
                <th className="border p-2 text-center">Verdes</th>
                <th className="border p-2 text-center hidden">Rotas B</th>
                <th className="border p-2 text-center hidden">Rotas N</th>
                <th className="border p-2 text-center hidden">Rotas V</th>
              </tr>
            </thead>
            <tbody>
              {datos.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="border p-4 text-center text-gray-500"
                  >
                    No hay eventos para esta fecha
                  </td>
                </tr>
              ) : (
                datos.map((d, i) => (
                  <tr key={i} className="hover:bg-gray-100">
                    <td className="border p-2">{d.centro_distribucion}</td>
                    <td className="border p-2">{d.nombre}</td>
                    <td className="border p-2">{d.chapa ?? "-"}</td>
                    <td className="border p-2 text-center">
                      {d.cajas?.blancas ?? "-"}
                    </td>
                    <td className="border p-2 text-center">
                      {d.cajas?.negras ?? "-"}
                    </td>
                    <td className="border p-2 text-center">
                      {d.cajas?.verdes ?? "-"}
                    </td>
                    <td className="border p-2 text-center hidden">
                      {d.cajas_rotas?.blancas ?? "-"}
                    </td>
                    <td className="border p-2 text-center hidden">
                      {d.cajas_rotas?.negras ?? "-"}
                    </td>
                    <td className="border p-2 text-center hidden">
                      {d.cajas_rotas?.verdes ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
