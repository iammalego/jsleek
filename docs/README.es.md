<p align="center">
  <a href="../README.md">English</a> · <strong>Español</strong>
</p>

<h1 align="center">jsleek</h1>
<p align="center"><em>— sleek JSON encoding para pipelines de LLM —</em></p>
<p align="center"><sub><b>S</b>chema-<b>L</b>inked <b>E</b>fficient <b>E</b>ncoding <b>K</b>it</sub></p>

<p align="center">
  <a href="https://www.npmjs.com/package/jsleek"><img src="https://img.shields.io/badge/version-0.1.0-blue" alt="npm version"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/jsleek" alt="node version"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/npm/l/jsleek" alt="license"></a>
  <a href="https://github.com/iammalego/jsleek/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/iammalego/jsleek/ci.yml?label=CI" alt="CI"></a>
  <a href="https://bundlephobia.com/package/jsleek"><img src="https://img.shields.io/bundlephobia/minzip/jsleek?label=size" alt="bundle size"></a>
</p>

> La misma información, menos tokens. `jsleek` comprime cualquier payload JSON hasta un 73 % antes de que llegue a tu LLM — medido contra APIs públicas reales. Sin pérdida por defecto, cero dependencias, nunca lanza excepciones.

`jsleek` toma una cadena JSON y devuelve una cadena JSON más pequeña que conserva la misma información. Funciona sobre cualquier JSON: respuestas de APIs, volcados de bases de datos, payloads de logs, salida de herramientas MCP, etc. Es sin pérdida por defecto, no tiene dependencias en tiempo de ejecución y **nunca lanza excepciones**.

```ts
import { compact } from 'jsleek';

const compressed = compact(anyJsonString);
// → misma información semántica, menos tokens
```

## Características

- **Sin pérdida por defecto** — cero pérdida de datos salvo que actives `entropyThreshold > 0` o `maxItems`.
- **Deduplicación de esquemas** — los arrays uniformes de objetos se colapsan a un formato columnar compacto `_schema` + `_rows`.
- **Extracción de constantes** — las columnas donde todas las filas comparten el mismo valor se elevan a `_const`.
- **Eliminación de infraestructura** — descarta campos sin valor semántico: `etag`, `request_id`, `__typename`, `_links`, `__v` y metadatos con forma de URL.
- **Desanidado** — colapsa envolturas de una sola clave como `{ data: { users: [...] } }` hasta dejar el payload directo.
- **Seguro por diseño** — devuelve la entrada original ante cualquier fallo o cuando la salida no es más pequeña.
- **Cero dependencias** — ~2 kB minzipped, build dual ESM + CJS, tipos TypeScript incluidos.
- **Componible** — usa `compact()` como one-liner o combina transforms individuales con `pipeline()`.

## Instalación

```bash
npm install jsleek
```

## Uso básico

```ts
import { compact } from 'jsleek';

const raw = await fetch('/api/users').then((r) => r.text());
const compressed = compact(raw);

// pasa `compressed` a cualquier LLM, archivo, petición de red, lo que necesites
```

La entrada y la salida son ambas **cadenas** JSON. `compact()` nunca lanza una excepción: ante un JSON inválido, un error en un transform o cuando la salida no sería más pequeña que la entrada, devuelve la cadena original intacta.

## Un ejemplo más grande — reducción de esquema

Esta es una respuesta típica de API: una lista paginada de seis usuarios envuelta en `data`, con enlaces de paginación, metadatos de la petición y campos de infraestructura por ítem (`_id`, `etag`, `__v`).

**Antes (1.584 bytes)**

```json
{
  "data": {
    "users": [
      {
        "id": 101,
        "name": "Alice Johnson",
        "email": "alice@acme.com",
        "role": "member",
        "plan": "pro",
        "active": true,
        "createdAt": "2024-03-01T10:00:00Z",
        "updatedAt": "2024-04-15T14:22:00Z",
        "_id": "65f3a1b2c4d5e6f7a8b9c0d1",
        "etag": "W/\"ab001\"",
        "__v": 0
      },
      {
        "id": 102,
        "name": "Bob Smith",
        "email": "bob@acme.com",
        "role": "member",
        "plan": "pro",
        "active": true,
        "createdAt": "2024-03-02T11:30:00Z",
        "updatedAt": "2024-04-10T09:15:00Z",
        "_id": "65f3a1b2c4d5e6f7a8b9c0d2",
        "etag": "W/\"ab002\"",
        "__v": 0
      },
      {
        "id": 103,
        "name": "Carol Chen",
        "email": "carol@acme.com",
        "role": "member",
        "plan": "pro",
        "active": true,
        "createdAt": "2024-03-03T09:45:00Z",
        "updatedAt": "2024-04-12T16:40:00Z",
        "_id": "65f3a1b2c4d5e6f7a8b9c0d3",
        "etag": "W/\"ab003\"",
        "__v": 0
      },
      {
        "id": 104,
        "name": "David Park",
        "email": "david@acme.com",
        "role": "member",
        "plan": "pro",
        "active": true,
        "createdAt": "2024-03-04T13:20:00Z",
        "updatedAt": "2024-04-14T12:05:00Z",
        "_id": "65f3a1b2c4d5e6f7a8b9c0d4",
        "etag": "W/\"ab004\"",
        "__v": 0
      },
      {
        "id": 105,
        "name": "Eva Martinez",
        "email": "eva@acme.com",
        "role": "member",
        "plan": "pro",
        "active": true,
        "createdAt": "2024-03-05T15:10:00Z",
        "updatedAt": "2024-04-13T10:30:00Z",
        "_id": "65f3a1b2c4d5e6f7a8b9c0d5",
        "etag": "W/\"ab005\"",
        "__v": 0
      },
      {
        "id": 106,
        "name": "Frank Weber",
        "email": "frank@acme.com",
        "role": "member",
        "plan": "pro",
        "active": true,
        "createdAt": "2024-03-06T08:55:00Z",
        "updatedAt": "2024-04-11T13:45:00Z",
        "_id": "65f3a1b2c4d5e6f7a8b9c0d6",
        "etag": "W/\"ab006\"",
        "__v": 0
      }
    ]
  },
  "meta": { "request_id": "req-xyz-123", "trace_id": "trace-abc-456", "server_time": 1712345678 },
  "_links": { "self": { "href": "/api/v2/users?page=1" }, "next": { "href": "/api/v2/users?page=2" } }
}
```

**Después de `compact(raw)` (865 bytes, −45,4 %, completamente sin pérdida)**

```json
{
  "data": {
    "_const": { "active": true, "plan": "pro", "role": "member" },
    "_schema": ["_id", "createdAt", "email", "id", "name", "updatedAt"],
    "_rows": [
      ["65f3a1b2c4d5e6f7a8b9c0d1", "2024-03-01T10:00:00Z", "alice@acme.com", 101, "Alice Johnson",   "2024-04-15T14:22:00Z"],
      ["65f3a1b2c4d5e6f7a8b9c0d2", "2024-03-02T11:30:00Z", "bob@acme.com",   102, "Bob Smith",       "2024-04-10T09:15:00Z"],
      ["65f3a1b2c4d5e6f7a8b9c0d3", "2024-03-03T09:45:00Z", "carol@acme.com", 103, "Carol Chen",      "2024-04-12T16:40:00Z"],
      ["65f3a1b2c4d5e6f7a8b9c0d4", "2024-03-04T13:20:00Z", "david@acme.com", 104, "David Park",      "2024-04-14T12:05:00Z"],
      ["65f3a1b2c4d5e6f7a8b9c0d5", "2024-03-05T15:10:00Z", "eva@acme.com",   105, "Eva Martinez",    "2024-04-13T10:30:00Z"],
      ["65f3a1b2c4d5e6f7a8b9c0d6", "2024-03-06T08:55:00Z", "frank@acme.com", 106, "Frank Weber",     "2024-04-11T13:45:00Z"]
    ],
    "_note": "Cada entrada de _rows mapea posicionalmente a _schema"
  },
  "meta": 1712345678
}
```

Lo que hizo el pipeline, en orden:

1. **Eliminó** `_links`, `etag`, `__v`, `request_id` y `trace_id` — no aportan información que el modelo necesite.
2. **Desanidó** `meta: { server_time: ... }` hasta el valor escalar, una vez que los campos hermanos fueron eliminados.
3. **Deduplicó** los seis objetos de usuario en `_schema` + `_rows` — los nombres de los campos se escriben una sola vez, no seis.
4. **Elevó** `active`, `plan` y `role` a `_const` porque todas las filas tenían el mismo valor.
5. **Truncó** nada — `maxItems` por defecto es `Infinity`.

El LLM sigue viendo cada usuario, cada campo y cada valor. Solo los lee en una forma más densa.

## Dónde brilla

`jsleek` funciona sobre cualquier JSON, pero rinde al máximo cuando un payload JSON está a punto de serializarse dentro de un prompt para un LLM:

- **Servidores MCP** — envuelve el JSON que devuelven los handlers de herramientas para que el modelo reciba señal en lugar de boilerplate.
- **Agentes de IA con tool calling** — comprime los resultados de las herramientas antes de que entren en la conversación.
- **Pipelines RAG** que consultan APIs REST antes de alimentar al modelo.
- **Preprocesamiento de prompts** para cualquier integración LLM sobre CRM, ticketing, analítica, e-commerce o sistemas de logs.

Cuantas más filas, más estructura compartida y más boilerplate haya, mayor es el ahorro.

## Integración con MCP

```ts
import { compact } from 'jsleek';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const listUsersTool: Tool = {
  name: 'list_users',
  description: 'Lista los usuarios del directorio',
  handler: async () => {
    const res = await fetch('https://api.example.com/v2/users');
    const body = await res.text();
    return { content: [{ type: 'text', text: compact(body) }] };
  },
};
```

Eso es toda la integración. El mismo patrón para cada herramienta que devuelve datos estructurados.

## Cómo funciona

`compact()` ejecuta un pipeline fijo de cinco pasos dentro de un wrapper de seguridad. Los pasos se ejecutan en orden; cada uno es una función exportada que puedes importar y usar por separado.

1. **`stripInfrastructure`** — elimina campos sin carga semántica: `etag`, `request_id`, `__typename`, `_links`, `__v`, objetos cursor y metadatos con forma de URL. Guiado por una lista permitida.
2. **`unwrapNested`** — colapsa objetos y arrays envolventes de una sola clave. `{ data: { users: [...] } }` se convierte en `[...]`.
3. **`deduplicate`** — convierte arrays de objetos uniformes al formato columnar `{ _schema, _rows }`.
4. **`extractConstants`** — eleva a `_const` las columnas donde todas las filas comparten el mismo valor. Sin pérdida cuando `entropyThreshold: 0` (predeterminado); con pérdida en caso contrario.
5. **`truncateArrays`** — limita la longitud del array y añade metadatos `_total` / `_kept` / `_truncated`. No hace nada cuando `maxItems: Infinity` (predeterminado).

Cuando el pipeline termina, el wrapper de seguridad compara la longitud de la entrada y la salida. Si la salida no es más pequeña, o si algún paso lanzó un error, devuelve la cadena original.

## Benchmarks

Medidos contra APIs públicas reales — cada respuesta fue descargada con `curl`, minificada, y procesada con la llamada `compact()` por defecto (sin pérdida). La tabla está ordenada de mejor a peor compresión.

| API                            | Ítems | Entrada | Salida  | Reducción   |
| ------------------------------ | ----- | ------- | ------- | ----------- |
| GitHub `/search/users`         |   100 |  96 kB  |  26 kB  | **−73,4 %** |
| CoinGecko `/coins/markets`     |   250 | 195 kB  |  74 kB  | **−62,1 %** |
| USGS Earthquakes (GeoJSON)     |   608 | 431 kB  | 304 kB  | **−29,5 %** |
| RestCountries `/all`           |   250 | 105 kB  |  77 kB  | **−27,4 %** |
| RandomUser `/?results=500`     |   500 | 539 kB  | 395 kB  | **−26,7 %** |
| TV Maze `/shows`               |   240 | 373 kB  | 276 kB  | **−26,0 %** |
| JSONPlaceholder `/photos`      | 5.000 | 891 kB  | 672 kB  | **−24,7 %** |
| JSONPlaceholder `/comments`    |   500 | 140 kB  | 122 kB  | **−12,8 %** |

**Agregado: 2,7 MB → 1,9 MB sobre 7.448 registros de 8 APIs distintas (−30 % promedio, completamente sin pérdida).**

Las mayores ganancias vienen de arrays uniformes con muchos campos compartidos. Los objetos de usuario de GitHub llevan más de 13 campos con forma de URL por registro que la heurística de URLs de jsleek recorta agresivamente, explicando el 73,4 %. Las 250 filas uniformes de CoinGecko con 25 claves compartidas son un caso de libro para la deduplicación. Las ganancias menores (photos, comments) reflejan payloads dominados por texto libre, donde la única palanca disponible es la deduplicación de claves. El modo con pérdida (`entropyThreshold > 0`) añade entre 1 y 6 puntos porcentuales en la mayoría de los casos; el wrapper de seguridad vuelve automáticamente a la salida sin pérdida cuando el pipeline con pérdida produciría una cadena más larga.

## Sin pérdida por defecto

| Opción             | Predeterminado | Efecto sobre la pérdida de datos                  |
| ------------------ | -------------- | ------------------------------------------------- |
| `maxItems`         | `Infinity`     | Los arrays nunca se truncan.                      |
| `entropyThreshold` | `0`            | Solo se extraen columnas con valores idénticos.   |

Establecer `entropyThreshold > 0` activa un **modo con pérdida** opcional: las columnas cuya tasa de valores únicos cae por debajo del umbral se colapsan a un único valor representativo. Útil cuando estás dispuesto a sacrificar algo de fidelidad a cambio de tamaño.

## Pipeline personalizado

`pipeline()` ejecuta los transforms que le indiques, en el orden en el que los indiques:

```ts
import { pipeline, stripInfrastructure, deduplicate } from 'jsleek';

const result = pipeline(json, [stripInfrastructure, deduplicate], {
  deduplicateMinItems: 3,
  omitNotes: true,
});
```

El orden importa: `deduplicate` debe ejecutarse antes que `extractConstants`, y `truncateArrays` debe ir al final para que sus metadatos reflejen la forma definitiva.

También puedes escribir tu propio transform:

```ts
import { pipeline, stripInfrastructure, deduplicate } from 'jsleek';
import type { Transform } from 'jsleek';

const dropSecrets: Transform = (node) => {
  // elimina cualquier campo cuyo nombre parezca un secreto
  return node;
};

const result = pipeline(json, [stripInfrastructure, dropSecrets, deduplicate]);
```

## Referencia de opciones

| Opción                 | Tipo                          | Predeterminado  | Descripción                                              |
| ---------------------- | ----------------------------- | --------------- | -------------------------------------------------------- |
| `minInputLength`       | `number`                      | `100`           | Omitir compresión para entradas cortas.                  |
| `keepFields`           | `string[]`                    | `[]`            | Conservar estos campos obligatoriamente.                 |
| `dropFields`           | `string[]`                    | `[]`            | Eliminar estos campos obligatoriamente.                  |
| `maxItems`             | `number`                      | `Infinity`      | Máximo de ítems en arrays (sin pérdida por defecto).     |
| `sampleMethod`         | `'first' \| 'statistical'`    | `'statistical'` | Método de muestreo al truncar.                           |
| `entropyThreshold`     | `number`                      | `0`             | Extraer constantes cuando uniqueRatio ≤ este valor.      |
| `deduplicateMinItems`  | `number`                      | `5`             | Tamaño mínimo del array para intentar deduplicar.        |
| `deduplicateMinRatio`  | `number`                      | `0.70`          | Fracción mínima de ítems con el mismo conjunto de claves.|
| `omitNotes`            | `boolean`                     | `false`         | Suprimir los campos `_note` en la salida.                |
| `maxUnwrapDepth`       | `number`                      | `20`            | Profundidad máxima para desanidar envolturas.            |

## Formas de salida

Estos ejemplos usan tamaños realistas para que la compresión se note. Para entradas por debajo de `minInputLength` (100 bytes por defecto) o por debajo de `deduplicateMinItems` (5 por defecto), el wrapper de seguridad devuelve la entrada intacta — `jsleek` nunca genera un payload más grande.

### Arrays deduplicados — `_schema` / `_rows`

Un array uniforme de objetos colapsa a una forma columnar: los nombres de los campos aparecen una sola vez; los valores se emiten por fila.

**Entrada** (612 bytes)

```json
[
  { "id": 1, "name": "Alice", "email": "alice@acme.com", "joinedAt": "2024-01-10" },
  { "id": 2, "name": "Bob",   "email": "bob@acme.com",   "joinedAt": "2024-01-11" },
  { "id": 3, "name": "Carol", "email": "carol@acme.com", "joinedAt": "2024-01-12" },
  { "id": 4, "name": "David", "email": "david@acme.com", "joinedAt": "2024-01-13" },
  { "id": 5, "name": "Eva",   "email": "eva@acme.com",   "joinedAt": "2024-01-14" },
  { "id": 6, "name": "Frank", "email": "frank@acme.com", "joinedAt": "2024-01-15" }
]
```

**Salida** (354 bytes, −42,2 %)

```json
{
  "_schema": ["email", "id", "joinedAt", "name"],
  "_rows": [
    ["alice@acme.com", 1, "2024-01-10", "Alice"],
    ["bob@acme.com",   2, "2024-01-11", "Bob"],
    ["carol@acme.com", 3, "2024-01-12", "Carol"],
    ["david@acme.com", 4, "2024-01-13", "David"],
    ["eva@acme.com",   5, "2024-01-14", "Eva"],
    ["frank@acme.com", 6, "2024-01-15", "Frank"]
  ],
  "_note": "Cada entrada de _rows mapea posicionalmente a _schema"
}
```

### Constantes extraídas — `_const`

Las columnas en las que todas las filas tienen el mismo valor se elevan fuera de `_rows`.

**Entrada** (564 bytes)

```json
[
  { "id": 1, "name": "Alice", "email": "alice@acme.com", "role": "member" },
  { "id": 2, "name": "Bob",   "email": "bob@acme.com",   "role": "member" },
  { "id": 3, "name": "Carol", "email": "carol@acme.com", "role": "member" },
  { "id": 4, "name": "David", "email": "david@acme.com", "role": "member" },
  { "id": 5, "name": "Eva",   "email": "eva@acme.com",   "role": "member" },
  { "id": 6, "name": "Frank", "email": "frank@acme.com", "role": "member" }
]
```

**Salida** (292 bytes, −48,2 %)

```json
{
  "_const": { "role": "member" },
  "_schema": ["email", "id", "name"],
  "_rows": [
    ["alice@acme.com", 1, "Alice"],
    ["bob@acme.com",   2, "Bob"],
    ["carol@acme.com", 3, "Carol"],
    ["david@acme.com", 4, "David"],
    ["eva@acme.com",   5, "Eva"],
    ["frank@acme.com", 6, "Frank"]
  ]
}
```

### Metadatos de truncado — `_total` / `_kept` / `_truncated`

Cuando `maxItems` está definido (por defecto es `Infinity`), los arrays truncados reciben metadatos hermanos para que el LLM sepa qué quedó afuera:

```json
{
  "items": [/* los N ítems conservados */],
  "_total": 1000,
  "_kept": 10,
  "_truncated": 990
}
```

## Preguntas frecuentes

**¿El LLM entiende realmente el formato `_schema`/`_rows`?**
Sí. Los LLM modernos (Claude, GPT-4/5, Gemini) lo leen de forma nativa sin pérdida de precisión en tareas posteriores. Acompañarlo con una línea en el prompt — *"los arrays pueden aparecer como `{_schema, _rows}` con mapeo posicional"* — lo vuelve prácticamente infalible.

**¿`compact()` es seguro para usar en producción?**
Sí. Nunca lanza excepciones y devuelve la cadena original ante cualquier fallo. No es necesario usar `try/catch`.

**¿Modifica mi entrada?**
No. `jsleek` parsea la entrada, transforma una copia en memoria y serializa una cadena nueva. La original queda intacta.

**¿Se puede usar fuera de flujos LLM?**
Sí. Es un compresor de JSON genérico. Los prompts de LLM son el caso de uso de mayor valor porque cada token tiene un coste económico, pero funciona igual de bien para logs, almacenamiento, transferencia por red o cualquier escenario donde el tamaño del JSON importe.

## Contribuir

Los reportes de errores y las solicitudes de nuevas funciones son bienvenidos — utiliza las [plantillas de issues](https://github.com/iammalego/jsleek/issues/new/choose). Para contribuciones de código, consulta [CONTRIBUTING.md](../CONTRIBUTING.md).

## Licencia

MIT — ver [LICENSE](../LICENSE).
