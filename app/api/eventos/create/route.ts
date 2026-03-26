import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import {
  Cajas,
  COLECCIONES,
  Devolucion,
  Entrega,
  Evento,
  EVENTOS_ARRAY,
  Expedicion,
  Nuevo,
  Provincia,
  Recogida,
  TIPOS_EVENTO,
  Traspaso,
} from "@/lib/constants";
import {
  AjusteStr,
  applyAjuste,
  hasCajas,
  sameCajas,
  sumCajas,
  usuarioCookie,
} from "../../../../lib/utils";
import { EventoCreateForm } from "@/components/FormularioEvento";
import { Db } from "mongodb";

async function buildMessage(
  db: Db,
  tipoEvento: TIPOS_EVENTO,
  fecha: string,
  centro_distribucion: string,
  cajasActuales: Cajas,
): Promise<string | null> {
  const referenceByTipo: Record<string, { collection: string; label: string }> =
    {
      Traspaso: { collection: COLECCIONES.EXPEDICION, label: "la Expedicion" },
      Entrega: { collection: COLECCIONES.TRASPASO, label: "el Traspaso" },
      Devolucion: { collection: COLECCIONES.RECOGIDA, label: "la Recogida" },
    };

  const ref = referenceByTipo[tipoEvento];
  if (!ref) {
    return null;
  }

  const referenciaEventos = (
    (await db
      .collection(ref.collection)
      .find({ fecha, centro_distribucion })
      .toArray()) as unknown as Evento[]
  )
    .map(applyAjuste)
    .filter(hasCajas) as AjusteStr<Evento>[];

  const referenciaTotal: Cajas = referenciaEventos.reduce(
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

    const data: EventoCreateForm = await request.json();
    const {
      centro_distribucion,
      almacen,
      cajas,
      chapa,
      cajas_rotas,
      tapas_rotas,
    } = data;

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

    const { db } = await connectToDatabase();
    const coleccion = db.collection(tipo_evento);

    if (!coleccion) {
      return NextResponse.json(
        { error: "Tipo de evento inválido" },
        { status: 400 },
      );
    }

    let centro_real = centro_distribucion;
    let provincia = undefined;
    const provinciaMap = await db
      .collection<Provincia>(COLECCIONES.PROVINCIA)
      .findOne({
        nombre: centro_distribucion,
      });
    if (provinciaMap) {
      centro_real = provinciaMap.centro_distribucion;
      provincia = provinciaMap.nombre;
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
          cajas_rotas,
          tapas_rotas,
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
          cajas_rotas,
          tapas_rotas,
        } as Nuevo<Devolucion>;
        break;
    }

    const resultado = await coleccion.insertOne(documento);
    const message =
      (await buildMessage(
        db,
        tipo_evento,
        documentoBase.fecha,
        centro_distribucion,
        cajas,
      )) ?? "Evento creado exitosamente.";

    return NextResponse.json({
      success: true,
      id: resultado.insertedId,
      message: message,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Error al crear el evento" },
      { status: 500 },
    );
  }
}
