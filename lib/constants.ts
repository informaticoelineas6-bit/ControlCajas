// Constantes de la aplicación
export const ROLES = {
  CHOFER: "chofer",
  ALMACENERO: "almacenero",
  EXPEDIDOR: "expedidor",
  INFORMATICO: "informatico",
} as const;

export const TIPOS_EVENTO = {
  EXPEDICION: "Expedicion",
  ENTREGA: "Entrega",
  DEVOLUCION: "Devolucion",
  RECOGIDA: "Recogida",
} as const;

export const ROLES_ARRAY = Object.values(ROLES);

export const COLECCIONES = {
  ALMACEN: "Almacen",
  CENTRO_DISTRIBUCION: "CentroDistribucion",
  USUARIO: "Usuario",
  VEHICULO: "Vehiculo",
  EXPEDICION: "Expedicion",
  ENTREGA: "Entrega",
  TRASPASO: "Traspaso",
  DEVOLUCION: "Devolucion",
  RECOGIDA: "Recogida",
  CIERRE: "Cierre",
} as const;

export const COLORES_CAJAS = {
  BLANCAS: "blancas",
  NEGRAS: "negras",
  VERDES: "verdes",
} as const;

export const ERRORES = {
  NO_AUTENTICADO: "No autenticado",
  SIN_PERMISO: "Sin permiso",
  DATOS_INCOMPLETOS: "Datos incompletos",
  ERROR_BD: "Error al acceder a la base de datos",
};

export interface Usuario {
  _id?: string;
  nombre: string;
  rol: (typeof ROLES)[keyof typeof ROLES];
  creacion?: string;
  habilitado?: boolean;
  ajuste?: string;
}

export interface Almacen {
  _id?: string;
  nombre: string;
  habilitado: CajasHabilitadas;
  stock: Cajas;
  roturas: {
    cajas: Cajas;
    tapas: Cajas;
  };
  ajuste?: string;
}

export interface CentroDistribucion {
  _id?: string;
  nombre: string;
  habilitado: CajasHabilitadas;
  deuda: Cajas;
  rotacion: number;
  roturas: {
    cajas: Cajas;
    tapas: Cajas;
  };
  ajuste?: string;
}

export interface CajasHabilitadas {
  blancas: boolean;
  negras: boolean;
  verdes: boolean;
}

export interface Vehiculo {
  _id?: string;
  categoria: string;
  chapa: string;
  marca?: string;
  modelo?: string;
  ajuste?: string;
}

export interface Cajas {
  blancas: number;
  negras: number;
  verdes: number;
}

export interface Ajuste {
  cajas: Cajas;
  cajas_rotas: Cajas;
  tapas_rotas: Cajas;
  nombre?: string;
}

export interface Evento {
  _id?: string;
  centro_distribucion: string;
  fecha: string;
  nombre: string;
  cajas: Cajas;
  ajuste?: string;
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

export interface Recogida extends Evento {
  chapa: string;
  cajas_rotas: Cajas;
  tapas_rotas: Cajas;
}

export interface Devolucion extends Evento {
  almacen: string;
  cajas_rotas: Cajas;
  tapas_rotas: Cajas;
}

export interface Cierre {
  fecha: string;
  cierre_cd: {
    centro_distribucion: string;
    ajuste_deuda: Cajas;
    cajas_rotas: Cajas;
    tapas_rotas: Cajas;
  }[];
  cierre_almacen: {
    almacen: string;
    ajuste_stock: Cajas;
    cajas_rotas: Cajas;
    tapas_rotas: Cajas;
  }[];
}
