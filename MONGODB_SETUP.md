# Guía de Configuración de MongoDB Atlas

Esta guía explica cómo preparar MongoDB Atlas para usar con ControlCajas.

## Pasos Previos

La aplicación está configurada para usar **MongoDB Atlas** (base de datos en la nube). La cadena de conexión ya está incluida en el archivo `.env.local`.

## Verificar la Conexión

Para verificar que todo está configurado correctamente:

1. **Instala las dependencias:**

```bash
npm install
```

2. **Inicia la aplicación:**

```bash
npm run dev
```

3. **Prueba el registro:**
   - Ve a `http://localhost:3000/registro`
   - Crea una cuenta de prueba
   - Si puedes registrarte exitosamente, la conexión está funcionando

## Poblar Datos Iniciales

Para crear centros de distribución y vehículos de ejemplo:

```bash
npm run seed
```

## Verificar en MongoDB Atlas

Para ver los datos en MongoDB Atlas:

1. Accede a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Inicia sesión con tu cuenta
3. Selecciona el cluster `CajasCluster`
4. Ve a **Databases** > **ControlCajas**
5. Deberías ver las colecciones creadas

## Solución de Problemas de Conexión

### "Error: connect ECONNREFUSED"

- **Causa**: La aplicación no puede conectar a MongoDB
- **Solución**:
  - Verifica que Internet esté disponible
  - Verifica que la cadena MONGODB_URI sea correcta
  - Verifica que tu IP esté autorizada en MongoDB Atlas (IP Access List)

### Autorización de IP en MongoDB Atlas

1. Ve al cluster en MongoDB Atlas
2. Clica en **Network Access**
3. Clica en **+ Add IP Address**
4. Selecciona **Your Current IP Address** o usa **0.0.0.0/0** para permitir desde cualquier IP
5. Clica **Confirm**

### "Authentication failed"

- **Causa**: Las credenciales son incorrectas
- **Solución**:
  - Verifica el usuario y contraseña en la cadena de conexión
  - Si olvidaste la contraseña, restablécela en MongoDB Atlas

### Errores TLS / SSL

- **Mensaje típico**: `MongoNetworkError: ... ssl3_read_bytes:tlsv1 alert internal error` u otros errores relacionados con TLS/SSL
- **Causa**: Problemas de cifrado entre la aplicación y el servidor MongoDB (certificate mismatch, versión TLS, etc.)
- **Solución**:
  - Asegúrate de usar la cadena SRV completa (`mongodb+srv://...`)
  - En desarrollo puedes habilitar certificados inválidos añadiendo la variable de entorno `MONGODB_TLS_ALLOW_INVALID=true` al archivo `.env.local`.
    Esto activará opciones `tlsAllowInvalidCertificates` y `tlsInsecure` en el cliente, y el driver forzará TLSv1.2.

  Ejemplo:

  ```env
  MONGODB_URI=mongodb+srv://informaticoelineas6_db_user:Informatico*789@cajascluster.qjorpm7.mongodb.net/ControlCajas?retryWrites=true&w=majority
  MONGODB_TLS_ALLOW_INVALID=true
  ```

  - Reinicia la aplicación después de cambiar la variable.

## Cambiar la Base de Datos

Si necesitas usar una base de datos diferente:

1. Modifica el archivo `.env.local`:

```
MONGODB_URI=tu_nueva_cadena_de_conexion
```

2. Asegúrate de que la base de datos se llame `ControlCajas` o actualiza en `lib/mongodb.ts`:

```typescript
const db = client.db("NombreQuePrefieras");
```

## Backup y Restauración

### Backup automático en MongoDB Atlas

MongoDB Atlas realiza backups automáticos cada 6 horas para planes pagos.

Para planes gratuitos, considera:

1. Exportar datos regularmente
2. Usar `mongodump` para crear backups manuales

### Exportar datos con mongodump

```bash
mongodump \
  --uri="mongodb+srv://usuario:contraseña@cluster.mongodb.net/ControlCajas" \
  --out="./backup"
```

### Restaurar datos con mongorestore

```bash
mongorestore \
  --uri="mongodb+srv://usuario:contraseña@cluster.mongodb.net" \
  "./backup"
```

## Monitoreo

Para monitorear el uso:

1. Ve a MongoDB Atlas
2. Selecciona tu cluster
3. Ve a **Monitoring** para ver métricas de uso y rendimiento

## Seguridad

### Buenas Prácticas

1. **Usa credenciales fuertes**: Cambia el JWT_SECRET en producción
2. **Autorización de IP**: Define qué IPs pueden conectar
3. **Backups regulares**: Asegúrate de tener copias de seguridad
4. **Actualizaciones**: Mantén Next.js y dependencias actualizadas

### Variables de Entorno

- Nunca commits `.env.local` a control de versiones
- Usa `.env.example` como referencia
- En producción, configura variables en tu plataforma de hosting (Vercel, Heroku, etc.)

## Monitoreo de Rendimiento

Para optimizar la base de datos:

1. Crea índices (ver DATABASE_SCHEMA.md)
2. Monitorea consultas lentas en MongoDB Atlas
3. Considera el plan apropiado según tu volumen de datos

## Soporte Adicional

- [Documentación MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [Documentación MongoDB Node.js](https://www.mongodb.com/docs/drivers/node/)
- [Troubleshooting MongoDB](https://www.mongodb.com/docs/atlas/troubleshoot-connection/)
