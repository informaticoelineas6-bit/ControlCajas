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
  AUDITLOG = "audit_log",
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
  cajas: Cajas;
  tapas: Tapas;
}

export type Created<Evento> = Evento & { created_at: string };

export interface Objetos {
  ajuste: string | null;
  habilitado: boolean;
}

export interface Usuario extends Objetos {
  nombre: string;
  rol: ROLES;
  contrasena?: string;
}

export interface Almacen extends Objetos {
  nombre: string;
  habilitadas: CajasHabilitadas;
  stock: Cajas;
  roturas: CajasRoturas;
}

export type DeudaAct<Centro> = Centro & {
  deuda_activa: Cajas;
  fecha_liquidacion: string | null;
};

export interface CentroDistribucion extends Objetos {
  nombre: string;
  habilitadas: CajasHabilitadas;
  deuda: Cajas;
  roturas: CajasRoturas;
  rotacion: number;
}

export interface Provincia extends Objetos {
  nombre: string;
  centro_distribucion: string;
}

export interface Vehiculo extends Objetos {
  categoria: string;
  chapa: string;
  marca: string;
  modelo: string;
}

export interface Evento {
  id: number;
  centro_distribucion: string;
  fecha: string;
  nombre: string;
  cajas: Cajas;
  ajuste: string;
}

export type Nuevo<Evento> = Omit<
  Evento,
  | "id"
  | "created_at"
  | "fecha"
  | "ajuste"
  | "habilitado"
  | "provincia"
  | "fecha_cierre"
>;

export interface EventoIda extends Evento {
  provincia: string | null;
}

export interface EventoVuelta extends Evento {
  roturas: CajasRoturas;
  fecha_cierre: string | null;
}

export interface Expedicion extends EventoIda {
  almacen: string;
}

export interface Traspaso extends EventoIda {
  almacen: string;
  chapa: string;
}

export interface Entrega extends EventoIda {
  chapa: string;
}

export interface Recogida extends EventoVuelta {
  chapa: string;
}

export interface Devolucion extends EventoVuelta {
  almacen: string;
}

export interface Cierre {
  fecha: string;
  cierre_cd: {
    centro_distribucion: string;
    ajuste_deuda: Cajas;
    roturas: CajasRoturas;
  }[];
  cierre_almacen: {
    almacen: string;
    ajuste_stock: Cajas;
    roturas: CajasRoturas;
  }[];
}

export interface AuditLog {
  id: number;
  created_at: string; // ISO timestamp
  action: "DELETE" | "UPDATE" | "INSERT";
  object_type: string;
  usuario: string;
  snapshot: object;
  changes?: { prev: object; new: object };
}

export interface ObjetoAjusteForm {
  tipo_objeto?: TIPOS_OBJETOS;
  ajuste: {
    habilitado: boolean;
  };
}

export interface EventoCreateForm {
  almacen?: string;
  centro_distribucion?: string;
  chapa?: string;
  cajas: Cajas;
  roturas?: CajasRoturas;
}

export interface EventoAjusteForm {
  tipo_evento?: TIPOS_EVENTO;
  ajuste: {
    cajas: Cajas;
    roturas?: CajasRoturas;
  };
}

export type EventoResponse = Record<
  string,
  {
    almacenes: string[];
    vehiculos: Vehiculo[];
    habilitadas: CajasHabilitadas;
    deuda_activa?: Cajas;
  }
>;

export interface AlertaResponse {
  total: number;
  usuarios_recientes: number;
  inconsistencias_expedicion_entrega: EventAlerta[];
  inconsistencias_devolucion_recogida: EventAlerta[];
  cierre_pendiente: boolean;
}

export interface EventAlerta {
  tipo: string;
  nombre: string;
  detalle: string;
}

export interface DashboardData {
  dashboardData: DashboardRow[];
  movementToday: number;
  enviosHoy: number;
  recogidasHoy: number;
  rotasHoy: number;
  deudaTotal: Cajas;
  stockTotal: Cajas;
  roturaTotal: number;
  roturaActual: number;
}

export interface DashboardRow {
  nombre: string;
  deuda: Cajas;
  deuda_activa: Cajas;
  rotacion: number;
  fechaRot: string | null;
  estadoRot:
    | "Pendiente"
    | "Retrasada"
    | "En tiempo"
    | "Cumplida"
    | "Desconocido";
  roturasTotal: number;
}

export interface AlmacenAudit {
  almacen: Almacen;
  cierres: {
    fecha: string;
    ajuste_stock: Cajas;
    roturas: CajasRoturas;
  }[];
}

export interface CentroAudit {
  centro: CentroDistribucion;
  cierres: {
    fecha: string;
    ajuste_deuda: Cajas;
    roturas: CajasRoturas;
  }[];
}

export interface UsuarioAudit {
  usuario: Created<Usuario>;
  eventos?: EventoAudit[];
  logs?: AuditLog[];
}

export interface EventoAudit {
  fecha: string;
  centro_distribucion: string;
  tipo_evento: TIPOS_EVENTO;
  cajas: Cajas;
  roturas?: {
    cajas: Cajas;
    tapas: Tapas;
  };
}
