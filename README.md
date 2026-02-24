# Pokedle 🎮

Aplicación web tipo **Wordle** adaptada a la franquicia Pokémon, integrada con [PokeAPI](https://pokeapi.co/) para obtener datos en tiempo real.

## ¿Qué es Pokedle?

Adivina el **Pokémon diario** en un número limitado de intentos. Cada vez que introduces un Pokémon, el sistema te da pistas comparando sus atributos con el objetivo:

-   🔢 **Generación** — mayor, menor o igual
-   🔥 **Tipo(s)** — coincidencia parcial o total
-   🌿 **Hábitat / Color / Cadena de evolución** — coincidencia o no

El progreso diario **persiste al recargar** la página.

## Funcionalidades

### Usuarios no registrados
-   Juegan la partida diaria sin guardar resultados permanentes.

### Usuarios registrados
-   Perfil personal con estadísticas históricas (victorias, rachas).
-   Acceso al **ranking global** basado en tiempo y número de intentos.
-   **Historial**: desafíos de los últimos 5 días.

### Adicionales
-   **Blog / Foro**: sección social para comentar estrategias y compartir resultados.
-   **Integración técnica**: manejo eficiente de peticiones a PokeAPI para garantizar fluidez.

## Tech Stack

-   **Framework**: Next.js 15+ (App Router)
-   **Lenguaje**: TypeScript
-   **Base de datos / Auth**: Supabase
-   **API externa**: [PokeAPI](https://pokeapi.co/)
-   **Pagos**: Stripe
-   **Estilos**: TailwindCSS 4 + DaisyUI 5
-   **Email**: Resend

## Instalación

```bash
npm install
npm run dev
```

Copia `.env.example` a `.env.local` y rellena las variables de entorno necesarias (Supabase, Stripe, Resend).

## Equipo

Proyecto desarrollado para la asignatura **Ingeniería Web** — 3º G.I.I.
