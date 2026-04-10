// Constantes de la aplicación
export type ROLES = (typeof ROLES_ARRAY)[number];

export type TIPOS_EVENTO = (typeof EVENTOS_ARRAY)[number];
export type TIPOS_OBJETOS = (typeof OBJETOS_ARRAY)[number];

export type COLORES_CAJAS = (typeof CAJAS_ARRAY)[number];
export type COLORES_TAPAS = (typeof TAPAS_ARRAY)[number];

export const ROLES_ARRAY = [
  "chofer",
  "almacenero",
  "expedidor",
  "informatico",
  "auditor",
] as const;

export const EVENTOS_ARRAY = [
  "Expedicion",
  "Traspaso",
  "Entrega",
  "Devolucion",
  "Recogida",
] as const;

export const OBJETOS_ARRAY = [
  "CentroDistribucion",
  "Almacen",
  "Usuario",
  "Vehiculo",
  "Provincia",
] as const;

export const CAJAS_ARRAY = ["blancas", "negras", "verdes"] as const;
export const TAPAS_ARRAY = ["blancas", "negras"] as const;

export enum COLECCIONES {
  ALMACEN = "Almacen",
  CENTRO_DISTRIBUCION = "CentroDistribucion",
  USUARIO = "Usuario",
  VEHICULO = "Vehiculo",
  EXPEDICION = "Expedicion",
  ENTREGA = "Entrega",
  TRASPASO = "Traspaso",
  DEVOLUCION = "Devolucion",
  RECOGIDA = "Recogida",
  CIERRE = "Cierre",
  PROVINCIA = "Provincia",
  AUDITORIA = "AuditLog",
}

export enum TABLAS {
  ALMACEN = "almacen",
  CENTRO_DISTRIBUCION = "centro_distribucion",
  USUARIO = "usuario",
  VEHICULO = "vehiculo",
  EXPEDICION = "expedicion",
  ENTREGA = "entrega",
  TRASPASO = "traspaso",
  DEVOLUCION = "devolucion",
  RECOGIDA = "recogida",
  CIERRE = "cierre",
  PROVINCIA = "provincia",
}

export const getEventTable: Record<TIPOS_EVENTO, string> = {
  Devolucion: TABLAS.DEVOLUCION,
  Entrega: TABLAS.ENTREGA,
  Expedicion: TABLAS.EXPEDICION,
  Recogida: TABLAS.RECOGIDA,
  Traspaso: TABLAS.TRASPASO,
};

export const getObjectTable: Record<TIPOS_OBJETOS, string> = {
  Almacen: TABLAS.ALMACEN,
  CentroDistribucion: TABLAS.CENTRO_DISTRIBUCION,
  Provincia: TABLAS.PROVINCIA,
  Usuario: TABLAS.USUARIO,
  Vehiculo: TABLAS.VEHICULO,
};

export interface Cajas {
  blancas: number;
  negras: number;
  verdes: number;
}

export interface Tapas {
  blancas: number;
  negras: number;
}

export interface CajasHabilitadas {
  blancas: boolean;
  negras: boolean;
  verdes: boolean;
}

export interface CajasRoturas {
  roturas: {
    cajas: Cajas;
    tapas: Tapas;
  };
}

export type Created<Evento> = Evento & { created_at: string };

export interface Usuario {
  nombre: string;
  rol: ROLES;
  contrasena?: string;
  ajuste?: AjusteObjetos;
}

export interface Almacen extends CajasRoturas {
  nombre: string;
  habilitado: CajasHabilitadas;
  stock: Cajas;
  ajuste?: AjusteObjetos;
}

export interface CentroDistribucion extends CajasRoturas {
  nombre: string;
  habilitado: CajasHabilitadas;
  deuda: Cajas;
  rotacion: number;
  ajuste?: AjusteObjetos;
}

export interface Provincia {
  nombre: string;
  centro_distribucion: string;
  ajuste?: AjusteObjetos;
}

export interface Vehiculo {
  categoria: string;
  chapa: string;
  marca: string;
  modelo: string;
  ajuste?: AjusteObjetos;
}

export interface Ajuste {
  nombre: string;
  fechaHora: string;
}

export interface AjusteCajas extends Ajuste {
  cajas: Cajas;
}

export interface AjusteRoturas extends AjusteCajas, CajasRoturas {}

export interface AjusteObjetos extends Ajuste {
  habilitado: boolean;
}

export interface Evento {
  id: number;
  centro_distribucion: string;
  fecha: string;
  nombre: string;
  cajas: Cajas;
  ajuste?: AjusteCajas;
}

export type Nuevo<Evento> = Omit<Evento, "id">;

export interface EventoRotura extends Evento, CajasRoturas {
  ajuste?: AjusteRoturas;
}
export interface Expedicion extends Evento {
  almacen: string;
  provincia?: string;
}

export interface Traspaso extends Evento {
  almacen: string;
  chapa: string;
  provincia?: string;
}

export interface Entrega extends Evento {
  chapa: string;
  provincia?: string;
}

export interface Recogida extends EventoRotura {
  chapa: string;
}

export interface Devolucion extends EventoRotura {
  almacen: string;
}

export interface ItemComparacion {
  nombre?: string;
  cajas: Cajas;
  ajuste?: string;
}
export interface ItemComparacionEntrega {
  chapa?: string;
  centro_distribucion: string;
  almacen?: string;
  expedicion: ItemComparacion | null;
  traspaso: ItemComparacion | null;
  entrega: ItemComparacion | null;
  alerta: boolean;
}

export interface ItemComparacionRecogida {
  centro_distribucion: string;
  almacen?: string;
  chapa?: string;
  recogida: (ItemComparacion & CajasRoturas) | null;
  devolucion: (ItemComparacion & CajasRoturas) | null;
  alerta: boolean;
  rotura: boolean;
}

export interface Cierre {
  fecha: string;
  cierre_cd: ({
    centro_distribucion: string;
    ajuste_deuda: Cajas;
  } & CajasRoturas)[];
  cierre_almacen: ({
    almacen: string;
    ajuste_stock: Cajas;
  } & CajasRoturas)[];
}
