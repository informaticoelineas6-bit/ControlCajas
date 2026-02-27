# Índice de Documentación - ControlCajas

Bienvenido a ControlCajas. Aquí encontrarás la guía completa para entender, configurar y usar la aplicación.

## 🚀 Para Comenzar Rápido

**Si quieres empezar YA:**

1. Lee [QUICK_START.md](QUICK_START.md) - Guía de uso en 5 minutos
2. Ejecuta: `npm install && npm run dev`
3. Ve a http://localhost:3000 y ¡comienza!

## 📚 Documentación Completa

### Para Usuarios

- **[QUICK_START.md](QUICK_START.md)** - Guía de uso rápido y flujos diarios
- **[README.md](README.md)** - Información general, instalación y ejecución

### Para Desarrolladores

- **[README.md](README.md)** - Setup del proyecto, estructura y tecnologías
- **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** - Estructura detallada de MongoDB
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Documentación completa de endpoints
- **[FEATURES.md](FEATURES.md)** - Lista de características implementadas

### Para DevOps / Administradores

- **[MONGODB_SETUP.md](MONGODB_SETUP.md)** - Configuración de MongoDB Atlas
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Despliegue en Vercel, Heroku, etc.

## 🔧 Guía Rápida por Tarea

### "¿Cómo install la aplicación?"

→ Ve a [README.md](README.md) sección "Instalación"

### "¿Cómo uso la aplicación?"

→ Ve a [QUICK_START.md](QUICK_START.md)

### "¿Cuál es la estructura de la base de datos?"

→ Ve a [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)

### "¿Cómo llamo a las APIs?"

→ Ve a [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

### "¿Cómo despliego a producción?"

→ Ve a [DEPLOYMENT.md](DEPLOYMENT.md)

### "¿Cómo configuro MongoDB?"

→ Ve a [MONGODB_SETUP.md](MONGODB_SETUP.md)

### "¿Qué características tiene?"

→ Ve a [FEATURES.md](FEATURES.md)

## 📁 Estructura del Archivo

```
ControlCajas/
├── app/                              # Aplicación Next.js
│   ├── api/                         # Rutas API REST
│   │   ├── auth/                    # Autenticación
│   │   ├── centros/                 # Maestros
│   │   ├── vehiculos/               # Maestros
│   │   ├── eventos/                 # Crear eventos
│   │   └── comparar/                # Comparar eventos
│   ├── dashboard/page.tsx           # Página principal
│   ├── registro/page.tsx            # Registro de usuarios
│   ├── page.tsx                     # Login
│   ├── layout.tsx                   # Layout principal
│   └── globals.css                  # Estilos globales
├── components/                      # Componentes React
│   ├── FormularioEvento.tsx
│   ├── TablaExpedicionTransporte.tsx
│   ├── TablaDevolucionRecogida.tsx
│   └── Header.tsx
├── lib/                             # Utilidades
│   ├── mongodb.ts                   # Conexión DB
│   ├── auth.ts                      # Autenticación
│   └── constants.ts                 # Constantes
├── scripts/
│   └── seed.js                      # Script para poblar BD
├── package.json                     # Dependencias
├── tsconfig.json                    # Configuración TypeScript
├── next.config.js                   # Configuración Next.js
├── tailwind.config.ts               # Configuración Tailwind
├── postcss.config.js                # Configuración PostCSS
├── .env.local                       # Variables de entorno
├── .env.example                     # Plantilla de variables
└── README.md                        # Este archivo
```

## 🎯 Flujo por Rol

### Usuario: Chofer

1. Inicia sesión
2. Ve al Dashboard
3. Clica "Nuevo Evento"
4. Crea eventos de **Transporte** o **Recogida**
5. Ve la tabla de comparación en "Ver Eventos"

**Documentación relevante:** [QUICK_START.md](QUICK_START.md)

### Usuario: Almacén

1. Inicia sesión
2. Ve al Dashboard
3. Clica "Nuevo Evento"
4. Crea eventos de **Expedición** o **Devolución**
5. Ve la tabla de comparación en "Ver Eventos"

**Documentación relevante:** [QUICK_START.md](QUICK_START.md)

### Usuario: Informático

1. Inicia sesión
2. Accede al Dashboard
3. Solo puede ver "Ver Eventos" (lecturaonada)
4. Revisa tablas de comparación y alertas

**Documentación relevante:** [FEATURES.md](FEATURES.md)

### Administrador de Sistemas

1. Configura MongoDB: [MONGODB_SETUP.md](MONGODB_SETUP.md)
2. Instala la aplicación: [README.md](README.md)
3. Despliega a producción: [DEPLOYMENT.md](DEPLOYMENT.md)
4. Monitorea rendimiento

### Desarrollador

1. Entiende la estructura: [README.md](README.md)
2. Aprende la BD: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
3. Explora las APIs: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
4. Propone nuevas features

## 🚀 Pasos de Setup Completo

### 1️⃣ Instalación

```bash
# Clonar/descargar proyecto
cd ControlCajas

# Instalar dependencias
npm install

# Poblar datos iniciales (opcional pero recomendado)
npm run seed
```

### 2️⃣ Ejecución Local

```bash
npm run dev
```

Abre http://localhost:3000

### 3️⃣ Crear tu Primera Cuenta

- Clica "Regístrate"
- Elige tu rol
- ¡Comienza a usar!

### 4️⃣ Para Producción

Sigue [DEPLOYMENT.md](DEPLOYMENT.md)

## ❓ Problemas Comunes

| Problema                  | Solución                                  |
| ------------------------- | ----------------------------------------- |
| "Error conectando a BD"   | Ver [MONGODB_SETUP.md](MONGODB_SETUP.md)  |
| "Port 3000 en uso"        | Cambia puerto en `npm run dev -- -p 3001` |
| "Imports no funcionan"    | Ejecuta `npm install` nuevamente          |
| "Formulario sin opciones" | Ejecuta `npm run seed`                    |

## 📞 Contacto y Soporte

- **Problemas técnicos**: Revisa la documentación relevante
- **Reporte de bugs**: Abre un issue si es un repositorio Git
- **Features nuevas**: Contacta al equipo de desarrollo

## 📝 Notas Importantes

✅ **Implementado:**

- Autenticación segura
- Validación de datos
- Base de datos configurada
- Interfaz completa
- Documentación explícita

⚠️ **Considerar después:**

- Backup automático de BD
- Rate limiting de API
- Alertas por correo
- Dashboard de estadísticas
- Múltiples idiomas

## 🔐 Seguridad

- Contraseñas hasheadas con bcryptjs
- Sesiones seguras en cookies
- Variables de entorno para secretos
- HTTPS recomendado en producción

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para más detalles de seguridad.

## 📊 Versiones

- **v1.0** - Release inicial con todas las funcionalidades base
  - Autenticación completa
  - CRUD de eventos
  - Comparación y alertas
  - Interfaz responsive

## 📄 Licencia

Proyecto privado. Uso autorizado solo para el equipo.

---

## 🎯 Resumen Rápido

| Necesitas           | Documento                                                                              |
| ------------------- | -------------------------------------------------------------------------------------- |
| Ejecutar la app     | [README.md](README.md)                                                                 |
| Usarla como usuario | [QUICK_START.md](QUICK_START.md)                                                       |
| Info técnica        | [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md), [API_DOCUMENTATION.md](API_DOCUMENTATION.md) |
| Desplegar           | [DEPLOYMENT.md](DEPLOYMENT.md)                                                         |
| Configurar MongoDB  | [MONGODB_SETUP.md](MONGODB_SETUP.md)                                                   |
| Ver features        | [FEATURES.md](FEATURES.md)                                                             |

---

**¿Listo? Comienza con [QUICK_START.md](QUICK_START.md) 🚀**
