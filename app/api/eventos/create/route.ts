import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Cajas, COLECCIONES, Evento } from "@/lib/constants";
import { sameCajas, sumCajas, userRole } from "../../utils";

async function buildMessage(
  db: any,
  tipoEvento: string,
  fecha: string,
  centro_distribucion: string,
  cajasActuales: Cajas,
): Promise<string | null> {
  const referenceByTipo: Record<string, { collection: string; label: string }> =
    {
      Traspaso: { collection: COLECCIONES.EXPEDICION, label: "Expedicion" },
      Entrega: { collection: COLECCIONES.TRASPASO, label: "Traspaso" },
      Devolucion: { collection: COLECCIONES.RECOGIDA, label: "Recogida" },
    };

  const ref = referenceByTipo[tipoEvento];
  if (!ref) {
    return null;
  }

  const referenciaEventos = (await db
    .collection(ref.collection)
    .find({ fecha, centro_distribucion })
    .toArray()) as Evento[];

  const referenciaTotal = referenciaEventos.reduce(
    (acc: Cajas, item: Evento) => sumCajas(acc, item.cajas),
    { blancas: 0, negras: 0, verdes: 0 },
  );

  if (sameCajas(cajasActuales, referenciaTotal))
    return `Evento creado exitosamente. La cantidad de cajas registradas coincide con ${ref.label}.`;
  else
    return `Advertencia: el conteo de cajas no coincide con la cantidad registrada durante el ${ref.label}. Compruebe nuevamente el conteo o póngase en contacto con un informático para más información.`;
}

export async function POST(request: NextRequest) {
  try {
    const useRole = userRole(request);
    if (useRole === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const data = await request.json();
    const {
      tipo_evento,
      centro_distribucion,
      almacen,
      fecha,
      nombre,
      cajas,
      chapa,
      cajas_rotas,
      tapas_rotas,
    } = data;

    if (!tipo_evento || !centro_distribucion || !fecha || !nombre) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const tipo = tipo_evento;
    const permitido =
      (useRole === "chofer" &&
        (tipo === "Entrega" || tipo === "Recogida" || tipo === "Traspaso")) ||
      (useRole === "expedidor" && tipo === "Expedicion") ||
      (useRole === "almacenero" && tipo === "Devolucion");
    if (!permitido) {
      return NextResponse.json(
        { error: "No tiene permiso para ese tipo de evento" },
        { status: 401 },
      );
    }

    const { db } = await connectToDatabase();
    let coleccion;
    let documento: any = {
      centro_distribucion,
      fecha,
      nombre,
      cajas: cajas || { blancas: 0, negras: 0, verdes: 0 },
    };

    if (
      tipo_evento === "Entrega" ||
      tipo_evento === "Recogida" ||
      tipo === "Traspaso"
    ) {
      documento.chapa = chapa;
      if (tipo_evento === "Recogida") {
        documento.cajas_rotas = cajas_rotas || {
          blancas: 0,
          negras: 0,
          verdes: 0,
        };
        documento.tapas_rotas = tapas_rotas || {
          blancas: 0,
          negras: 0,
          verdes: 0,
        };
      }
      coleccion = db.collection(tipo_evento);
    } else if (tipo_evento === "Expedicion" || tipo_evento === "Devolucion") {
      documento.almacen = almacen;
      if (tipo_evento === "Devolucion") {
        documento.cajas_rotas = cajas_rotas || {
          blancas: 0,
          negras: 0,
          verdes: 0,
        };
        documento.tapas_rotas = tapas_rotas || {
          blancas: 0,
          negras: 0,
          verdes: 0,
        };
      }
      coleccion = db.collection(tipo_evento);
    }

    if (!coleccion) {
      return NextResponse.json(
        { error: "Tipo de evento inválido" },
        { status: 400 },
      );
    }

    const resultado = await coleccion.insertOne(documento);
    const message = await buildMessage(
      db,
      tipo_evento,
      fecha,
      centro_distribucion,
      cajas,
    );

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
