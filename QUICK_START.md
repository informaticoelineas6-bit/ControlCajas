# Guía Rápida de Uso

Instrucciones paso a paso para usar ControlCajas.

## Inicio Rápido (5 minutos)

### 1. Acceder a la Aplicación

- Abre tu navegador
- Ve a `http://localhost:3000` (desarrollo) o tu URL de producción

### 2. Crear tu Primera Cuenta

1. Clica en **"Regístrate aquí"**
2. Ingresa:
   - **Usuario**: Un nombre único (ejemplo: `juan_chofer`)
   - **Contraseña**: Mínimo 6 caracteres
   - **Rol**: Selecciona tu rol según tu función:
     - **Chofer**: Maneja entregas y recogidas
     - **Expedidor**: Maneja expediciones
     - **Almacenero**: Maneja devoluciones
     - **Informático**: Visualiza datos (sin crear)
3. Clica **"Registrarse"**

### 3. Iniciar Sesión

1. Ingresa el **Usuario** y **Contraseña**
2. Clica **"Iniciar Sesión"**
3. Serás redirigido al Dashboard

## Dashboard

El dashboard tiene dos pestañas principales:

### Pestaña 1: Nuevo Evento

**Para Choferes:**

1. Clica en **"Nuevo Evento"**
2. Selecciona:
   - **Transporte**: Cuando sales con cajas desde un centro
   - **Recogida**: Cuando recoges cajas devueltas
3. Completa el formulario:
   - **Centro de distribución**: Selecciona de la lista
   - **Fecha**: Se completa automáticamente (hoy)
   - **Chapa**: Selecciona el vehículo
   - **Cajas**: Ingresa cantidad de cada color (blancas, negras, verdes)
   - Para **Recogida**: También ingresa cajas rotas y tapas rotas
4. Clica **"Guardar Evento"**

**Para Almacenero:**

1. Clica en **"Nuevo Evento"**
2. Selecciona:
   - **Expedición**: Cuando envías cajas al transporte
   - **Devolución**: Cuando recibes cajas devueltas
3. Completa el formulario:
   - **Centro de distribución**: Selecciona de la lista
   - **Fecha**: Se completa automáticamente (hoy)
   - **Cajas**: Ingresa cantidad de cada color
   - Para **Devolución**: También ingresa cajas rotas y tapas rotas
4. Clica **"Guardar Evento"**

### Pestaña 2: Ver Eventos

Muestra comparaciones entre eventos del mismo día.

**Tabla 1: Expediciones vs Transportes**

- Compara cajas expedidas vs cajas transportadas
- Las filas en **rojo** indican:
  - Hay expedición pero no transporte (o viceversa)
  - Las cantidades no coinciden

**Tabla 2: Devoluciones vs Recogidas**

- Compara devoluciones recibidas vs recogidas realizadas
- Las filas en **rojo** indican discrepancias
- Se comparan:
  - Cajas (blancas, negras, verdes)
  - Cajas rotas
  - Tapas rotas

**Para cambiar la fecha:**

1. Clica en el campo de fecha
2. Selecciona una fecha anterior o posterior
3. Las tablas se actualizan automáticamente

## Flujo de Operación Diaria

### Mañana: Almacén

1. El expedidor crea **Expediciones** con las cajas que se envían
2. Ingresa el centro de distribución, cantidades por color

### Mediodía: Chofer

1. El chofer crea un **Transporte** con el mismo centro
2. Ingresa la chapa del vehículo y cantidades de cajas
3. El sistema compara automáticamente con la expedición

### División diaria:

Si hay discrepancias:

- Centro Lima en rojo = Expedición y Transporte no coinciden
- Requiere investigación

### Tarde: Devoluciones

1. Almacenero recibe cajas devueltas → Crea **Devolución**
2. Chofer reporta cajas que fue a buscar → Crea **Recogida**
3. Sistema compara y marca si hay diferencias

## Ejemplos Prácticos

### Ejemplo 1: Crear Expedición

**Usuario**: Juan (Almacén)
**Fechа**: 26/02/2026

1. Clica "Nuevo Evento"
2. Selecciona "Expedición"
3. Centro: "Centro Lima"
4. Cajas:
   - Blancas: 100
   - Negras: 50
   - Verdes: 25
5. Clica "Guardar Evento" ✓

### Ejemplo 2: Crear Transporte (mismo día)

**Usuario**: Carlos (Chofer)
**Fecha**: 26/02/2026

1. Clica "Nuevo Evento"
2. Selecciona "Transporte"
3. Centro: "Centro Lima"
4. Chapa: "ABC-001"
5. Cajas:
   - Blancas: 100
   - Negras: 50
   - Verdes: 25
6. Clica "Guardar Evento" ✓

### Verificar en "Ver Eventos"

1. Clica "Ver Eventos"
2. Ve la primera tabla "Expediciones vs Transportes"
3. Centro Lima debe mostrar ambos eventos sin alerta (sin fondo rojo)

## Pantalla de Alertas

### Entender las Alertas

**¿Por qué una fila está en rojo?**

| Situación                         | Causa                               | Acción                       |
| --------------------------------- | ----------------------------------- | ---------------------------- |
| Expedición existe, Transporte NO  | ¿Dónde está la caja?                | Chofer debe crear Transporte |
| Transporte existe, Expedición NO  | Caja no proviene de nuestro almacén | Verificar datos              |
| Ambos existen, números diferentes | Desajuste en cantidad               | Revisar documentos           |

## Navegación

- **Logo "ControlCajas"**: No es clickeable (solo branding)
- **Nombre del usuario**: Muestra tu usuario y rol actual
- **Botón "Salir"**: Cierra sesión y vuelve al login

## Atajos

| Acción              | Combinación                      |
| ------------------- | -------------------------------- |
| Nuevo evento rápido | Tab a través de campos           |
| Enviar formulario   | Enter en campo de submit         |
| Cambiar evento      | Clica "← Cambiar tipo de evento" |

## Validaciones

La aplicación valida:

- ✓ Usuario único (no puedes registrar mismo nombre dos veces)
- ✓ Contraseña mínimo 6 caracteres
- ✓ Centro de distribución obligatorio
- ✓ Números no negativos
- ✓ Fecha automática (no se puede modificar)

## Formato de Datos

### Fecha

- Formato: **YYYY-MM-DD** (2026-02-26)
- Se asigna automáticamente al crear evento
- No se puede cambiar después de crear

### Números (cajas, cajas rotas, tapas rotas)

- Solo números enteros ≥ 0
- Sin decimales
- Por defecto 0

### Colores de cajas

- **Blancas**: Cajas blancas
- **Negras**: Cajas negras
- **Verdes**: Cajas verdes

## Preguntas Frecuentes

**P: ¿Qué pasa si creo un evento por error?**
R: Actualmente no hay función de eliminar. Crea un evento de ajuste con números negativos si es necesario, o contacta al informático.

**P: ¿Puedo cambiar la fecha de un evento?**
R: No, la fecha se asigna automáticamente al día actual.

**P: ¿Qué significa que una fila esté en rojo?**
R: Hay un desajuste. Revisa si faltan crear eventos o si los números no coinciden.

**P: ¿Puedo ver eventos de días anteriores?**
R: Sí, en "Ver Eventos" selecciona la fecha que desees.

**P: ¿Quién puede ver qué?**
R: Todos los usuarios autenticados ven todas las tablas. El rol solo determina qué eventos puede crear.

## Contacto de Soporte

Si encuentras problemas:

1. Verifica que has ingresado datos correctos
2. Recarga la página (F5)
3. Intenta cerrar sesión y volver a entrar
4. Contacta al equipo informático si el problema persiste

## Novedades y Actualizaciones

Mantente atento a:

- Nuevas características en el dashboard
- Cambios en el flujo de trabajo
- Actualizaciones de seguridad
