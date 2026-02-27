# Guía de Despliegue

Instrucciones para desplegar ControlCajas a un servidor de producción.

## Opción 1: Desplegar en Vercel (Recomendado)

Vercel es la plataforma oficial de Vercel (creadores de Next.js) y ofrece integración perfecta con Next.js.

### Requisitos

- Cuenta en [Vercel](https://vercel.com)
- Proyecto en GitHub, GitLab o Bitbucket

### Pasos

1. **Sube tu proyecto a un repositorio Git**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu_usuario/control-cajas.git
git push -u origin main
```

2. **Conecta tu repositorio a Vercel**
   - Ve a https://vercel.com/new
   - Selecciona tu repositorio
   - Vercel detectará automáticamente que es un proyecto Next.js

3. **Configura las variables de entorno**
   - En Vercel, ve a **Settings** > **Environment Variables**
   - Agrega:
     - `MONGODB_URI`: Tu cadena de conexión de MongoDB
     - `JWT_SECRET`: Una cadena secreta segura y aleatoria

4. **Despliega**
   - Clica en **Deploy**
   - Vercel compilará y desplegará automáticamente

### Variables de Entorno en Vercel

```
MONGODB_URI=mongodb+srv://informaticoelineas6_db_user:Informatico*789@cajascluster.qjorpm7.mongodb.net/ControlCajas
JWT_SECRET=una-clave-super-secreta-y-aleatoria-minimo-32-caracteres
```

### Dominio Personalizado

1. En Vercel, ve a **Settings** > **Domains**
2. Agrega tu dominio personalizado
3. Sigue las instrucciones para configurar el DNS

## Opción 2: Desplegar en Heroku

### Requisitos

- Cuenta en [Heroku](https://www.heroku.com)
- Heroku CLI instalado
- Proyecto en Git

### Pasos

1. **Login en Heroku**

```bash
heroku login
```

2. **Crea una aplicación en Heroku**

```bash
heroku create nombre-de-mi-app
```

3. **Configura variables de entorno**

```bash
heroku config:set MONGODB_URI="mongodb+srv://..."
heroku config:set JWT_SECRET="clave-super-secreta"
```

4. **Despliega**

```bash
git push heroku main
```

## Opción 3: Desplegar en Railway.app

### Requisitos

- Cuenta en [Railway.app](https://railway.app)

### Pasos

1. **Conecta tu repositorio**
   - Ve a Dashboard
   - Clica en **New Project**
   - Selecciona **Deploy from GitHub**

2. **Configura variables de entorno**
   - En el proyecto, ve a **Variables**
   - Agrega `MONGODB_URI` y `JWT_SECRET`

3. **Railway despliega automáticamente**

## Opción 4: Despliegue Manual en Servidor Linux

### Requisitos

- Servidor con Node.js 18+
- npm o yarn
- PM2 o similar para gestión de procesos

### Pasos

1. **Clona el repositorio en el servidor**

```bash
git clone https://github.com/tu_usuario/control-cajas.git
cd control-cajas
```

2. **Instala dependencias**

```bash
npm install
```

3. **Compila la aplicación**

```bash
npm run build
```

4. **Configura variables de entorno**
   Crea `.env.production.local`:

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=clave-secreta-fuerte
```

5. **Inicia con PM2**

```bash
npm install -g pm2
pm2 start npm --name "control-cajas" -- start
pm2 save
pm2 startup
```

6. **Configura Nginx como proxy reverso**

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

7. **Configura SSL con Let's Encrypt**

```bash
certbot --nginx -d tu-dominio.com
```

## Checklist Pre-Despliegue

- [ ] Cambiar `JWT_SECRET` a una cadena aleatoria fuerte
- [ ] Verificar que MONGODB_URI es correcta
- [ ] IP del servidor autorizada en MongoDB Atlas
- [ ] Variables de entorno configuradas en la plataforma
- [ ] Base de datos poblada con datos iniciales
- [ ] Prueba de login y registro
- [ ] Prueba de creación de eventos
- [ ] Prueba de visualización de comparaciones
- [ ] Verificar logs de errores
- [ ] HTTPS habilitado en producción

## Monitoreo en Producción

### Vercel

- Dashboard automático con métricas
- Alertas automáticas de errores
- Logs en tiempo real

### Otros servidores

```bash
# Ver logs con PM2
pm2 logs control-cajas

# Monitorear procesos
pm2 monit
```

## Problemas Comunes

### "MongoError: authentication failed"

- Verifica credenciales MongoDB
- Verifica que tu IP está autorizada
- Verifica la variable `MONGODB_URI`

### "ENOENT: no such file or directory"

- Asegúrate de compilar con `npm run build`
- Verifica que todos los archivos se subieron

### "Port already in use"

- Cambia el puerto en `next.config.js`
- O mata el proceso anteriormente ejecutándose

### Rendimiento lento

- Verifica índices en MongoDB
- Aumenta recursos del servidor
- Implementa caché

## Escalabilidad

Para aplicaciones más grandes:

1. **Usar CDN** (Cloudflare)
2. **Implementar caché** (Redis)
3. **Optimizar imágenes** (next/image)
4. **Lazy loading de componentes**
5. **Considerar base de datos replicada** en MongoDB Atlas

## Backup en Producción

Configura backups automáticos:

```bash
# Con cron (en tu servidor)
0 2 * * * mongodump --uri="mongodb+srv://..." --out=/backup/$(date +%Y%m%d)
```

## Seguridad en Producción

1. HTTPS obligatorio
2. CORS configurado
3. Rate limiting en API
4. Sanitización de inputs
5. CSRF protection
6. Secrets seguros en variables de entorno
7. Logs auditables
8. Actualizaciones regulares

## Contacto y Soporte

Para problemas específicos de despliegue, consulta:

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [MongoDB Atlas Support](https://docs.atlas.mongodb.com/support/)
