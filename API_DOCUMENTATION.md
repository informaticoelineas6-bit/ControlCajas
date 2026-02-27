# Documentación de API Routes

## Autenticación

### POST /api/auth/login

Inicia sesión con un usuario existente.

**Request:**

```json
{
  "nombre": "string",
  "contrasena": "string"
}
```

**Response (200):**

```json
{
  "success": true,
  "usuario": {
    "id": "string",
    "nombre": "string",
    "rol": "chofer|almacenero|expedidor|informatico"
  }
}
```

### POST /api/auth/registro

Registra un nuevo usuario.

**Request:**

```json
{
  "nombre": "string",
  "contrasena": "string",
  "rol": "chofer|almacenero|expedidor|informatico"
}
```

**Response (200):**

```json
{
  "success": true,
  "usuario": {
    "id": "string",
    "nombre": "string",
    "rol": "string"
  }
}
```

### POST /api/auth/logout

Cierra la sesión actual (limpia las cookies).

**Response:**

```json
{
  "success": true
}
```

## Datos Mestros

### GET /api/centros

Obtiene la lista de centros de distribución.

**Response:**

```json
[
  {
    "_id": "ObjectId",
    "nombre": "Centro Lima",
    "deuda": 0
  }
]
```

### GET /api/vehiculos

Obtiene la lista de vehículos.

**Response:**

```json
[
  {
    "_id": "ObjectId",
    "chapa": "ABC-001",
    "marca": "Volvo",
    "modelo": "FH16",
    "tipo_chapa": "Placa Normal",
    "vehiculo": "Camión"
  }
]
```

## Eventos

### POST /api/eventos/create

Crea un nuevo evento (expedición, transporte, devolución o recogida).

**Request:**

```json
{
  "tipo_evento": "Expedicion|Transporte|Devolucion|Recogida",
  "centro_distribucion": "string",
  "fecha": "YYYY-MM-DD",
  "nombre": "string",
  "chapa": "string (opcional, requerido para Transporte y Recogida)",
  "cajas": {
    "blancas": number,
    "negras": number,
    "verdes": number
  },
  "cajas_rotas": {
    "blancas": number,
    "negras": number,
    "verdes": number
  },
  "tapas_rotas": {
    "blancas": number,
    "negras": number,
    "verdes": number
  }
}
```

**Response (200):**

```json
{
  "success": true,
  "id": "ObjectId"
}
```

## Comparaciones

### GET /api/comparar?fecha=YYYY-MM-DD&tipo=expedicion_transporte

Compara expediciones con transportes para una fecha dada.

**Response:**

```json
[
  {
    "centro_distribucion": "Centro Lima",
    "expedicion": {
      "blancas": 100,
      "negras": 50,
      "verdes": 25
    },
    "transporte": {
      "blancas": 100,
      "negras": 50,
      "verdes": 25
    },
    "alerta": false
  }
]
```

### GET /api/comparar?fecha=YYYY-MM-DD&tipo=devolucion_recogida

Compara devoluciones con recogidas para una fecha dada.

**Response:**

```json
[
  {
    "centro_distribucion": "Centro Lima",
    "devolucion": {
      "cajas": {
        "blancas": 10,
        "negras": 5,
        "verdes": 2
      },
      "cajas_rotas": {
        "blancas": 1,
        "negras": 0,
        "verdes": 0
      },
      "tapas_rotas": {
        "blancas": 0,
        "negras": 1,
        "verdes": 0
      }
    },
    "recogida": {
      "cajas": {
        "blancas": 10,
        "negras": 5,
        "verdes": 2
      },
      "cajas_rotas": {
        "blancas": 1,
        "negras": 0,
        "verdes": 0
      },
      "tapas_rotas": {
        "blancas": 0,
        "negras": 1,
        "verdes": 0
      }
    },
    "alerta": false
  }
]
```

## Códigos de Error

- **400**: Datos incompletos o inválidos
- **401**: Credenciales incorrectas (login)
- **500**: Error en el servidor
