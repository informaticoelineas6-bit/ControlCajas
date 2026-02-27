import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get("fecha");
    const tipo = searchParams.get("tipo"); // 'expedicion_transporte' o 'devolucion_recogida'

    if (!fecha || !tipo) {
      return NextResponse.json(
        { error: "Fecha y tipo son requeridos" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();

    if (tipo === "expedicion_transporte") {
      // Obtener expediciones y transportes
      const expediciones = await db
        .collection("Expedicion")
        .find({ fecha })
        .toArray();

      console.log("Expediciones:", expediciones); // Debug: Ver expediciones obtenidas

      const transportes = await db
        .collection("Transporte")
        .find({ fecha })
        .toArray();

      console.log("Transportes:", transportes); // Debug: Ver transportes obtenidos

      // Agrupar por centro de distribución
      const centrosExp = new Map();
      expediciones.forEach((exp: any) => {
        const centro = exp.centro_distribucion;
        if (!centrosExp.has(centro)) {
          centrosExp.set(centro, {
            centro_distribucion: centro,
            expedicion: null,
            transporte: null,
            alerta: false,
          });
        }
        const item = centrosExp.get(centro);
        item.expedicion = { nombre: exp.nombre, cajas: exp.cajas };
      });

      transportes.forEach((trans: any) => {
        const centro = trans.centro_distribucion;
        if (!centrosExp.has(centro)) {
          centrosExp.set(centro, {
            centro_distribucion: centro,
            expedicion: null,
            transporte: null,
            alerta: true,
          });
        }
        const item = centrosExp.get(centro);
        item.chapa = item.chapa
          ? item.chapa + " + " + trans.chapa
          : trans.chapa; // Guardar chapa para posible uso futuro
        item.transporte = { nombre: trans.nombre, cajas: trans.cajas };
      });

      // Verificar inconsistencias
      const resultados = Array.from(centrosExp.values()).map((item) => {
        if (!item.expedicion || !item.transporte) {
          item.alerta = true; // Hay transporte pero no expedición o viceversa
        }
        if (item.expedicion && item.transporte) {
          // Ambos existen, comparar
          if (
            item.expedicion.cajas.blancas !== item.transporte.cajas.blancas ||
            item.expedicion.cajas.negras !== item.transporte.cajas.negras ||
            item.expedicion.cajas.verdes !== item.transporte.cajas.verdes
          ) {
            item.alerta = true;
          }
        }
        return item;
      });

      return NextResponse.json(resultados);
    } else if (tipo === "devolucion_recogida") {
      // Obtener devoluciones y recogidas
      const recogidas = await db
        .collection("Recogida")
        .find({ fecha })
        .toArray();

      console.log("Recogidas:", recogidas); // Debug: Ver recogidas obtenidas

      const devoluciones = await db
        .collection("Devolucion")
        .find({ fecha })
        .toArray();

      console.log("Devoluciones:", devoluciones); // Debug: Ver devoluciones obtenidas

      // Agrupar por centro de distribución
      const centrosRec = new Map();
      recogidas.forEach((rec: any) => {
        const centro = rec.centro_distribucion;
        if (!centrosRec.has(centro)) {
          centrosRec.set(centro, {
            centro_distribucion: centro,
            devolucion: null,
            recogida: null,
            alerta: false,
            rotura: false,
          });
        }
        const item = centrosRec.get(centro);
        item.chapa = item.chapa ? item.chapa + " + " + rec.chapa : rec.chapa; // Guardar chapa para posible uso futuro
        item.recogida = {
          nombre: rec.nombre,
          cajas: rec.cajas,
          cajas_rotas: rec.cajas_rotas,
          tapas_rotas: rec.tapas_rotas,
        };
      });

      devoluciones.forEach((dev: any) => {
        const centro = dev.centro_distribucion;
        if (!centrosRec.has(centro)) {
          centrosRec.set(centro, {
            centro_distribucion: centro,
            devolucion: null,
            recogida: null,
            alerta: false,
            rotura: false,
          });
        }
        const item = centrosRec.get(centro);
        item.devolucion = {
          nombre: dev.nombre,
          cajas: dev.cajas,
          cajas_rotas: dev.cajas_rotas,
          tapas_rotas: dev.tapas_rotas,
        };
      });

      // Verificar inconsistencias
      const resultados = Array.from(centrosRec.values()).map((item) => {
        if (!item.devolucion || !item.recogida) {
          item.alerta = true;
        }
        if (item.devolucion && item.recogida) {
          const dev = item.devolucion;
          const rec = item.recogida;
          if (
            dev.cajas.blancas !== rec.cajas.blancas ||
            dev.cajas.negras !== rec.cajas.negras ||
            dev.cajas.verdes !== rec.cajas.verdes ||
            dev.cajas_rotas.blancas !== rec.cajas_rotas.blancas ||
            dev.cajas_rotas.negras !== rec.cajas_rotas.negras ||
            dev.cajas_rotas.verdes !== rec.cajas_rotas.verdes ||
            dev.tapas_rotas.blancas !== rec.tapas_rotas.blancas ||
            dev.tapas_rotas.negras !== rec.tapas_rotas.negras ||
            dev.tapas_rotas.verdes !== rec.tapas_rotas.verdes
          ) {
            item.alerta = true;
          }
          if (
            dev.cajas_rotas.blancas > 0 ||
            rec.cajas_rotas.blancas > 0 ||
            dev.cajas_rotas.negras > 0 ||
            rec.cajas_rotas.negras > 0 ||
            dev.cajas_rotas.verdes > 0 ||
            rec.cajas_rotas.verdes > 0 ||
            dev.tapas_rotas.blancas > 0 ||
            rec.tapas_rotas.blancas > 0 ||
            dev.tapas_rotas.negras > 0 ||
            rec.tapas_rotas.negras > 0 ||
            dev.tapas_rotas.verdes > 0 ||
            rec.tapas_rotas.verdes > 0
          ) {
            item.rotura = true;
          }
        }
        return item;
      });

      return NextResponse.json(resultados);
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Error comparing events:", error);
    return NextResponse.json(
      { error: "Error al comparar eventos" },
      { status: 500 },
    );
  }
}
