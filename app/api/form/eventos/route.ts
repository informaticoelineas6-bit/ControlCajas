import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/server";
import {
  Almacen,
  Cajas,
  CajasHabilitadas,
  CentroDistribucion,
  EVENTOS_ARRAY,
  Expedicion,
  Provincia,
  Recogida,
  TABLAS,
  TIPOS_EVENTO,
  Traspaso,
  Vehiculo,
} from "@/lib/constants";
import { DeudaAct } from "@/lib/utils";
import { usuarioCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo"); // Expedicion|Entrega|Devolucion|Recogida
    const fecha = new Date().toISOString().split("T")[0];

    if (!tipo || !EVENTOS_ARRAY.includes(tipo as TIPOS_EVENTO)) {
      return NextResponse.json(
        { error: "El tipo es requerido" },
        { status: 400 },
      );
    }

    const db = await connectToDatabase();

    const resultado: EventoBuilder = {};
    const respuesta: EventoResponse = {};
    switch (tipo) {
      case "Expedicion": {
        const [centrosRaw, almacenesRaw, provinciasRaw] = await Promise.all([
          db
            .from(TABLAS.CENTRO_DISTRIBUCION)
            .select<string, CentroDistribucion>("nombre, habilitado")
            .or("ajuste->habilitado.neq.false, ajuste->habilitado.is.null"),
          db
            .from(TABLAS.ALMACEN)
            .select<string, Almacen>("nombre")
            .or("ajuste->habilitado.neq.false, ajuste->habilitado.is.null"),
          db
            .from(TABLAS.PROVINCIA)
            .select<string, Provincia>("nombre, centro_distribucion")
            .or("ajuste->habilitado.neq.false, ajuste->habilitado.is.null"),
        ]);

        const error =
          centrosRaw.error || almacenesRaw.error || provinciasRaw.error;

        if (error) throw new Error(error.message);

        for (const centro of centrosRaw.data) {
          resultado[centro.nombre] = {
            almacenes: new Set(almacenesRaw.data.map((alm) => alm.nombre)),
            habilitado: centro.habilitado ?? {
              blancas: false,
              negras: false,
              verdes: false,
            },
            vehiculos: new Set([]),
          };
        }
        console.log(provinciasRaw.data);
        for (const prov of provinciasRaw.data) {
          resultado[prov.nombre] = {
            almacenes: new Set(almacenesRaw.data.map((alm) => alm.nombre)),
            habilitado: centrosRaw.data.find(
              (centro) => centro.nombre === prov.centro_distribucion,
            )?.habilitado ?? { blancas: false, negras: false, verdes: false },
            vehiculos: new Set([]),
          };
        }
        for (const key in resultado) {
          respuesta[key] = {
            almacenes: Array.from(resultado[key].almacenes),
            habilitado: resultado[key].habilitado,
            vehiculos: Array.from(resultado[key].vehiculos),
          };
        }
        if (Object.keys(resultado).length === 0) {
          return NextResponse.json(
            { error: "Error desconocido" },
            { status: 400 },
          );
        }
        return NextResponse.json(respuesta);
      }
      case "Traspaso": {
        const [eventosRaw, centrosRaw, vehiculosRaw] = await Promise.all([
          db
            .from(TABLAS.EXPEDICION)
            .select<
              string,
              Expedicion
            >("centro_distribucion, provincia, almacen")
            .eq("fecha", fecha),
          db
            .from(TABLAS.CENTRO_DISTRIBUCION)
            .select<string, CentroDistribucion>("nombre, habilitado")
            .or("ajuste->habilitado.neq.false, ajuste->habilitado.is.null"),
          db
            .from(TABLAS.VEHICULO)
            .select<string, Vehiculo>("categoria, chapa, marca, modelo")
            .or("ajuste->habilitado.neq.false, ajuste->habilitado.is.null"),
        ]);

        const error =
          eventosRaw.error || centrosRaw.error || vehiculosRaw.error;

        if (error) throw new Error(error.message);

        if (eventosRaw.data.length === 0) {
          return NextResponse.json(
            { error: "No se han registrado expediciones" },
            { status: 400 },
          );
        }

        for (const element of eventosRaw.data) {
          const index = element.provincia ?? element.centro_distribucion;
          if (index in resultado) {
            resultado[index].almacenes.add(element.almacen);
          } else {
            resultado[index] = {
              almacenes: new Set([element.almacen]),
              habilitado: centrosRaw.data.find(
                (centro) => centro.nombre === element.centro_distribucion,
              )?.habilitado ?? { blancas: false, negras: false, verdes: false },
              vehiculos: new Set(vehiculosRaw.data),
            };
          }
        }
        for (const key in resultado) {
          respuesta[key] = {
            almacenes: Array.from(resultado[key].almacenes),
            habilitado: resultado[key].habilitado,
            vehiculos: Array.from(resultado[key].vehiculos),
          };
        }
        if (Object.keys(resultado).length === 0) {
          return NextResponse.json(
            { error: "No se han registrado expediciones" },
            { status: 400 },
          );
        }
        return NextResponse.json(respuesta);
      }
      case "Entrega": {
        const [eventosRaw, centrosRaw, vehiculosRaw] = await Promise.all([
          db
            .from(TABLAS.TRASPASO)
            .select<string, Traspaso>("centro_distribucion, provincia, chapa")
            .eq("fecha", fecha)
            .eq("nombre", usuario.nombre),
          db
            .from(TABLAS.CENTRO_DISTRIBUCION)
            .select<string, CentroDistribucion>("nombre, habilitado")
            .or("ajuste->habilitado.neq.false, ajuste->habilitado.is.null"),
          db
            .from(TABLAS.VEHICULO)
            .select<string, Vehiculo>("categoria, chapa, marca, modelo")
            .or("ajuste->habilitado.neq.false, ajuste->habilitado.is.null"),
        ]);

        const error =
          eventosRaw.error || centrosRaw.error || vehiculosRaw.error;

        if (error) throw new Error(error.message);

        if (eventosRaw.data.length === 0) {
          return NextResponse.json(
            { error: "No se han registrado traspasos" },
            { status: 400 },
          );
        }

        for (const element of eventosRaw.data) {
          const index = element.provincia ?? element.centro_distribucion;
          if (index in resultado) {
            resultado[index].vehiculos.add(
              vehiculosRaw.data.find((veh) => veh.chapa === element.chapa)!,
            );
          } else {
            resultado[index] = {
              almacenes: new Set([]),
              habilitado: centrosRaw.data.find(
                (centro) => centro.nombre === element.centro_distribucion,
              )?.habilitado ?? { blancas: false, negras: false, verdes: false },
              vehiculos: new Set([
                vehiculosRaw.data.find((veh) => veh.chapa === element.chapa)!,
              ]),
            };
          }
        }
        for (const key in resultado) {
          respuesta[key] = {
            almacenes: Array.from(resultado[key].almacenes),
            habilitado: resultado[key].habilitado,
            vehiculos: Array.from(resultado[key].vehiculos),
          };
        }
        if (Object.keys(resultado).length === 0) {
          return NextResponse.json(
            {
              error:
                "No se ha registrado ningún traspaso realizado por este usuario",
            },
            { status: 400 },
          );
        }
        return NextResponse.json(respuesta);
      }
      case "Recogida": {
        const [centrosRaw, vehiculosRaw] = await Promise.all([
          db.rpc<string, DeudaAct<CentroDistribucion>>(
            "all_centros_deuda_activa",
          ),
          db
            .from(TABLAS.VEHICULO)
            .select<string, Vehiculo>("categoria, chapa, marca, modelo")
            .or("ajuste->habilitado.neq.false, ajuste->habilitado.is.null"),
        ]);

        const error = centrosRaw.error || vehiculosRaw.error;

        if (error) throw new Error(error.message);

        for (const centro of centrosRaw.data) {
          resultado[centro.nombre] = {
            almacenes: new Set([]),
            habilitado: centro.habilitado,
            vehiculos: new Set(vehiculosRaw.data),
            deuda_activa: centro.deuda_activa,
          };
        }
        for (const key in resultado) {
          respuesta[key] = {
            almacenes: Array.from(resultado[key].almacenes),
            habilitado: resultado[key].habilitado,
            vehiculos: Array.from(resultado[key].vehiculos),
            deuda_activa: resultado[key].deuda_activa,
          };
        }
        return NextResponse.json(respuesta);
      }
      case "Devolucion": {
        const [eventosRaw, centrosRaw, almacenesRaw] = await Promise.all([
          db
            .from(TABLAS.RECOGIDA)
            .select<string, Recogida>("centro_distribucion")
            .eq("fecha", fecha),
          db.rpc<string, DeudaAct<CentroDistribucion>>(
            "all_centros_deuda_activa",
          ),
          db
            .from(TABLAS.ALMACEN)
            .select<string, Almacen>("nombre")
            .or("ajuste->habilitado.neq.false, ajuste->habilitado.is.null"),
        ]);

        const error =
          eventosRaw.error || centrosRaw.error || almacenesRaw.error;

        if (error) throw new Error(error.message);

        if (eventosRaw.data.length === 0) {
          return NextResponse.json(
            { error: "No se han registrado recogidas" },
            { status: 400 },
          );
        }
        for (const element of eventosRaw.data) {
          const centro: DeudaAct<CentroDistribucion> = centrosRaw.data.find(
            (cent: DeudaAct<CentroDistribucion>) =>
              cent.nombre === element.centro_distribucion,
          );
          resultado[element.centro_distribucion] = {
            almacenes: new Set(almacenesRaw.data.map((alm) => alm.nombre)),
            habilitado: centro.habilitado,
            vehiculos: new Set([]),
            deuda_activa: centro.deuda_activa,
          };
        }
        for (const key in resultado) {
          respuesta[key] = {
            almacenes: Array.from(resultado[key].almacenes),
            habilitado: resultado[key].habilitado,
            vehiculos: Array.from(resultado[key].vehiculos),
            deuda_activa: resultado[key].deuda_activa,
          };
        }
        return NextResponse.json(respuesta);
      }
      default:
        return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error listing events:", error);
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 },
    );
  }
}

export type EventoResponse = Record<
  string,
  {
    almacenes: string[];
    vehiculos: Vehiculo[];
    habilitado: CajasHabilitadas;
    deuda_activa?: Cajas;
  }
>;

export type EventoBuilder = Record<
  string,
  {
    almacenes: Set<string>;
    vehiculos: Set<Vehiculo>;
    habilitado: CajasHabilitadas;
    deuda_activa?: Cajas;
  }
>;
