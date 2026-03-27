import {
  Cajas,
  COLECCIONES,
  Devolucion,
  Entrega,
  Expedicion,
  Recogida,
  Tapas,
  TIPOS_EVENTO,
  Traspaso,
  Usuario,
} from "@/lib/constants";
import { connectToDatabase, DeleteAudit } from "@/lib/mongodb";
import { applyAjuste, hasCajas, usuarioCookie } from "@/lib/utils";
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

    const { db } = await connectToDatabase();
    const usuarios = db.collection<Usuario>(COLECCIONES.USUARIO);
    const expediciones = db.collection<Expedicion>(COLECCIONES.EXPEDICION);
    const traspasos = db.collection<Traspaso>(COLECCIONES.TRASPASO);
    const entregas = db.collection<Entrega>(COLECCIONES.ENTREGA);
    const recogidas = db.collection<Recogida>(COLECCIONES.RECOGIDA);
    const devoluciones = db.collection<Devolucion>(COLECCIONES.DEVOLUCION);

    const [
      usuario,
      expedicionesRaw,
      traspasosRaw,
      entregasRaw,
      recogidasRaw,
      devolucionesRaw,
    ] = await Promise.all([
      usuarios.findOne(
        { nombre },
        {
          projection: {
            _id: 0,
            nombre: 1,
            rol: 1,
            fechaCreacion: 1,
            ajuste: 1,
          },
        },
      ),
      expediciones
        .find(
          { nombre },
          {
            projection: {
              _id: 0,
              fecha: 1,
              centro_distribucion: 1,
              cajas: 1,
              ajuste: 1,
            },
          },
        )
        .toArray(),
      traspasos
        .find(
          { nombre },
          {
            projection: {
              _id: 0,
              fecha: 1,
              centro_distribucion: 1,
              cajas: 1,
              ajuste: 1,
            },
          },
        )
        .toArray(),
      entregas
        .find(
          { nombre },
          {
            projection: {
              _id: 0,
              fecha: 1,
              centro_distribucion: 1,
              cajas: 1,
              ajuste: 1,
            },
          },
        )
        .toArray(),
      recogidas
        .find(
          { nombre },
          {
            projection: {
              _id: 0,
              fecha: 1,
              centro_distribucion: 1,
              cajas: 1,
              cajas_rotas: 1,
              tapas_rotas: 1,
              ajuste: 1,
            },
          },
        )
        .toArray(),
      devoluciones
        .find(
          { nombre },
          {
            projection: {
              _id: 0,
              fecha: 1,
              centro_distribucion: 1,
              cajas: 1,
              cajas_rotas: 1,
              tapas_rotas: 1,
              ajuste: 1,
            },
          },
        )
        .toArray(),
    ]);

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    let eventos;
    let deletes;

    if (usuario.rol === "informatico") {
      deletes = await db
        .collection<DeleteAudit>(COLECCIONES.AUDITORIA)
        .find({ deletedBy: usuario.nombre })
        .toArray();
    } else {
      eventos = [
        ...expedicionesRaw
          .map(applyAjuste)
          .filter(hasCajas)
          .map((evento) => ({ ...evento, tipo_evento: "Expedicion" as const })),
        ...traspasosRaw
          .map(applyAjuste)
          .filter(hasCajas)
          .map((evento) => ({ ...evento, tipo_evento: "Traspaso" as const })),
        ...entregasRaw
          .map(applyAjuste)
          .filter(hasCajas)
          .map((evento) => ({ ...evento, tipo_evento: "Entrega" as const })),
        ...recogidasRaw
          .map(applyAjuste)
          .filter(hasCajas)
          .map((evento) => ({ ...evento, tipo_evento: "Recogida" as const })),
        ...devolucionesRaw
          .map(applyAjuste)
          .filter(hasCajas)
          .map((evento) => ({ ...evento, tipo_evento: "Devolucion" as const })),
      ]
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .map((evento) => ({
          fecha: evento.fecha,
          centro_distribucion: evento.centro_distribucion,
          tipo_evento: evento.tipo_evento,
          cajas: evento.cajas,
          cajas_rotas: ("cajas_rotas" in evento
            ? evento.cajas_rotas
            : { blancas: 0, negras: 0, verdes: 0 }) as Cajas,
          tapas_rotas: ("tapas_rotas" in evento
            ? evento.tapas_rotas
            : { blancas: 0, negras: 0 }) as Tapas,
        }));
    }

    const audit: UsuarioAudit = {
      usuario,
      eventos,
      deletes,
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
  usuario: Usuario;
  eventos?: EventoAudit[];
  deletes?: DeleteAudit[];
}

export interface EventoAudit {
  fecha: string;
  centro_distribucion: string;
  tipo_evento: TIPOS_EVENTO;
  cajas: Cajas;
  cajas_rotas: Cajas;
  tapas_rotas: Tapas;
}
