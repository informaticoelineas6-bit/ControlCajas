// Constantes de la aplicación
export type ROLES = (typeof ROLES_ARRAY)[number];

export type TIPOS_EVENTO = (typeof EVENTOS_ARRAY)[number];

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
}

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
  cajas_rotas: Cajas;
  tapas_rotas: Tapas;
}

export interface Usuario {
  _id?: string;
  nombre: string;
  rol: ROLES;
  fechaCreacion?: string;
  contrasena?: string;
  ajuste?: AjusteObjetos;
}

export interface Almacen {
  _id?: string;
  nombre: string;
  habilitado: CajasHabilitadas;
  stock: Cajas;
  roturas: {
    cajas: Cajas;
    tapas: Tapas;
  };
  ajuste?: AjusteObjetos;
}

export interface CentroDistribucion {
  _id?: string;
  nombre: string;
  habilitado: CajasHabilitadas;
  deuda: Cajas;
  rotacion: number;
  roturas: {
    cajas: Cajas;
    tapas: Tapas;
  };
  ajuste?: AjusteObjetos;
}

export interface Vehiculo {
  _id?: string;
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

export type Nuevo<Even> = Omit<Even, "_id">;

export interface Evento {
  _id?: string;
  centro_distribucion: string;
  fecha: string;
  nombre: string;
  cajas: Cajas;
  ajuste?: AjusteCajas;
}

export interface EventoRotura extends Evento, CajasRoturas {
  ajuste?: AjusteRoturas;
}
export interface Expedicion extends Evento {
  almacen: string;
}

export interface Traspaso extends Evento {
  almacen: string;
  chapa: string;
}

export interface Entrega extends Evento {
  chapa: string;
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
  cierre_cd: {
    centro_distribucion: string;
    ajuste_deuda: Cajas;
    cajas_rotas: Cajas;
    tapas_rotas: Tapas;
  }[];
  cierre_almacen: {
    almacen: string;
    ajuste_stock: Cajas;
    cajas_rotas: Cajas;
    tapas_rotas: Tapas;
  }[];
}
