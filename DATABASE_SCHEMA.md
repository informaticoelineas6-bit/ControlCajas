# Estructura de la Base de Datos MongoDB

## Base de Datos: `ControlCajas`

Todas las colecciones deben crearse en la base de datos `ControlCajas`.

## Colecciones

### 1. CentroDistribucion

Almacena los centros de distribución disponibles.

**Campos:**

```javascript
{
  _id: ObjectId,
  nombre: String,        // Nombre único del centro
  deuda: Number          // Deuda asociada al centro
}
```

**Ejemplo:**

```javascript
{
  "_id": ObjectId("..."),
  "nombre": "Centro Lima",
  "deuda": 0
}
```

### 2. Usuario

Almacena los usuarios registrados con contraseñas hasheadas.

**Campos:**

```javascript
{
  _id: ObjectId,
  nombre: String,                    // Usuario único
  contrasena: String,                // Hash bcrypt de la contraseña
  rol: "chofer" | "almacen" | "informatico"  // Rol del usuario
}
```

**Ejemplo:**

```javascript
{
  "_id": ObjectId("..."),
  "nombre": "juan_chofer",
  "contrasena": "$2a$10$...",  // Hash bcrypt
  "rol": "chofer"
}
```

### 3. Vehiculo

Almacena los vehículos disponibles para transporte.

**Campos:**

```javascript
{
  _id: ObjectId,
  chapa: String,              // Placa del vehículo (código único)
  marca: String,              // Marca del vehículo
  modelo: String,             // Modelo del vehículo
  tipo_chapa: String,         // Tipo de placa
  vehiculo: String            // Tipo de vehículo (Camión, Furgón, etc.)
}
```

**Ejemplo:**

```javascript
{
  "_id": ObjectId("..."),
  "chapa": "ABC-001",
  "marca": "Volvo",
  "modelo": "FH16",
  "tipo_chapa": "Placa Normal",
  "vehiculo": "Camión"
}
```

### 4. Expedicion

Eventos de expedición (salida de cajas del almacén).

**Campos:**

```javascript
{
  _id: ObjectId,
  centro_distribucion: String,  // Nombre del centro
  fecha: String,               // Fecha en formato YYYY-MM-DD
  nombre: String,              // Usuario que crea el evento
  cajas: {
    blancas: Number,
    negras: Number,
    verdes: Number
  }
}
```

**Ejemplo:**

```javascript
{
  "_id": ObjectId("..."),
  "centro_distribucion": "Centro Lima",
  "fecha": "2026-02-26",
  "nombre": "juan_almacen",
  "cajas": {
    "blancas": 100,
    "negras": 50,
    "verdes": 25
  }
}
```

### 5. Transporte

Eventos de transporte de cajas.

**Campos:**

```javascript
{
  _id: ObjectId,
  centro_distribucion: String,  // Nombre del centro
  fecha: String,               // Fecha en formato YYYY-MM-DD
  chapa: String,               // Placa del vehículo
  nombre: String,              // Usuario que crea el evento
  cajas: {
    blancas: Number,
    negras: Number,
    verdes: Number
  }
}
```

**Ejemplo:**

```javascript
{
  "_id": ObjectId("..."),
  "centro_distribucion": "Centro Lima",
  "fecha": "2026-02-26",
  "chapa": "ABC-001",
  "nombre": "juan_chofer",
  "cajas": {
    "blancas": 100,
    "negras": 50,
    "verdes": 25
  }
}
```

### 6. Devolucion

Eventos de devolución de cajas.

**Campos:**

```javascript
{
  _id: ObjectId,
  centro_distribucion: String,
  fecha: String,               // Fecha en formato YYYY-MM-DD
  nombre: String,
  cajas: {
    blancas: Number,
    negras: Number,
    verdes: Number
  },
  cajas_rotas: {
    blancas: Number,
    negras: Number,
    verdes: Number
  },
  tapas_rotas: {
    blancas: Number,
    negras: Number,
    verdes: Number
  }
}
```

**Ejemplo:**

```javascript
{
  "_id": ObjectId("..."),
  "centro_distribucion": "Centro Lima",
  "fecha": "2026-02-26",
  "nombre": "maria_almacen",
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
}
```

### 7. Recogida

Eventos de recogida de cajas.

**Campos:**

```javascript
{
  _id: ObjectId,
  centro_distribucion: String,
  fecha: String,               // Fecha en formato YYYY-MM-DD
  chapa: String,               // Placa del vehículo
  nombre: String,
  cajas: {
    blancas: Number,
    negras: Number,
    verdes: Number
  },
  cajas_rotas: {
    blancas: Number,
    negras: Number,
    verdes: Number
  },
  tapas_rotas: {
    blancas: Number,
    negras: Number,
    verdes: Number
  }
}
```

## Índices Recomendados

Para mejorar el rendimiento, se recomienda crear los siguientes índices:

```javascript
// CentroDistribucion
db.CentroDistribucion.createIndex({ nombre: 1 });

// Usuario
db.Usuario.createIndex({ nombre: 1 }, { unique: true });

// Vehiculo
db.Vehiculo.createIndex({ chapa: 1 }, { unique: true });

// Expedicion
db.Expedicion.createIndex({ centro_distribucion: 1, fecha: 1 });
db.Expedicion.createIndex({ fecha: 1 });

// Transporte
db.Transporte.createIndex({ centro_distribucion: 1, fecha: 1 });
db.Transporte.createIndex({ fecha: 1, chapa: 1 });

// Devolucion
db.Devolucion.createIndex({ centro_distribucion: 1, fecha: 1 });
db.Devolucion.createIndex({ fecha: 1 });

// Recogida
db.Recogida.createIndex({ centro_distribucion: 1, fecha: 1 });
db.Recogida.createIndex({ fecha: 1, chapa: 1 });
```

## Script de Inicialización

Puedes usar el script `scripts/seed.js` para poblar la base de datos con datos de ejemplo:

```bash
npm run seed
```

Este script creará automáticamente:

- 4 Centros de Distribución
- 4 Vehículos de ejemplo

Los usuarios se deben crear a través de la interfaz web de la aplicación.
