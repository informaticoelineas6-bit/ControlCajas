import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/server";
import {
  Cajas,
  Devolucion,
  Entrega,
  Evento,
  EVENTOS_ARRAY,
  Expedicion,
  getEventTable,
  Nuevo,
  Provincia,
  Recogida,
  TABLAS,
  TIPOS_EVENTO,
  Traspaso,
} from "@/lib/constants";
import {
  AjusteStr,
  applyAjuste,
  hasCajas,
  sameCajas,
  sumCajas,
} from "@/lib/utils";
import { usuarioCookie } from "@/lib/auth";
import { EventoCreateForm } from "@/components/FormularioEvento";
import { SupabaseClient } from "@supabase/supabase-js";

async function buildMessage(
  db: SupabaseClient,
  tipoEvento: TIPOS_EVENTO,
  fecha: string,
  centro_distribucion: string,
  cajasActuales: Cajas,
): Promise<string | null> {
  const referenceByTipo: Record<string, { collection: string; label: string }> =
    {
      Traspaso: { collection: TABLAS.EXPEDICION, label: "la expedicion" },
      Entrega: { collection: TABLAS.TRASPASO, label: "el traspaso" },
      Devolucion: { collection: TABLAS.RECOGIDA, label: "la recogida" },
    };

  const ref = referenceByTipo[tipoEvento];
  if (!ref) {
    return null;
  }

  const referenciaEventos = await db
    .from(ref.collection)
    .select("*")
    .eq("fecha", fecha)
    .eq("centro_distribucion", centro_distribucion);

  if (referenciaEventos.error)
    return `Evento creado exitosamente.\nNo se pudo comprobar la cantidad de cajas (${referenciaEventos.error.message}).`;

  const eventos = referenciaEventos.data
    .map(applyAjuste)
    .filter(hasCajas) as AjusteStr<Evento>[];

  const referenciaTotal: Cajas = eventos.reduce(
    (acc: Cajas, item: AjusteStr<Evento>) => sumCajas(acc, item.cajas) as Cajas,
    { blancas: 0, negras: 0, verdes: 0 },
  );

  if (sameCajas(cajasActuales, referenciaTotal))
    return `Evento creado exitosamente.\nLa cantidad de cajas registradas coincide con ${ref.label}.`;
  else
    return `Evento creado exitosamente.\nAdvertencia: la cantidad de cajas no coincide con la cantidad registrada durante ${ref.label}. Cuente nuevamente y póngase en contacto con un informático.`;
}

export async function POST(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tipo_evento = searchParams.get("tipo");

    const {
      centro_distribucion,
      almacen,
      cajas,
      chapa,
      roturas,
    }: EventoCreateForm = await request.json();

    if (!tipo_evento || !centro_distribucion || !usuario.nombre) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    if (!EVENTOS_ARRAY.includes(tipo_evento as TIPOS_EVENTO)) {
      return NextResponse.json(
        { error: "Tipo de evento inválido" },
        { status: 400 },
      );
    }

    const permitido =
      (usuario.rol === "chofer" &&
        (tipo_evento === "Entrega" ||
          tipo_evento === "Recogida" ||
          tipo_evento === "Traspaso")) ||
      (usuario.rol === "expedidor" && tipo_evento === "Expedicion") ||
      (usuario.rol === "almacenero" && tipo_evento === "Devolucion");
    if (!permitido) {
      return NextResponse.json(
        { error: "No tiene permiso para ese tipo de evento" },
        { status: 401 },
      );
    }

    const db = await connectToDatabase();

    const tablaEvento = db.from(getEventTable[tipo_evento]);

    if (!tablaEvento) {
      return NextResponse.json(
        { error: "Tipo de evento inválido" },
        { status: 400 },
      );
    }

    let centro_real = centro_distribucion;
    let provincia: string | undefined = undefined;

    const provinciaRaw = await db
      .from(TABLAS.PROVINCIA)
      .select<string, Provincia>("*")
      .eq("nombre", centro_distribucion);

    if (provinciaRaw.error) throw new Error(provinciaRaw.error.message);

    if (provinciaRaw.data.length > 0) {
      centro_real = provinciaRaw.data[0].centro_distribucion;
      provincia = provinciaRaw.data[0].nombre;
    }

    const documentoBase = {
      centro_distribucion: centro_real,
      provincia,
      fecha: new Date().toISOString().split("T")[0],
      nombre: usuario.nombre,
      cajas: cajas || { blancas: 0, negras: 0, verdes: 0 },
    };

    let documento;
    switch (tipo_evento) {
      case "Entrega":
        documento = { ...documentoBase, chapa } as Nuevo<Entrega>;
        break;
      case "Recogida":
        documento = {
          ...documentoBase,
          chapa,
          roturas,
        } as Nuevo<Recogida>;
        break;
      case "Traspaso":
        documento = { ...documentoBase, chapa, almacen } as Nuevo<Traspaso>;
        break;
      case "Expedicion":
        documento = {
          ...documentoBase,
          almacen,
        } as Nuevo<Expedicion>;
        break;
      case "Devolucion":
        documento = {
          ...documentoBase,
          almacen,
          roturas,
        } as Nuevo<Devolucion>;
        break;
    }

    const { error } = await tablaEvento.insert(documento);

    if (error) throw new Error(error.message);

    const message =
      (await buildMessage(
        // TODO: Optimizar mediante una función SQL.
        db,
        tipo_evento,
        documentoBase.fecha,
        centro_distribucion,
        cajas,
      )) ?? "Evento creado exitosamente.";

    return NextResponse.json(
      {
        success: true,
        message: message,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Error al crear el evento" },
      { status: 500 },
    );
  }
}
