import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import {
  Almacen,
  Cajas,
  CajasHabilitadas,
  CentroDistribucion,
  COLECCIONES,
  Entrega,
  EVENTOS_ARRAY,
  Expedicion,
  Provincia,
  Recogida,
  TIPOS_EVENTO,
  Traspaso,
  Vehiculo,
} from "@/lib/constants";
import {
  AjusteStr,
  applyAjuste,
  deudaActiva,
  hasCajas,
  isEnabled,
  usuarioCookie,
} from "@/lib/utils";

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

    const { db } = await connectToDatabase();

    const resultado: EventoBuilder = {};
    const respuesta: EventoResponse = {};
    switch (tipo) {
      case "Expedicion": {
        const [centrosRaw, almacenesRaw, provinciasRaw] = await Promise.all([
          db
            .collection<CentroDistribucion>(COLECCIONES.CENTRO_DISTRIBUCION)
            .find()
            .toArray() as Promise<CentroDistribucion[]>,
          db
            .collection<Almacen>(COLECCIONES.ALMACEN)
            .find()
            .toArray() as Promise<Almacen[]>,
          db
            .collection<Provincia>(COLECCIONES.PROVINCIA)
            .find()
            .toArray() as Promise<Provincia[]>,
        ]);
        for (const centro of centrosRaw) {
          resultado[centro.nombre] = {
            almacenes: new Set(
              almacenesRaw.filter(isEnabled).map((alm) => alm.nombre),
            ),
            habilitado: centro.habilitado ?? {
              blancas: false,
              negras: false,
              verdes: false,
            },
            vehiculos: new Set([]),
          };
        }
        for (const prov of provinciasRaw) {
          resultado[prov.nombre] = {
            almacenes: new Set(
              almacenesRaw.filter(isEnabled).map((alm) => alm.nombre),
            ),
            habilitado: centrosRaw.find(
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
            .collection<Expedicion>(COLECCIONES.EXPEDICION)
            .find({ fecha })
            .toArray() as Promise<Expedicion[]>,
          db
            .collection<CentroDistribucion>(COLECCIONES.CENTRO_DISTRIBUCION)
            .find()
            .toArray() as Promise<CentroDistribucion[]>,
          db
            .collection<Vehiculo>(COLECCIONES.VEHICULO)
            .find()
            .toArray() as Promise<Vehiculo[]>,
        ]);
        if (eventosRaw.length === 0) {
          return NextResponse.json(
            { error: "No se han registrado expediciones" },
            { status: 400 },
          );
        }
        for (const element of eventosRaw) {
          const index = element.provincia ?? element.centro_distribucion;
          if (index in resultado) {
            resultado[index].almacenes.add(element.almacen);
          } else {
            resultado[index] = {
              almacenes: new Set([element.almacen]),
              habilitado: centrosRaw.find(
                (centro) => centro.nombre === element.centro_distribucion,
              )?.habilitado ?? { blancas: false, negras: false, verdes: false },
              vehiculos: new Set(
                vehiculosRaw.filter(isEnabled).map((veh): Vehiculo => {
                  return {
                    categoria: veh.categoria,
                    chapa: veh.chapa,
                    marca: veh.marca,
                    modelo: veh.modelo,
                  };
                }),
              ),
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
            .collection<Traspaso>(COLECCIONES.TRASPASO)
            .find({ fecha })
            .toArray() as Promise<Traspaso[]>,
          db
            .collection<CentroDistribucion>(COLECCIONES.CENTRO_DISTRIBUCION)
            .find()
            .toArray() as Promise<CentroDistribucion[]>,
          db
            .collection<Vehiculo>(COLECCIONES.VEHICULO)
            .find({})
            .toArray() as Promise<Vehiculo[]>,
        ]);
        if (eventosRaw.length === 0) {
          return NextResponse.json(
            { error: "No se han registrado traspasos" },
            { status: 400 },
          );
        }
        for (const element of eventosRaw.filter(
          (evento) => evento.nombre === usuario.nombre,
        )) {
          const index = element.provincia ?? element.centro_distribucion;
          const vehiculo = vehiculosRaw.find(
            (veh) => veh.chapa === element.chapa,
          ) as Vehiculo;
          if (index in resultado) {
            resultado[index].vehiculos.add({
              categoria: vehiculo.categoria,
              chapa: vehiculo.chapa,
              marca: vehiculo.marca,
              modelo: vehiculo.modelo,
            });
          } else {
            resultado[index] = {
              almacenes: new Set([]),
              habilitado: centrosRaw.find(
                (centro) => centro.nombre === element.centro_distribucion,
              )?.habilitado ?? { blancas: false, negras: false, verdes: false },
              vehiculos: new Set([vehiculo]),
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
        const [centrosRaw, vehiculosRaw, listaEntregas] = await Promise.all([
          db
            .collection<CentroDistribucion>(COLECCIONES.CENTRO_DISTRIBUCION)
            .find()
            .toArray() as Promise<CentroDistribucion[]>,
          db
            .collection<Vehiculo>(COLECCIONES.VEHICULO)
            .find()
            .toArray() as Promise<Vehiculo[]>,
          db
            .collection<Entrega>(COLECCIONES.ENTREGA)
            .find()
            .toArray() as Promise<Entrega[]>,
        ]);
        for (const centro of centrosRaw) {
          resultado[centro.nombre] = {
            almacenes: new Set([]),
            habilitado: centro.habilitado,
            vehiculos: new Set(
              vehiculosRaw.filter(isEnabled).map((veh) => {
                return {
                  categoria: veh.categoria,
                  chapa: veh.chapa,
                  marca: veh.marca,
                  modelo: veh.modelo,
                };
              }),
            ),
            deuda_activa: deudaActiva(
              centro,
              listaEntregas
                .map(applyAjuste)
                .filter(hasCajas) as AjusteStr<Entrega>[],
            ).deuda_activa,
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
        const [eventosRaw, centrosRaw, almacenesRaw, listaEntregas] =
          await Promise.all([
            db
              .collection<Recogida>(COLECCIONES.RECOGIDA)
              .find({ fecha })
              .toArray() as Promise<Recogida[]>,
            db
              .collection<CentroDistribucion>(COLECCIONES.CENTRO_DISTRIBUCION)
              .find()
              .toArray() as Promise<CentroDistribucion[]>,
            db
              .collection<Almacen>(COLECCIONES.ALMACEN)
              .find()
              .toArray() as Promise<Almacen[]>,
            db
              .collection<Entrega>(COLECCIONES.ENTREGA)
              .find()
              .toArray() as Promise<Entrega[]>,
          ]);
        if (eventosRaw.length === 0) {
          return NextResponse.json(
            { error: "No se han registrado recogidas" },
            { status: 400 },
          );
        }
        for (const element of eventosRaw) {
          const centro = centrosRaw.find((cent) => {
            {
              return cent.nombre === element.centro_distribucion;
            }
          });
          resultado[element.centro_distribucion] = {
            almacenes: new Set(
              almacenesRaw.filter(isEnabled).map((alm) => alm.nombre),
            ),
            habilitado: centrosRaw.find(
              (centro) => centro.nombre === element.centro_distribucion,
            )?.habilitado ?? { blancas: false, negras: false, verdes: false },
            vehiculos: new Set([]),
            deuda_activa: centro
              ? deudaActiva(
                  centro,
                  listaEntregas
                    .map(applyAjuste)
                    .filter(hasCajas) as AjusteStr<Entrega>[],
                ).deuda_activa
              : undefined,
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
