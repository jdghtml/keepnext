# Documentación de la API (KeepNext)

Este proyecto incluye un módulo de API reutilizable diseñado para interactuar con servicios RESTful y, específicamente, con Supabase. Esta arquitectura desacoplada permite utilizar el mismo cliente en otros proyectos JavaScript sin dependencias de frameworks.

## Estructura de Archivos

- `js/api.js`: Cliente REST genérico (`RestClient`).
- `js/supabase-client.js`: Cliente específico para Supabase (`SupabaseApi`) que extiende `RestClient`.
- `js/config.js`: Archivo de configuración para claves y URLs.

---

## 1. Cliente REST Genérico (`RestClient`)

La clase `RestClient` es un envoltorio ligero sobre `fetch` que maneja la configuración base, cabeceras y errores comunes.

### Inicialización

```javascript
import { RestClient } from './js/api.js';

const myApi = new RestClient('https://api.ejemplo.com/v1', {
    'Authorization': 'Bearer MI_TOKEN'
});
```

### Métodos Disponibles

Todos los métodos son asíncronos y devuelven una Promesa con la respuesta JSON parseada.

#### GET
Recuperar recursos.

```javascript
// GET https://api.ejemplo.com/v1/users
const users = await myApi.get('/users');
```

#### POST
Crear recursos.

```javascript
const newUser = { name: 'Juan', email: 'juan@test.com' };
const created = await myApi.post('/users', newUser);
```

#### PUT
Actualizar recursos completos.

```javascript
const updatedUser = { name: 'Juan Perez', email: 'juan@test.com' };
await myApi.put('/users/123', updatedUser);
```

#### PATCH
Actualizar recursos parcialmente.

```javascript
await myApi.patch('/users/123', { name: 'Juan Perez' });
```

#### DELETE
Eliminar recursos.

```javascript
await myApi.delete('/users/123');
```

### Manejo de Cabeceras

Puedes actualizar las cabeceras dinámicamente (por ejemplo, tras un login):

```javascript
myApi.setHeaders({
    'Authorization': 'Bearer NUEVO_TOKEN'
});
```

---

## 2. Cliente Supabase (`SupabaseApi`)

La clase `SupabaseApi` extiende `RestClient` y está preconfigurada para trabajar con la API REST de Supabase (PostgREST).

### Inicialización

El proyecto ya exporta una instancia lista para usar llamada `db` en `js/supabase-client.js`.

```javascript
import { db } from './js/supabase-client.js';
```

Si quieres instanciarla manualmente en otro proyecto:

```javascript
import { SupabaseApi } from './js/supabase-client.js';
// Asegúrate de tener CONFIG configurado en js/config.js
const db = new SupabaseApi();
```

### Operaciones CRUD

El cliente simplifica las operaciones estándar de Supabase.

#### Leer Datos (`getAll`)

```javascript
// Obtener todos los items
const items = await db.getAll('items');

// Con filtros y orden (usando sintaxis de PostgREST)
// Ejemplo: items de la categoría '123', ordenados por fecha
const filtered = await db.getAll('items', 'category_id=eq.123&order=created_at.desc');
```

#### Leer un Registro (`getById`)

```javascript
const item = await db.getById('items', 'uuid-del-item');
```

#### Crear Registro (`create`)

```javascript
const newItem = {
    title: 'Inception',
    rating: 5
};
const saved = await db.create('items', newItem);
console.log(saved); // Devuelve el objeto creado con su ID
```

#### Actualizar Registro (`update`)

```javascript
const updates = { rating: 4 };
const updated = await db.update('items', 'uuid-del-item', updates);
```

#### Eliminar Registro (`deleteById`)

```javascript
await db.deleteById('items', 'uuid-del-item');
```

### Autenticación

Para operaciones que requieren que el usuario esté logueado (RLS - Row Level Security), debes establecer el token de acceso del usuario.

```javascript
// Al iniciar sesión (ejemplo con Supabase Auth)
const { data: { session } } = await supabase.auth.getSession();

if (session) {
    db.setAuthToken(session.access_token);
}
```

---

## Ejemplo Completo de Integración

Aquí tienes un ejemplo de cómo usarías este módulo en un archivo `main.js` de otro proyecto:

```javascript
import { db } from './js/supabase-client.js';

async function loadMovies() {
    try {
        // 1. Obtener películas
        const movies = await db.getAll('movies', 'genre=eq.SciFi');
        
        // 2. Renderizar
        movies.forEach(movie => {
            console.log(`Peli: ${movie.title} - ${movie.year}`);
        });
        
    } catch (error) {
        console.error('Error cargando películas:', error);
    }
}

async function addNewMovie(title) {
    try {
        const newMovie = await db.create('movies', { 
            title: title, 
            watched: false 
        });
        console.log('Película guardada:', newMovie.id);
    } catch (error) {
        alert('Error al guardar');
    }
}
```
