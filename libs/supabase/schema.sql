-- Crear tipo enum para generaciones (opcional, pero útil)
CREATE TYPE pokemon_generation AS ENUM (
    'generation-i',
    'generation-ii', 
    'generation-iii',
    'generation-iv',
    'generation-v',
    'generation-vi',
    'generation-vii',
    'generation-viii',
    'generation-ix'
);

-- Crear la tabla principal de Pokémon
CREATE TABLE pokemon (
    -- Identificadores
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    
    -- Datos básicos
    tipos TEXT[] NOT NULL, -- Array de textos: {'grass','poison'}
    peso INTEGER NOT NULL, -- en hectogramos
    altura INTEGER NOT NULL, -- en decímetros
    habilidades TEXT[] NOT NULL, -- Array de habilidades
    
    -- Estadísticas
    estadisticas JSONB NOT NULL, -- Objeto con hp, attack, defense, etc.
    
    -- Imágenes
    imagen_url TEXT NOT NULL,
    
    -- Datos de especie
    color TEXT,
    generacion pokemon_generation,
    especie_descripcion TEXT,
    habitat TEXT,
    
    -- Clasificación
    es_legendario BOOLEAN DEFAULT false,
    es_mitico BOOLEAN DEFAULT false,
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Índices para búsquedas rápidas
    CONSTRAINT tipos_check CHECK (array_length(tipos, 1) > 0)
);

-- Crear índices para búsquedas comunes
CREATE INDEX idx_pokemon_nombre ON pokemon (nombre);
CREATE INDEX idx_pokemon_numero ON pokemon (numero_pokedex);
CREATE INDEX idx_pokemon_tipos ON pokemon USING GIN (tipos);
CREATE INDEX idx_pokemon_generacion ON pokemon (generacion);
CREATE INDEX idx_pokemon_color ON pokemon (color);
CREATE INDEX idx_pokemon_habitat ON pokemon (habitat);

-- Índice GIN para búsqueda en JSON de estadísticas
CREATE INDEX idx_pokemon_estadisticas ON pokemon USING GIN (estadisticas); 

-- Habilitar RLS en todas las tablas
ALTER TABLE pokemon ENABLE ROW LEVEL SECURITY;

-- Políticas para pokemon (tabla principal)

-- 1. Lectura: CUALQUIERA puede leer los datos de Pokémon
CREATE POLICY "Cualquiera puede ver Pokémon"
    ON pokemon
    FOR SELECT
    USING (true);

-- 2. Inserción/Actualización: Solo usuarios autenticados con rol específico
CREATE POLICY "Solo admins pueden modificar Pokémon"
    ON pokemon
    FOR ALL
    USING (
        auth.role() = 'authenticated' AND 
        auth.jwt() ->> 'role' = 'admin'
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND 
        auth.jwt() ->> 'role' = 'admin'
    );
