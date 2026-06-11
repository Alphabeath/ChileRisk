# Plan Familia Preparada - Especificación Funcional Web

## Descripción General

El objetivo de la seccion es permitir que una familia construya, mantenga y actualice un **Plan Familia Preparada**, siguiendo la metodología oficial de SENAPRED.

La plataforma debe guiar a los usuarios mediante un proceso estructurado de 8 pasos para:

- Identificar riesgos.
- Registrar integrantes y necesidades especiales.
- Definir protocolos de emergencia.
- Crear mapas de evacuación.
- Asignar responsabilidades.
- Gestionar contactos de emergencia.
- Preparar kits de emergencia.
- Practicar y mejorar continuamente el plan.

---

# Flujo General

```text
Inicio
│
├── Bienvenida
├── Introducción al riesgo y preparación
│
└── Plan Familia Preparada
     │
     ├── Paso 1: Grupo Familiar
     ├── Paso 2: Amenazas
     ├── Paso 3: Zonas Seguras
     ├── Paso 4: Mapa de Vivienda
     ├── Paso 5: Roles
     ├── Paso 6: Contactos
     ├── Paso 7: Kit de Emergencia
     └── Paso 8: Simulación y Mejora Continua

Finalizar
│
├── Resumen
├── Exportar PDF
└── Compartir Plan
```

---

# Dashboard Principal

## Objetivos

Mostrar el estado actual del plan.

### Indicadores

- Porcentaje completado.
- Fecha de última actualización.
- Próxima revisión.
- Alertas pendientes.

### Ejemplo

```text
Plan completado: 75%

✓ Grupo Familiar
✓ Amenazas
✓ Zonas Seguras
✓ Roles

Pendientes:
- Kit de Emergencia
- Simulación
```

---

# Paso 1: Información del Grupo Familiar

## Objetivo

Registrar todas las personas que viven en la vivienda.

## Datos requeridos

### Integrantes

| Campo | Tipo |
|---------|---------|
| Nombre | Texto |
| Apellidos | Texto |
| Documento | Texto |
| Sexo | Selección |
| Edad | Número |
| Nacionalidad | Texto |
| Teléfono | Texto |
| Condiciones médicas | Texto |
| Contraindicaciones | Texto |
| Necesidades especiales | Texto |

### Mascotas

| Campo | Tipo |
|---------|---------|
| Nombre | Texto |
| Especie | Texto |
| Edad | Número |
| Características | Texto |
| Necesidades especiales | Texto |

## Funcionalidades

- Agregar integrantes ilimitados.
- Agregar mascotas.
- Marcar condiciones especiales:
  - Movilidad reducida.
  - Discapacidad.
  - Enfermedad crónica.
  - Dependencia médica.
  - Embarazo.
  - Lactancia.

---

# Paso 2: Identificación de Amenazas

## Objetivo

Detectar amenazas dentro y fuera de la vivienda.

---

## Amenazas Internas

### Checklist

- Enchufes defectuosos.
- Instalaciones eléctricas dañadas.
- Fugas de gas.
- Material inflamable.
- Muebles sin fijación.
- Pasillos obstruidos.
- Escaleras inseguras.
- Otros.

---

## Amenazas Externas

### Checklist

- Sismo.
- Tsunami.
- Inundación.
- Incendio forestal.
- Aluvión.
- Remoción en masa.
- Erupción volcánica.
- Accidente industrial.
- Accidente de tránsito.
- Otros.

---

## Evaluación

Cada amenaza debe registrar:

```json
{
  "riesgo": "",
  "probabilidad": 1,
  "impacto": 1,
  "accion_correctiva": ""
}
```

---

## Priorización

Calcular:

```text
Nivel de Riesgo = Probabilidad x Impacto
```

Clasificación:

| Puntaje | Nivel |
|----------|---------|
| 1-5 | Bajo |
| 6-15 | Medio |
| 16-25 | Alto |

---

# Paso 3: Zonas Seguras y Evacuación

## Objetivo

Definir cómo actuar ante distintos escenarios.

## Tabla

| Emergencia | Lugar Seguro | Ruta Evacuación | Zona Segura | Punto Encuentro |
|------------|-------------|----------------|-------------|----------------|
| Sismo | | | | |
| Incendio | | | | |
| Tsunami | | | | |
| Inundación | | | | |
| Fuga de Gas | | | | |

---

## Configuración

### Lugar Seguro

Ejemplos:

- Comedor.
- Patio.
- Plaza cercana.
- Zona de seguridad oficial.

### Ruta de Evacuación

```text
Dormitorio
→ Pasillo
→ Puerta Principal
→ Zona Segura
```

### Punto de Encuentro

- Casa familiar.
- Escuela.
- Plaza.
- Centro comunitario.
- Dirección personalizada.

---

# Paso 4: Mapa de la Vivienda

## Objetivo

Representar visualmente la vivienda.

---

## Funcionalidad

Editor visual tipo drag & drop.

### Elementos

- Dormitorio.
- Cocina.
- Baño.
- Comedor.
- Living.
- Patio.
- Escaleras.
- Estacionamiento.

---

## Elementos de Emergencia

Ubicar:

- Tablero eléctrico.
- Llave de agua.
- Llave de gas.
- Extintor.
- Botiquín.
- Kit de emergencia.
- Radio.
- Linterna.

---

## Capas Visuales

### Verde

```text
Lugar Seguro
```

### Rojo

```text
Zona de Riesgo
```

### Azul

```text
Ruta de Evacuación
```

---

# Paso 5: Roles y Responsabilidades

## Objetivo

Asignar tareas específicas.

## Tabla

| Tarea | Responsable |
|---------|---------|
| Cortar electricidad | |
| Cerrar gas | |
| Cerrar agua | |
| Llevar kit emergencia | |
| Asistir personas vulnerables | |
| Llamar emergencias | |
| Contactar familiares | |
| Cuidar mascotas | |

---

## Reglas

- Una persona puede asumir múltiples tareas.
- Las tareas deben ser acordes a las capacidades del integrante.

---

# Paso 6: Directorio de Emergencia

## Objetivo

Centralizar información crítica.

---

## Emergencias Nacionales (Chile)

| Servicio | Número |
|-----------|----------|
| Ambulancia | 131 |
| Bomberos | 132 |
| Carabineros | 133 |
| PDI | 134 |
| CONAF | 130 |
| SERNAMEG | 1455 |

---

## Contactos Familiares

```json
{
  "nombre": "",
  "telefono": "",
  "direccion": "",
  "tipo": "familiar"
}
```

---

## Instituciones

```json
{
  "nombre": "",
  "telefono": "",
  "direccion": "",
  "tipo": "institucion"
}
```

Ejemplos:

- Municipalidad.
- Hospital.
- CESFAM.
- Escuela.
- Compañía eléctrica.
- Compañía de agua.
- Compañía de gas.

---

# Paso 7: Kit de Emergencia

## Objetivo

Garantizar autonomía durante 72 horas.

---

## Checklist Base

### Agua

- 2 litros por persona por día.

### Alimentos

- Barras energéticas.
- Conservas.
- Alimentos deshidratados.
- Tetrapack.

### Equipamiento

- Linterna.
- Radio portátil.
- Pilas.
- Dinero efectivo.
- Abrelatas.

### Higiene

- Alcohol gel.
- Papel higiénico.
- Toallas absorbentes.
- Bolsas de basura.
- Mascarillas.

### Documentos

- Identificaciones.
- Escrituras.
- Contratos.
- Certificados.

### Salud

- Medicamentos.
- Botiquín.
- Recetas médicas.

### Otros

- Copia del plan.
- Llaves de la vivienda.

---

## Kit para Lactantes

- Pañales.
- Fórmula.
- Mamaderas.
- Toallas húmedas.
- Ropa adicional.

---

## Kit para Embarazadas

- Controles médicos.
- Exámenes.
- Vitaminas.
- Contactos médicos.

---

## Kit para Personas TEA

- Credencial.
- Información de contacto.
- Objetos reguladores.
- Elementos de calma.

---

## Kit para Mascotas

### Documentos

- Carnet veterinario.
- Registro nacional.
- Prescripciones.

### Alimentación

- Agua.
- Alimento.

### Implementos

- Correa.
- Arnés.
- Jaula.
- Canil.
- Frazada.

### Primeros Auxilios

- Gasas.
- Suero.
- Medicamentos.

---

# Paso 8: Simulación y Mejora Continua

## Objetivo

Validar el funcionamiento del plan.

---

## Registro de Simulacros

```json
{
  "fecha": "",
  "tipo_emergencia": "",
  "resultado": "",
  "mejoras": []
}
```

---

## Evaluación

Preguntas:

- ¿Todos conocían la ruta?
- ¿Se encontró rápidamente el kit?
- ¿Se logró evacuar?
- ¿Se protegieron las mascotas?
- ¿Funcionaron los roles asignados?
- ¿Qué se debe mejorar?

---

# Resumen Final

## Generación PDF

El sistema debe generar automáticamente:

1. Información familiar.
2. Amenazas identificadas.
3. Matriz de riesgos.
4. Protocolos de emergencia.
5. Mapa de vivienda.
6. Roles.
7. Directorio.
8. Kit de emergencia.
9. Historial de simulacros.

---

# Modelo de Datos

```json
{
  "familia": [],
  "mascotas": [],
  "amenazas": [],
  "zonasSeguras": [],
  "mapa": {},
  "roles": [],
  "contactos": [],
  "kitEmergencia": {},
  "simulacros": []
}
```

---

# Roadmap de Implementación

## MVP

- Wizard de 8 pasos.
- Guardado automático.
- Responsive móvil.
- Exportar PDF.

## Versión 2

- Recordatorios automáticos.
- Actualización anual.
- Compartir plan.

## Versión 3

- Integración con mapas.
- Geolocalización.
- Riesgos según ubicación.
- Alertas SENAPRED.
- Notificaciones push.