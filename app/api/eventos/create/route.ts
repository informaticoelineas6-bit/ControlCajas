import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import {
  Cajas,
  COLECCIONES,
  Evento,
  EVENTOS_ARRAY,
  TIPOS_EVENTO,
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

async function buildMessage(
  db: any,
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
    await db
      .collection(ref.collection)
      .find({ fecha, centro_distribucion })
      .toArray()
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
    let coleccion = db.collection(tipo_evento);

    if (!coleccion) {
      return NextResponse.json(
        { error: "Tipo de evento inválido" },
        { status: 400 },
      );
    }

    let documento: any = {
      centro_distribucion,
      fecha: new Date().toISOString().split("T")[0],
      nombre: usuario.nombre,
      cajas: cajas || { blancas: 0, negras: 0, verdes: 0 },
    };

    if (
      tipo_evento === "Traspaso" ||
      tipo_evento === "Entrega" ||
      tipo_evento === "Recogida"
    ) {
      documento.chapa = chapa;
    }
    if (
      tipo_evento === "Expedicion" ||
      tipo_evento === "Traspaso" ||
      tipo_evento === "Devolucion"
    ) {
      documento.almacen = almacen;
    }
    if (tipo_evento === "Recogida" || tipo_evento === "Devolucion") {
      documento.cajas_rotas = cajas_rotas || {
        blancas: 0,
        negras: 0,
        verdes: 0,
      };
      documento.tapas_rotas = tapas_rotas || {
        blancas: 0,
        negras: 0,
      };
    }

    const resultado = await coleccion.insertOne(documento);
    const message =
      (await buildMessage(
        db,
        tipo_evento,
        documento.fecha,
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
