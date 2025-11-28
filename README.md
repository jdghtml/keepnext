# KeepNext - Collection Manager

Una aplicación moderna y minimalista para gestionar tus colecciones de películas, libros y series. Construida con Vanilla JavaScript, CSS (Flexbox) y Supabase.

## Características

- 📋 **Gestión de Colecciones**: Crea categorías personalizadas y añade elementos.
- 🖱️ **Drag & Drop**: Organiza tus elementos arrastrando y soltando.
- 🔍 **Búsqueda Automática**: Integra APIs de OMDB y Google Books para autocompletar información.
- 🌓 **Modo Oscuro**: Interfaz adaptable a tus preferencias.
- ☁️ **Sincronización en la Nube**: Inicia sesión con Google para guardar tus datos en Supabase.
- 📊 **Estadísticas**: Visualiza la distribución de tu colección.
- 💾 **Exportar/Importar**: Realiza copias de seguridad en formato JSON.

## Configuración

Para que la aplicación funcione al 100% (especialmente la sincronización y búsqueda), necesitas configurar tus propias claves de API.

1.  **Configura las claves API:**
    *   Renombra `js/config.js.example` a `js/config.js` (si no existe, créalo).
    *   Edita `js/config.js` y añade tus claves:
        ```javascript
        export const CONFIG = {
            SUPABASE_URL: 'TU_URL_DE_SUPABASE',
            SUPABASE_KEY: 'TU_CLAVE_ANON_DE_SUPABASE',
            OMDB_API_KEY: 'TU_CLAVE_OMDB', // Opcional (Películas/Series)
            TMDB_API_KEY: 'TU_CLAVE_TMDB', // Opcional (Mejor calidad para Películas/Series)
            GOOGLE_BOOKS_API_KEY: 'TU_CLAVE_GOOGLE_BOOKS' // Opcional (Libros)
        };
        ```
    *   **TMDB**: Regístrate en [TheMovieDB](https://www.themoviedb.org/settings/api) para obtener una clave gratuita. Es mejor que OMDB porque tiene más imágenes y en español.

### Configuración de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/).
2. Ejecuta el siguiente SQL en el editor de SQL de Supabase para crear las tablas necesarias:

```sql
-- Tabla de Categorías
create table categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  icon text,
  order_index integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de Elementos
create table items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  category_id uuid references categories(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  rating integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Políticas de Seguridad (RLS)
alter table categories enable row level security;
alter table items enable row level security;

create policy "Users can view their own categories" on categories for select using (auth.uid() = user_id);
create policy "Users can insert their own categories" on categories for insert with check (auth.uid() = user_id);
create policy "Users can update their own categories" on categories for update using (auth.uid() = user_id);
create policy "Users can delete their own categories" on categories for delete using (auth.uid() = user_id);

create policy "Users can view their own items" on items for select using (auth.uid() = user_id);
create policy "Users can insert their own items" on items for insert with check (auth.uid() = user_id);
create policy "Users can update their own items" on items for update using (auth.uid() = user_id);
create policy "Users can delete their own items" on items for delete using (auth.uid() = user_id);
```

3. Habilita el proveedor de Google en Authentication > Providers.

### Configuración de Google OAuth (Paso a paso)

Para conseguir el **Client ID** y **Client Secret** que te pide Supabase:

1. Ve a la [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un nuevo proyecto (o selecciona uno existente).
3. Busca "APIs & Services" > "OAuth consent screen".
   - Selecciona **External** y dale a Crear.
   - Rellena el nombre de la app (ej: KeepNext) y los correos de soporte.
4. Ve a "Credentials" > "Create Credentials" > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: "Supabase Auth" (o lo que quieras).
   - **Authorized redirect URIs**: Aquí debes pegar la URL que te da Supabase en la página de configuración del proveedor (se parece a `https://<tu-proyecto>.supabase.co/auth/v1/callback`).
5. Dale a "Create".
6. Copia el **Client ID** y el **Client Secret** que aparecen.
7. Vuelve a Supabase y pégalos en la configuración de Google (Authentication > Providers > Google).
8. Guarda los cambios.

## Uso Local

Si no configuras Supabase, la aplicación funcionará en **Modo Local** usando `localStorage` del navegador. Tus datos no se sincronizarán entre dispositivos pero la funcionalidad básica estará disponible.

Como automatizar supabase:
1. ¿Qué es esto?
GitHub Actions es una herramienta gratuita de GitHub que permite ejecutar tareas automáticas. El archivo que creé (
.github/workflows/keep-alive.yml
) es una "receta" que le dice a GitHub:

Cuándo: "Ejecútate todos los días a las 00:00 UTC".
Qué: "Haz una pequeña petición (ping) a mi base de datos Supabase".
Al recibir esa petición diaria, Supabase ve que hay actividad y no "duerme" el proyecto.

2. Pasos para configurarlo
Supongo que ya tienes tu código subido a un repositorio en GitHub. Si no, primero debes subirlo.

Una vez tu código esté en GitHub:

Ve a tu repositorio en la web de GitHub.
Haz clic en la pestaña Settings (Configuración) que está arriba a la derecha (dentro de tu repositorio).
En el menú lateral izquierdo, busca la sección Secrets and variables y haz clic en Actions.
Verás un botón verde que dice New repository secret. Haz clic ahí.
Ahora tienes que crear dos "secretos" (variables ocultas para que nadie vea tus claves):
Primer Secreto:
Name: SUPABASE_URL
Secret: Pega aquí tu URL de Supabase (la misma que tienes en config.js).
Dale a "Add secret".
Segundo Secreto:
Name: SUPABASE_KEY
Secret: Pega aquí tu anon_key de Supabase.
Dale a "Add secret".
3. ¿Cómo sé si funciona?
Una vez configurado:

Ve a la pestaña Actions de tu repositorio.
Verás un flujo llamado "Supabase Keep Alive" en la lista de la izquierda.
Como está programado para las 00:00, al principio no verás nada. Pero puedes probarlo manualmente:
Haz clic en "Supabase Keep Alive".
Verás un botón a la derecha que dice Run workflow. Púlsalo.
En unos segundos aparecerá una ejecución en verde (✅ Success).
¡Y listo! A partir de ahora, GitHub despertará a tu base de datos una vez al día automáticamente.