// Constantes de la aplicación
export const ROLES = {
  CHOFER: "chofer",
  ALMACENERO: "almacenero",
  EXPEDIDOR: "expedidor",
  INFORMATICO: "informatico",
} as const;

export const TIPOS_EVENTO = {
  EXPEDICION: "Expedicion",
  TRANSPORTE: "Transporte",
  DEVOLUCION: "Devolucion",
  RECOGIDA: "Recogida",
} as const;

export const ROLES_ARRAY = Object.values(ROLES);

export const COLECCIONES = {
  CENTRO_DISTRIBUCION: "CentroDistribucion",
  USUARIO: "Usuario",
  VEHICULO: "Vehiculo",
  EXPEDICION: "Expedicion",
  TRANSPORTE: "Transporte",
  DEVOLUCION: "Devolucion",
  RECOGIDA: "Recogida",
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
