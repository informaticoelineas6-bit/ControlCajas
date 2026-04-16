import {
  AuditLog,
  Cajas,
  Created,
  Devolucion,
  Entrega,
  Evento,
  EventoRotura,
  Expedicion,
  Recogida,
  TABLAS,
  Tapas,
  TIPOS_EVENTO,
  Traspaso,
  Usuario,
} from "@/lib/constants";
import { connectToDatabase } from "@/lib/server";
import { AjusteStr, applyAjuste, hasCajas } from "@/lib/utils";
import { usuarioCookie } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const usuarioAuth = usuarioCookie(request);
    if (usuarioAuth === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuarioAuth.rol !== "informatico" && usuarioAuth.rol !== "auditor")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const nombre = searchParams.get("nombre");

    if (!nombre) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const db = await connectToDatabase();

    const usuariosRes = await db
      .from(TABLAS.USUARIO)
      .select<string, Created<Usuario>>("nombre, rol, created_at, ajuste")
      .eq("nombre", nombre);

    if (usuariosRes.error) throw new Error(usuariosRes.error.message);

    const usuario = usuariosRes.data[0];

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    let eventos;
    let logs;

    if (usuario.rol === "informatico") {
      const { data, error } = await db
        .from(TABLAS.AUDITLOG)
        .select("*")
        .eq("usuario", nombre);

      if (error) throw new Error(error.message);

      logs = data;
    } else {
      const [
        expedicionesRaw,
        traspasosRaw,
        entregasRaw,
        recogidasRaw,
        devolucionesRaw,
      ] = await Promise.all([
        db
          .from(TABLAS.EXPEDICION)
          .select<
            string,
            Expedicion
          >("centro_distribucion, fecha, nombre, cajas")
          .eq("nombre", nombre),
        db
          .from(TABLAS.TRASPASO)
          .select<string, Traspaso>("centro_distribucion, fecha, nombre, cajas")
          .eq("nombre", nombre),
        db
          .from(TABLAS.ENTREGA)
          .select<string, Entrega>("centro_distribucion, fecha, nombre, cajas")
          .eq("nombre", nombre),
        db
          .from(TABLAS.RECOGIDA)
          .select<
            string,
            Recogida
          >("centro_distribucion, fecha, nombre, cajas, roturas")
          .eq("nombre", nombre),
        db
          .from(TABLAS.DEVOLUCION)
          .select<
            string,
            Devolucion
          >("centro_distribucion, fecha, nombre, cajas, roturas")
          .eq("nombre", nombre),
      ]);

      const error =
        expedicionesRaw.error ||
        traspasosRaw.error ||
        entregasRaw.error ||
        recogidasRaw.error ||
        devolucionesRaw.error;

      if (error) throw new Error(error.message);

      eventos = [
        ...(expedicionesRaw.data.map(applyAjuste) as AjusteStr<Evento>[])
          .filter(hasCajas)
          .map((evento) => ({
            ...evento,
            id: undefined,
            ajuste: undefined,
            tipo_evento: "Expedicion" as const,
          })),
        ...(traspasosRaw.data.map(applyAjuste) as AjusteStr<Evento>[])
          .filter(hasCajas)
          .map((evento) => ({
            ...evento,
            id: undefined,
            ajuste: undefined,
            tipo_evento: "Traspaso" as const,
          })),
        ...(entregasRaw.data.map(applyAjuste) as AjusteStr<Evento>[])
          .filter(hasCajas)
          .map((evento) => ({
            ...evento,
            id: undefined,
            ajuste: undefined,
            tipo_evento: "Entrega" as const,
          })),
        ...(recogidasRaw.data.map(applyAjuste) as AjusteStr<EventoRotura>[])
          .filter(hasCajas)
          .map((evento) => ({
            ...evento,
            id: undefined,
            ajuste: undefined,
            tipo_evento: "Recogida" as const,
          })),
        ...(devolucionesRaw.data.map(applyAjuste) as AjusteStr<EventoRotura>[])
          .filter(hasCajas)
          .map((evento) => ({
            ...evento,
            id: undefined,
            ajuste: undefined,
            tipo_evento: "Devolucion" as const,
          })),
      ].sort((a, b) => b.fecha.localeCompare(a.fecha));
    }

    const audit: UsuarioAudit = {
      usuario,
      eventos,
      logs,
    };

    return NextResponse.json(audit);
  } catch (error) {
    console.error("Error al obtener datos:", error);
    return NextResponse.json(
      { error: "Error al obtener datos" },
      { status: 500 },
    );
  }
}

export interface UsuarioAudit {
  usuario: Created<Usuario>;
  eventos?: EventoAudit[];
  logs?: AuditLog[];
}

export interface EventoAudit {
  fecha: string;
  centro_distribucion: string;
  tipo_evento: TIPOS_EVENTO;
  cajas: Cajas;
  roturas?: {
    cajas: Cajas;
    tapas: Tapas;
  };
}
