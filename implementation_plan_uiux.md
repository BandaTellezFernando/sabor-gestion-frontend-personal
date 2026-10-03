# Plan de Implementación de UI/UX y Sistema Visual - Mishi-Food (Fase 2)

**Proyecto:** `sabor-gestion-frontend-personal`  
**Marca Oficial:** **Mishi-Food**  
**Subtítulo Institucional:** *Sistema de Gestión Gastronómica*  
**Commit Base:** `879bf6d6ecd1cb86bd806ddffe4f7dd359947c24`  
**Ámbito:** Exclusivamente Frontend (sin modificaciones al backend).  
**Propósito:** Definir el sistema de diseño visual, identidad de marca felina-gastronómica profesional, arquitectura del Application Shell (Sidebar + Header + Contenido), rediseño de `/login` y `/dashboard` para los 4 roles oficiales (`Administrador`, `Mesero`, `Cajero`, `Cocinero`), garantizando fidelidad absoluta a las capacidades y contratos del backend, diseño responsivo, alta accesibilidad y microinteracciones operativas.

---

## 1. Objetivos

1. **Identidad Gastronómica Mishi-Food:** Dotar al sistema de una identidad visual propia, memorable y profesional bajo el nombre **Mishi-Food** y el subtítulo *Sistema de Gestión Gastronómica*.
2. **Emblema de Marca Felino-Gastronómico:** Integrar un icono vectorial sobrio y elegante de gato estilizado, fusionado con la estética de alta restauración contemporánea, sin recurrir a mascotas infantiles o caricaturescas, y sin emojis.
3. **Cero Ruptura Funcional:** Preservar intacta la lógica existente: autenticación JWT, RBAC de 4 roles, cliente REST con `fetch` nativo, persistencia en `localStorage`, Socket.IO con `auth: { token }`, `AuthGuard` y `AuthContext`.
4. **Ergonomía Operativa (Application Shell):** Diseñar un marco de aplicación escalable compuesto por **Sidebar colapsable** + **Header contextual** + **Área de Contenido fluida**, reutilizable para los módulos del sistema.
5. **Claridad y Agilidad en Pantalla:** Eliminar elementos visuales distractores (sin emojis, sin gradientes excesivos, sin sombras pesadas, sin glassmorphism saturado). Priorizar contraste, legibilidad de números/totales y estados reales de mesa y comanda.
6. **Fidelidad Estricta con el Backend:**
   * **Estados de Mesa:** Únicamente los 3 estados oficiales del backend (`Libre`, `Ocupada`, `Cuenta Solicitada`).
   * **Ingredientes:** Únicamente el indicador booleano de disponibilidad (`disponible: boolean`), sin inventar inventarios cuantitativos.
   * **Métricas de Dashboard:** Mostrar exclusivamente los valores absolutos del endpoint `GET /api/dashboard/resumen` para Administrador, sin exigir ni simular tendencias porcentuales ni comparaciones inexistentes.
7. **Diferenciación por Rol en Dashboard:**
   * **Administrador:** Métricas clave consolidadas de la jornada, platos más vendidos y comandas recientes según el contrato real.
   * **Mesero, Cajero, Cocinero:** Paneles de control operativo enfocados en sus flujos reales de trabajo con accesos directos y estado en tiempo real.
8. **Accesibilidad y Estándares Modernos:** Contraste WCAG AA, soporte completo de navegación por teclado, `focus-visible`, etiquetas semánticas y microinteracciones de 150-200ms.

---

## 2. Identidad Visual de Mishi-Food

* **Nombre de Marca:** **Mishi-Food** (reemplaza cualquier mención visible previa como "SABOR & GESTIÓN" o "S&G").
* **Subtítulo Oficial:** *Sistema de Gestión Gastronómica*.
* **Concepto:** *Mishi-Food: Agilidad, Precisión y Carácter Culinario*. Combina la agilidad, elegancia y atención al detalle representadas por la figura felina con la calidez gastronómica (tonos terracota, cobre y ámbar) y la solidez de una plataforma de gestión moderna (superficies neutras zinc/carbón, bordes definidos de 1px y tipografía monoespaciada para cifras y códigos).
* **Diseño del Logo e Isotipo (Gato + Gastronomía):**
  * **Elemento Principal:** Un isotipo vectorial de gato estilizado con trazos geométricos finos y limpios, proyectando modernidad, sofisticación y profesionalismo.
  * **Implementación:** Componente SVG dedicado `BrandLogo` enriquecido o integrado con el icono vectorial `Cat` de `lucide-react`, montado sobre un contenedor cuadrado con esquinas redondeadas (`rounded-xl` / `rounded-lg`) en tono terracota cálido (`bg-amber-600` / `bg-orange-700`).
  * **Comportamiento Escalar:**
    * *En Header/Sidebar expandido:* Emblema de 36px/40px junto al texto tipográfico en mayúsculas `Mishi-Food` y la leyenda `Sistema de Gestión Gastronómica`.
    * *En Sidebar colapsado:* Emblema centrado de 36px reconocible de forma instantánea.
    * *En Pantalla de Login:* Emblema protagónico de 56px con fondo terracota y elevación sutil.
    * *En tamaños reducidos (16px a 20px):* La silueta geométrica conserva legibilidad absoluta sin perder definición.
  * **Prohibición:** Cero emojis de gatos (`🐱`, `🐈`) y cero ilustraciones tipo caricatura o clipart infantil.

---

## 3. Paleta de Colores y Tokens de Diseño

La paleta se estructura mediante variables CSS integradas en `@theme` de Tailwind CSS v4, asegurando compatibilidad con temas claro y oscuro:

### 3.1 Superficies y Neutros
| Token | Modo Claro | Modo Oscuro | Uso Semántico |
|:---|:---|:---|:---|
| `--color-background` | `#fafafa` (Zinc 50) | `#09090b` (Zinc 950) | Lienzo general de la pantalla |
| `--color-surface` | `#ffffff` (White) | `#121215` (Zinc 900) | Fondo de cards, sidebar y modales |
| `--color-surface-muted` | `#f4f4f5` (Zinc 100) | `#18181b` (Zinc 900/80) | Filas alternas de tablas, inputs deshabilitados |
| `--color-border` | `#e4e4e7` (Zinc 200) | `#27272a` (Zinc 800) | Bordes estructurales de tarjetas y divisiones |
| `--color-border-subtle` | `#f4f4f5` (Zinc 100) | `#1f1f23` (Zinc 900) | Separadores internos de listas |
| `--color-foreground` | `#09090b` (Zinc 950) | `#f4f4f5` (Zinc 100) | Texto principal y encabezados |
| `--color-foreground-muted`| `#52525b` (Zinc 600) | `#a1a1aa` (Zinc 400) | Subtítulos, descripciones y textos secundarios |

### 3.2 Acento de Marca (Culinario / Terracota Mishi-Food)
| Token | Modo Claro | Modo Oscuro | Uso Semántico |
|:---|:---|:---|:---|
| `--color-primary` | `#c2410c` (Orange 700) | `#ea580c` (Orange 600) | Botón principal, item activo de navegación, acentos |
| `--color-primary-hover` | `#9a3412` (Orange 800) | `#c2410c` (Orange 700) | Estado hover de acciones primarias |
| `--color-primary-subtle`| `#fff7ed` (Orange 50) | `#431407` (Orange 950) | Fondo de selección suave e indicadores activos |
| `--color-primary-ring` | `#f97316` (Orange 500) | `#ea580c` (Orange 600) | Anillo de enfoque (`focus-visible:ring-2`) |

### 3.3 Estados de Negocio y Funcionales
Mapeados de forma biunívoca con las máquinas de estado del backend real:

#### A. Estados Oficiales de Mesa (`EstadoMesa`)
* **`Libre` (Mesa disponible) → Verde:**
  * Fondo: `bg-emerald-50 dark:bg-emerald-950/40`
  * Borde: `border-emerald-200 dark:border-emerald-800`
  * Texto: `text-emerald-700 dark:text-emerald-300`
  * Dot indicador: `bg-emerald-500`
* **`Ocupada` (Mesa con comensales) → Ámbar:**
  * Fondo: `bg-amber-50 dark:bg-amber-950/40`
  * Borde: `border-amber-200 dark:border-amber-800`
  * Texto: `text-amber-700 dark:text-amber-300`
  * Dot indicador: `bg-amber-500`
* **`Cuenta Solicitada` (Mesa esperando pago) → Azul:**
  * Fondo: `bg-blue-50 dark:bg-blue-950/40`
  * Borde: `border-blue-200 dark:border-blue-800`
  * Texto: `text-blue-700 dark:text-blue-300`
  * Dot indicador: `bg-blue-500`

*(Regla de negocio: El backend no implementa estados de mesa adicionales; se respeta estrictamente esta terna).*

#### B. Estados Oficiales de Pedido (`EstadoPedido`)
* **`ABIERTO` (Comanda en toma):**
  * Fondo: `bg-sky-50 dark:bg-sky-950/40`
  * Borde: `border-sky-200 dark:border-sky-800`
  * Texto: `text-sky-700 dark:text-sky-300`
  * Dot indicador: `bg-sky-500`
* **`EN_PREPARACION` (En cocina):**
  * Fondo: `bg-amber-50 dark:bg-amber-950/40`
  * Borde: `border-amber-200 dark:border-amber-800`
  * Texto: `text-amber-700 dark:text-amber-300`
  * Dot indicador: `bg-amber-500`
* **`ENTREGADO` (Servido en mesa):**
  * Fondo: `bg-emerald-50 dark:bg-emerald-950/40`
  * Borde: `border-emerald-200 dark:border-emerald-800`
  * Texto: `text-emerald-700 dark:text-emerald-300`
  * Dot indicador: `bg-emerald-500`
* **`CERRADO` (Comanda cobrada y finalizada):**
  * Fondo: `bg-zinc-100 dark:bg-zinc-800`
  * Borde: `border-zinc-200 dark:border-zinc-700`
  * Texto: `text-zinc-700 dark:text-zinc-300`
  * Dot indicador: `bg-zinc-500`
* **`CANCELADO` (Comanda anulada):**
  * Fondo: `bg-rose-50 dark:bg-rose-950/40`
  * Borde: `border-rose-200 dark:border-rose-800`
  * Texto: `text-rose-700 dark:text-rose-300`
  * Dot indicador: `bg-rose-500`

### 3.4 Insignias de Roles (RBAC)
* **Administrador:** Púrpura elegante (`bg-purple-50 text-purple-700 border-purple-200`)
* **Mesero:** Azul cielo dinámico (`bg-sky-50 text-sky-700 border-sky-200`)
* **Cajero:** Esmeralda financiero (`bg-emerald-50 text-emerald-700 border-emerald-200`)
* **Cocinero:** Ámbar fuego (`bg-amber-50 text-amber-700 border-amber-200`)

---

## 4. Tipografía y Jerarquía

* **Fuente Principal:** `Geist Sans` para prosa, etiquetas y títulos.
* **Fuente Numérica y Códigos:** `Geist Mono` para importes monetarios (`Bs. 3,450.00`), identificadores de órdenes (`PED-0001`), horas (`13:45`) y porcentajes reales.
* **Jerarquía de Tamaños:**
  * **H1 (Título de Página):** `text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50`
  * **H2 (Subtítulo de Módulo):** `text-lg font-semibold tracking-tight text-zinc-800 dark:text-zinc-100`
  * **H3 (Encabezado de Tarjeta):** `text-sm font-semibold text-zinc-800 dark:text-zinc-200`
  * **KPI Display:** `text-3xl font-bold tracking-tight font-mono text-zinc-900 dark:text-zinc-50`
  * **Body / Párrafo:** `text-sm leading-6 text-zinc-600 dark:text-zinc-400`
  * **Captions / Metadatos:** `text-xs text-zinc-500 dark:text-zinc-400`
  * **Overline / Etiquetas:** `text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500`

---

## 5. Escala de Espaciado, Grid y Border Radius

* **Retícula Base:** Sistema de 4px / 8px (`p-2` = 8px, `p-4` = 16px, `p-6` = 24px, `p-8` = 32px).
* **Contenedores:** Ancho máximo controlado con `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
* **Escala de Radios (`border-radius`):**
  * `rounded-lg` (8px): Botones, campos de entrada (`Input`), celdas de selección.
  * `rounded-xl` (12px): Tarjetas de métricas, paneles, dropdowns y alerts.
  * `rounded-2xl` (16px): Card principal de login y modales.
  * `rounded-full` (9999px): Badges, avatares y dots de estado.
* **Elevación y Sombras:**
  * Sombras mínimas combinadas con bordes de 1px: `shadow-xs` para cards estándar, `shadow-sm` para hover interactivo, `shadow-md` para menús flotantes. Sin sombras difusas ni pesadas.

---

## 6. Revisión y Evolución de Componentes Base

| Componente | Estado Actual | Diagnóstico de Rediseño | Variantes y Mejoras Propuestas |
|:---|:---|:---|:---|
| **`Button`** | Básico | Funcional pero rígido | Añadir soporte para iconos (`leftIcon`, `rightIcon`), microinteracción `active:scale-[0.98]`, altura táctil accesible mínima de 38px, variante `primary` con color terracota oficial de Mishi-Food. |
| **`Input`** | Estándar | Falta soporte de adornos | Añadir ranuras para iconos iniciales (ej. lupa de búsqueda, correo) e iconos finales interactivos (botón de mostrar/ocultar contraseña). Borde enfocado terracota. |
| **`Card`** | Básico | Plano | Tarjeta con opción interactiva `isHoverable`, padding optimizado, separación de encabezado más limpia. |
| **`Badge`** | Colores genéricos | Requiere mapeo de estados | Incorporar dot fijo para estados operativos reales (`Libre`, `Ocupada`, `Cuenta Solicitada` en azul, estados de comanda y roles). |
| **`Table`** | Básico | Encabezado estándar | Añadir soporte de cabecera fija (`sticky`), bordes contrastados y estado vacío visualmente agradable. |
| **`Spinner`** | Correcto | Conservar | Mantener SVG ligero con variantes de tamaño (`sm`, `md`, `lg`) y color de acento terracota. |
| **`Alert`** | Básico | Correcto | Ajustar contraste de texto y soporte para mensajes informativos sobre disponibilidad de ingredientes o errores de validación. |
| **`BrandLogo`** *(Nuevo)* | Inexistente | Esencial para Mishi-Food | Componente vectorial que renderiza el isotipo felino estilizado con contenedor terracota, adaptable en tamaño (16px a 56px) para Navbar, Sidebar y Login. |
| **`StatCard`** *(Nuevo)* | Inexistente | Requerido para Dashboard | Componente especializado para métricas con icono temático, valor en fuente monoespaciada, etiqueta descriptiva y descripción o contexto informativo opcional (sin comparaciones porcentuales ni tendencias temporales ficticias). |
| **`EmptyState`** *(Nuevo)* | Inexistente | Requerido para tablas | Componente reutilizable con icono ilustrativo, título y descripción cuando una lista o tabla no contiene registros. |
| **`IconButton`** *(Nuevo)* | Inexistente | Requerido para Shell | Botón cuadrado accesible para colapso de sidebar, toggle de visibilidad de contraseña y salida de sesión. |

### 6.1 Detalle del Componente `StatCard` (`src/components/ui/stat-card.tsx`)
Diseñado para reflejar con honestidad los datos reales del backend sin añadir métricas ficticias:
* **Propiedades soportadas:**
  * `icon`: Icono temático (`LucideIcon`) para identificación visual intuitiva.
  * `label`: Etiqueta descriptiva superior (ej. `"Ventas de la Jornada"`, `"Mesas Activas"`).
  * `value`: Valor numérico o formateado en tipografía monoespaciada (`Geist Mono`, ej. `"Bs. 3,450.00"`, `"28"`).
  * `description` (opcional): Breve texto informativo de contexto estático (ej. `"Total acumulado del día"`, `"Salón principal"`).
* **Restricción estricta:** NO requiere ni renderiza variaciones relativas o tendencias porcentuales (`+10%`, `-5%`, comparativas de días previos), garantizando fidelidad total con `GET /api/dashboard/resumen`.

---

## 7. Application Shell

Estructura modular y reutilizable para todas las pantallas del sistema:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ APPLICATION SHELL                                                      │
│                                                                        │
│ ┌───────────────┬────────────────────────────────────────────────────┐ │
│ │ SIDEBAR       │ HEADER                                             │ │
│ │               │ [≡] Contexto / Ruta      [Socket: En vivo] [Perfil]│ │
│ │ [Gato] Mishi  ├────────────────────────────────────────────────────┤ │
│ │   Food        │ MAIN CONTENT AREA (Scrollable)                     │ │
│ │               │                                                    │ │
│ │ Navegación    │                                                    │ │
│ │ filtrada      │                                                    │ │
│ │ por rol       │                                                    │ │
│ │               │                                                    │ │
│ │ [Usuario/Rol] │                                                    │ │
│ └───────────────┴────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

* **Coordinación de Estado:** Estado de cliente ligero para controlar `isCollapsed` (desktop: 256px frente a 72px) e `isMobileOpen` (móvil: drawer deslizante).
* **Persistencia del Estado Colapsado:** Guardar la preferencia en `localStorage` (`mishi_sidebar_collapsed`) para respetar la elección del operador.

---

## 8. Sidebar

* **Componente:** `src/components/layout/sidebar.tsx` (Desktop) y `src/components/layout/mobile-sidebar.tsx` (Móvil).
* **Contenido y Secciones:**
  1. **Cabecera Institucional:** Isotipo felino `BrandLogo` y nombre en mayúsculas **MISHI-FOOD** con el subtítulo *Gestión Gastronómica*. Botón de colapso rápido en desktop.
  2. **Bloque Operativo (filtrado por RBAC):**
     * **General:** `Dashboard` (`LayoutDashboard`)
     * **Atención y Salón:** `Mesas` (`Grid`), `Pedidos` (`Receipt`), `Cocina` (`ChefHat`), `Caja` (`CreditCard`), `Pagos` (`DollarSign`)
     * **Menú y Cocina:** `Platos` (`Utensils`), `Categorías` (`Layers`), `Ingredientes` (`Apple`), `Ubicaciones` (`MapPin`)
     * **Administración:** `Usuarios` (`Users`)
  3. **Indicadores de Estado:**
     * Módulos ya previstos pero en desarrollo muestran una etiqueta compacta `"Fase 3"` o `"Próx."` sin romper la alineación visual.
     * Enlace activo resaltado con fondo terracota sutil y borde izquierdo destacado.
  4. **Modo Colapsado (Desktop 72px):**
     * Oculta textos y deja únicamente los iconos centrados con tooltips flotantes accesibles.
  5. **Drawer Móvil:**
     * Slide-over desde la izquierda con fondo atenuado (`backdrop-blur-xs bg-black/40`) y botón de cierre táctil.

---

## 9. Header

* **Componente:** `src/components/layout/header.tsx`.
* **Elementos Integrados:**
  1. **Gatillador Móvil:** Botón de menú hamburguesa (`Menu`) visible únicamente en `< md`.
  2. **Contexto de Página:** Título dinámico del módulo actual (ej. `"Dashboard"` o `"Panel de Control"`) con breadcrumb auxiliar.
  3. **Indicador de Conexión en Tiempo Real:**
     * Chip compacto con icono `Radio` y punto pulsante verde cuando `isConnected === true`.
     * Tooltip explicativo con estado del WebSocket.
  4. **Información del Usuario:**
     * Avatar o iniciales del empleado en círculo contrastado.
     * Nombre y apellido en texto mediano.
     * Badge de color específico según rol (`Administrador`, `Mesero`, `Cajero`, `Cocinero`).
  5. **Acción de Logout:** Botón discreto de salida rápida con confirmación no intrusiva y tooltip.

---

## 10. Rediseño de `/login`

* **Ruta:** `src/app/(auth)/login/page.tsx`.
* **Composición Visual:**
  * Diseño centrado con tarjeta prominente sobre fondo neutro cálido con sutil entramado gastronómico contemporáneo.
  * Encabezado con el emblema felino `BrandLogo` de Mishi-Food y título claro: **Mishi-Food**.
  * Subtítulo: *Portal de Acceso Operativo - Sistema de Gestión Gastronómica*.
* **Formulario y Campos:**
  * **Correo Electrónico:** Input con icono `Mail` en el extremo izquierdo y placeholder claro (`admin@sabor.com` o `mesero@sabor.com`).
  * **Contraseña:** Input con icono `Lock` en el extremo izquierdo y botón interactivo `Eye` / `EyeOff` en el extremo derecho para mostrar/ocultar contraseña (con `aria-label` correspondiente).
  * **Botón de Envío:** Botón principal terracota en bloque (`w-full`), con spinner integrado y texto dinámico ("Ingresando..." durante petición).
* **Manejo de Errores:**
  * Alerta de error estilizada que extrae el mensaje de `ApiError` (ej. credenciales inválidas, usuario inactivo o servidor inaccesible) sin mostrar trazas técnicas.
* **Nota de Seguridad Operativa:**
  * Leyenda inferior: *"Sistema de uso exclusivo para personal autorizado de Mishi-Food. Las sesiones tienen una vigencia máxima de 8 horas."*
  * Sin enlaces a registro, reseteo por email ni OAuth (no contemplados por el backend).

---

## 11. Rediseño de `/dashboard`

* **Ruta:** `src/app/(dashboard)/dashboard/page.tsx`.
* **Estructura Modular según Rol:**

### 11.1 Rol: Administrador
* **Encabezado:** Saludo personalizado, fecha en formato legible Bolivia y botón de actualización manual con icono de refresco animado.
* **Cuadrícula de Métricas Clave (KPIs reales de `GET /api/dashboard/resumen`):**
  1. **Ventas de la Jornada:** Icono monetario, valor grande en `Bs. X.XX` (Geist Mono), etiqueta descriptiva y contexto informativo opcional.
  2. **Comandas del Día:** Icono de comanda, total de órdenes acumuladas, etiqueta descriptiva.
  3. **Clientes Estimados:** Icono de comensales, afluencia estimada según pedidos del día, etiqueta descriptiva.
  4. **Mesas Activas:** Icono de salón, conteo de mesas en servicio, etiqueta descriptiva.
  5. **Ocupación:** Icono de porcentaje, porcentaje de ocupación (`ocupacionPorcentaje`), etiqueta descriptiva.
  *(Aclaración de diseño: StatCard muestra exclusivamente estos datos reales; no se incluyen porcentajes de variación ni comparativas inexistentes en el backend).*
* **Demanda Culinaria y Actividad Reciente (2 Columnas):**
  * **Columna Izquierda (Platos Estrella):** Tabla estilizada de `platosMasVendidos` con indicador de ranking numérico, nombre del plato y cantidad de porciones despachadas.
  * **Columna Derecha (Comandas Recientes):** Tabla de `ordenesRecientes` con código `PED-XXXX` en monoespaciado, número de mesa, hora boliviana, badge de estado y monto total.

### 11.2 Rol: Mesero
* **Banner Operativo:** Identificación del mesero y estado operativo del servicio (nombre, rol y confirmación de escucha de la sala `room:meseros`).
* **Tarjetas de Acción Operativa Inmediata:**
  * *Explorar Mesas:* Vista rápida del estado del salón (`Libre`, `Ocupada`, `Cuenta Solicitada`).
  * *Apertura de Comanda:* Toma rápida de órdenes de clientes.
  * *Menú y Precios:* Consulta inmediata de disponibilidad de platos e ingredientes.
* **Bandeja de Pedidos Listos en Vivo:**
  * Tarjeta reactiva conectada al evento `mesas:alerta_listo` de Socket.IO, mostrando los pedidos que están listos para ser llevados a mesa.

### 11.3 Rol: Cajero
* **Banner de Turno de Caja:** Identificación del cajero y confirmación de escucha de la sala `room:caja`.
* **Tarjetas de Acción Operativa:**
  * *Cuentas Pendientes de Cobro:* Enlace al flujo de cobro inmediato para mesas en estado `Cuenta Solicitada`.
  * *Simulación de Pago QR:* Notificaciones en tiempo real del evento `caja:pago_confirmado`.
  * *Cierre de Turno:* Acceso guiado para el arqueo final (`PATCH /api/usuarios/:id/estado`).
* **Resumen de Métodos Permitidos:**
  * Recordatorio visual de los 3 únicos métodos válidos en sistema: Efectivo, Tarjeta y QR.

### 11.4 Rol: Cocinero
* **Banner de Producción Culinaria:** Identificación de partida y sincronización en tiempo real con `cocina:nuevo_pedido`.
* **Tarjetas de Acción Operativa:**
  * *Tablero de Producción:* Comandas activas en preparación (`EN_PREPARACION`).
  * *Disponibilidad de Ingredientes:* Verificación rápida del estado booleano (`disponible: true/false`) de los ingredientes.
  * *Ficha de Platos:* Consulta de platos y categorías del menú culinario.

---

## 12. Responsive Design

* **Breakpoints:**
  * Móvil: `< 768px` (`sm`)
  * Tablet: `768px - 1024px` (`md`)
  * Desktop: `> 1024px` (`lg` / `xl`)
* **Comportamiento Adaptativo:**
  * **Sidebar:**
    * Desktop (`>= 1024px`): Lateral fijo conmutador expandido (256px) / colapsado (72px).
    * Tablet (`768px - 1024px`): Inicia automáticamente colapsado a 72px para priorizar el contenido.
    * Móvil (`< 768px`): Oculto por defecto. Se abre como Drawer flotante desde la izquierda con botón de cierre táctil y backdrop blur.
  * **Header:**
    * En móvil muestra botón hamburguesa, título compacto y menú de usuario reducido.
    * En desktop muestra breadcrumb completo, badge de WebSocket y detalles del perfil.
  * **Dashboard Cards:**
    * Móvil: 1 columna o 2 columnas compactas.
    * Tablet: 2 o 3 columnas.
    * Desktop: 5 tarjetas de métricas alineadas horizontalmente.
  * **Tablas de Datos:**
    * Contenedor con `overflow-x-auto` suave y sombras laterales que indican contenido deslizable.

---

## 13. Accesibilidad (a11y)

1. **Relación de Contraste:** Mínimo de 4.5:1 para texto normal y 3:1 para textos grandes y bordes de control interactivo (WCAG 2.1 Nivel AA).
2. **Navegación por Teclado:**
   * Todos los botones, enlaces y campos son alcanzables mediante `Tab`.
   * Estilo consistente `focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2`.
3. **Lectores de Pantalla y ARIA:**
   * IconButtons poseen atributo `aria-label` explícito (ej. `"Colapsar menú lateral"`, `"Mostrar contraseña"`, `"Cerrar sesión"`).
   * Los estados de carga utilizan `role="status"` y texto oculto `.sr-only` (`Cargando...`).
   * Los mensajes de error utilizan `role="alert"` y están vinculados a sus respectivos inputs mediante `aria-describedby`.
4. **No Dependencia Exclusiva del Color:**
   * Los estados de mesa y pedido no se comunican únicamente con color; siempre van acompañados de su texto correspondiente (`Libre`, `Ocupada`, `Cuenta Solicitada`) y dots o iconos diferenciados.

---

## 14. Microinteracciones y Animaciones

* **Criterio:** Exclusivamente microinteracciones funcionales de baja latencia (150ms a 200ms `ease-in-out`), sin librerías pesadas externas de animación.
* **Interacciones Específicas:**
  * Transición de ancho del Sidebar (`transition-all duration-200 ease-in-out`).
  * Desplazamiento del Drawer móvil (`transition-transform duration-200 ease-out`).
  * Presión táctil en botones (`active:scale-[0.98]`).
  * Rotación suave del icono de actualización al recargar el dashboard (`animate-spin` condicional).
  * Pulsación suave del dot indicador de WebSockets (`animate-pulse`).

---

## 15. Archivos a Modificar

1. [`src/app/globals.css`](file:///home/fercho/Software/sabor-gestion-frontend-personal/src/app/globals.css): Definición de tokens de diseño `@theme` de Tailwind v4, variables de color gastronómico Mishi-Food y reset tipográfico con Geist.
2. [`src/components/ui/button.tsx`](file:///home/fercho/Software/sabor-gestion-frontend-personal/src/components/ui/button.tsx): Inclusión de soporte para slots de iconos (`leftIcon`, `rightIcon`), microinteracción de presión y accesibilidad mejorada.
3. [`src/components/ui/input.tsx`](file:///home/fercho/Software/sabor-gestion-frontend-personal/src/components/ui/input.tsx): Soporte para adornos de inicio y fin (toggle de visibilidad de contraseña, iconos de entrada).
4. [`src/components/ui/card.tsx`](file:///home/fercho/Software/sabor-gestion-frontend-personal/src/components/ui/card.tsx): Ajuste de radios, bordes sutiles y variante hover.
5. [`src/components/ui/badge.tsx`](file:///home/fercho/Software/sabor-gestion-frontend-personal/src/components/ui/badge.tsx): Variantes de estado de negocio (`Libre`, `Ocupada`, `Cuenta Solicitada` en azul, estados de pedido) con dot indicador.
6. [`src/components/ui/table.tsx`](file:///home/fercho/Software/sabor-gestion-frontend-personal/src/components/ui/table.tsx): Soporte de cabecera fija, tipografía de cabeceras y espaciado de celdas.
7. [`src/app/(auth)/login/page.tsx`](file:///home/fercho/Software/sabor-gestion-frontend-personal/src/app/(auth)/login/page.tsx): Rediseño visual integral con toggle de contraseña y branding Mishi-Food.
8. [`src/app/(dashboard)/dashboard/layout.tsx`](file:///home/fercho/Software/sabor-gestion-frontend-personal/src/app/(dashboard)/dashboard/layout.tsx): Integración del nuevo Application Shell (`AppShell` con `Sidebar` y `Header`).
9. [`src/app/(dashboard)/dashboard/page.tsx`](file:///home/fercho/Software/sabor-gestion-frontend-personal/src/app/(dashboard)/dashboard/page.tsx): Rediseño completo con vistas especializadas para Administrador, Mesero, Cajero y Cocinero.
10. [`src/app/layout.tsx`](file:///home/fercho/Software/sabor-gestion-frontend-personal/src/app/layout.tsx): Actualización de metadatos de página a `Mishi-Food | Sistema de Gestión Gastronómica`.

---

## 16. Archivos Nuevos

1. `src/components/ui/brand-logo.tsx`: Componente vectorial que renderiza el isotipo felino estilizado con marco terracota, adaptable en tamaño (16px a 56px) para Navbar, Sidebar y Login.
2. `src/components/layout/app-shell.tsx`: Contenedor maestro del shell que gestiona el estado de colapso del sidebar en desktop y drawer en móvil.
3. `src/components/layout/sidebar.tsx`: Barra lateral de navegación con agrupación semántica de rutas, filtrado por RBAC, modo expandido/colapsado y mini-perfil de usuario.
4. `src/components/layout/mobile-sidebar.tsx`: Drawer deslizante optimizado para pantallas táctiles y dispositivos móviles.
5. `src/components/layout/header.tsx`: Encabezado superior con título contextual, indicador de conexión WebSocket en vivo, usuario activo y botón de salida.
6. `src/components/ui/stat-card.tsx`: Componente visual para presentar métricas con icono temático, etiqueta, valor numérico en fuente monoespaciada y descripción o contexto opcional (sin comparaciones porcentuales ni tendencias temporales ficticias).
7. `src/components/ui/empty-state.tsx`: Componente de estado vacío con ilustración vectorial sobria, título y descripción cuando no hay datos.
8. `src/components/ui/icon-button.tsx`: Botón cuadrado optimizado para iconos con accesibilidad y tamaños estandarizados.

---

## 17. Dependencias Nuevas

* **Ninguna.**
* El proyecto ya cuenta con `lucide-react` para iconografía (incluyendo el icono `Cat`) y `@tailwindcss/postcss` con Tailwind CSS v4 para el motor de estilos. No se añadirán librerías redundantes de CSS ni frameworks de animación pesados para mantener el bundle limpio y rápido.

---

## 18. Orden de Implementación

1. **Paso 1 - Base de Estilos y Tokens:** Actualizar `globals.css` con la paleta gastronómica oficial Mishi-Food, variables de superficie y asignación de Geist Sans/Mono en Tailwind v4.
2. **Paso 2 - Creación de BrandLogo y Refactor de UI Primitives:**
   * Crear `BrandLogo` con el isotipo felino profesional.
   * Actualizar `Button`, `Input`, `Card`, `Badge` (con `Cuenta Solicitada` en azul) y `Table`.
   * Crear `IconButton`, `StatCard` (sin tendencias ficticias) y `EmptyState`.
3. **Paso 3 - Construcción del Application Shell:**
   * Crear `Sidebar` (desktop colapsable con branding Mishi-Food).
   * Crear `MobileSidebar` (drawer táctil).
   * Crear `Header` (barra superior contextual).
   * Crear `AppShell` y vincularlo en `src/app/(dashboard)/dashboard/layout.tsx`.
4. **Paso 4 - Rediseño de la Pantalla de Login:**
   * Implementar la nueva composición visual de `src/app/(auth)/login/page.tsx` con input de contraseña con toggle, emblema felino Mishi-Food, leyenda de vigencia máxima de 8 horas y validación visual.
5. **Paso 5 - Rediseño de la Pantalla de Dashboard:**
   * Implementar `src/app/(dashboard)/dashboard/page.tsx` con las 4 vistas diferenciadas por rol (Administrador con métricas absolutas reales de `dashboardService`, Mesero, Cajero, Cocinero).
6. **Paso 6 - Verificación de Calidad y Compilación:**
   * Ejecutar `pnpm lint` verificando 0 errores.
   * Ejecutar `pnpm build` verificando compilación limpia con Turbopack.
   * Verificar navegación en desktop, tablet y móvil.
