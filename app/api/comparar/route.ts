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

    function sumCajas(
      actuales: { blancas: any; negras: any; verdes: any },
      nuevas: { blancas: number; negras: number; verdes: number },
    ): { blancas: number; negras: number; verdes: number } {
      return {
        blancas: (actuales?.blancas ?? 0) + (nuevas.blancas ?? 0),
        negras: (actuales?.negras ?? 0) + (nuevas.negras ?? 0),
        verdes: (actuales?.verdes ?? 0) + (nuevas.verdes ?? 0),
      };
    }

    function appendNombre(actual: string, nuevo: string): string {
      return actual
        ? actual.includes(nuevo)
          ? actual
          : actual + " + " + nuevo
        : nuevo;
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

      for (const current of expediciones) {
        const centro = current.centro_distribucion;
        if (!centrosExp.has(centro)) {
          centrosExp.set(centro, {
            centro_distribucion: centro,
            chapa: null,
            expedicion: { nombre: current.nombre, cajas: current.cajas },
            transporte: null,
            alerta: false,
          });
        } else {
          const item = centrosExp.get(centro);
          item.expedicion = {
            nombre: appendNombre(item.expedicion?.nombre, current.nombre),
            cajas: sumCajas(item.expedicion?.cajas, current.cajas),
          };
        }
      }

      for (const current of transportes) {
        const centro = current.centro_distribucion;
        if (!centrosExp.has(centro)) {
          centrosExp.set(centro, {
            centro_distribucion: centro,
            chapa: current.chapa,
            expedicion: null,
            transporte: { nombre: current.nombre, cajas: current.cajas },
            alerta: true,
          });
        } else {
          const item = centrosExp.get(centro);
          item.chapa = appendNombre(item.chapa, current.chapa);
          item.transporte = {
            nombre: appendNombre(item.transporte?.nombre, current.nombre),
            cajas: sumCajas(item.transporte?.cajas, current.cajas),
          };
        }
      }

      // Verificar inconsistencias
      const resultados = Array.from(centrosExp.values()).map((item) => {
        if (item.expedicion && item.transporte) {
          // Ambos existen, comparar
          if (
            item.expedicion?.cajas?.blancas !==
              item.transporte?.cajas?.blancas ||
            item.expedicion?.cajas?.negras !== item.transporte?.cajas?.negras ||
            item.expedicion?.cajas?.verdes !== item.transporte?.cajas?.verdes
          ) {
            item.alerta = true;
          }
        } else {
          item.alerta = true;
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

      for (const current of recogidas) {
        const centro = current.centro_distribucion;
        if (!centrosRec.has(centro)) {
          centrosRec.set(centro, {
            centro_distribucion: centro,
            chapa: current.chapa,
            recogida: {
              nombre: current.nombre,
              cajas: current.cajas,
              cajas_rotas: current.cajas_rotas,
              tapas_rotas: current.tapas_rotas,
            },
            devolucion: null,
            alerta: false,
            rotura: false,
          });
        } else {
          const item = centrosRec.get(centro);
          item.chapa = appendNombre(item.chapa, current.chapa);
          item.recogida = {
            nombre: appendNombre(item.recogida?.nombre, current.nombre),
            cajas: sumCajas(item.recogida?.cajas, current.cajas),
            cajas_rotas: sumCajas(
              item.recogida?.cajas_rotas,
              current.cajas_rotas,
            ),
            tapas_rotas: sumCajas(
              item.recogida?.tapas_rotas,
              current.tapas_rotas,
            ),
          };
        }
      }

      for (const current of devoluciones) {
        const centro = current.centro_distribucion;
        if (!centrosRec.has(centro)) {
          centrosRec.set(centro, {
            centro_distribucion: centro,
            chapa: null,
            recogida: null,
            devolucion: {
              nombre: current.nombre,
              cajas: current.cajas,
              cajas_rotas: current.cajas_rotas,
              tapas_rotas: current.tapas_rotas,
            },
            alerta: false,
            rotura: false,
          });
        } else {
          const item = centrosRec.get(centro);
          item.devolucion = {
            nombre: appendNombre(item.devolucion?.nombre, current.nombre),
            cajas: sumCajas(item.devolucion?.cajas, current.cajas),
            cajas_rotas: sumCajas(
              item.devolucion?.cajas_rotas,
              current.cajas_rotas,
            ),
            tapas_rotas: sumCajas(
              item.devolucion?.tapas_rotas,
              current.tapas_rotas,
            ),
          };
        }
      }

      // Verificar inconsistencias
      const resultados = Array.from(centrosRec.values()).map((item) => {
        if (item.devolucion && item.recogida) {
          const dev = item.devolucion;
          const rec = item.recogida;
          if (
            dev.cajas.blancas !== rec.cajas.blancas ||
            dev.cajas.negras !== rec.cajas.negras ||
            dev.cajas.verdes !== rec.cajas.verdes
          ) {
            item.alerta = true;
          }
          if (
            dev.cajas_rotas.blancas !== rec.cajas_rotas.blancas ||
            dev.cajas_rotas.negras !== rec.cajas_rotas.negras ||
            dev.cajas_rotas.verdes !== rec.cajas_rotas.verdes ||
            dev.tapas_rotas.blancas !== rec.tapas_rotas.blancas ||
            dev.tapas_rotas.negras !== rec.tapas_rotas.negras ||
            dev.tapas_rotas.verdes !== rec.tapas_rotas.verdes
          ) {
            item.rotura = true;
          }
        } else {
          item.alerta = true;
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
