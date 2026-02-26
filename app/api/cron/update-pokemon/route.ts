import { createClient } from '@/libs/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface PokemonUpdateResult {
  id: number;
  status: 'success' | 'error';
}

interface PokemonData {
  id: number;
  nombre: string;
  numero_pokedex: number;
  tipos: string[];
  peso: number;
  altura: number;
  habilidades: string[];
  estadisticas: Record<string, number>;
  imagen_url: string;
  color?: string;
  generacion?: string;
}

// Configurar el cron job (se ejecuta cada 10 minutos = 144 veces al día)
export const maxDuration = 60; // Máximo 60 segundos
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verificar autenticación del cron (seguridad)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = await createClient();
  
  try {
    // 1. Obtener próximo Pokémon a actualizar
    const { data: pendingPokemon, error: pendingError } = await supabase
      .from('pokemon_update_queue')
      .select('pokemon_id')
      .eq('status', 'pending')
      .order('last_attempt', { ascending: true })
      .limit(5) // Actualizar 5 por ejecución para llegar a 150/día
      .is('locked_until', null)
      .limit(5);
    
    if (pendingError) throw pendingError;
    
    if (!pendingPokemon || pendingPokemon.length === 0) {
      return NextResponse.json({ message: 'No hay Pokémon pendientes' });
    }

    // 2. Bloquear estos Pokémon para evitar duplicados
    const pokemonIds = pendingPokemon.map((p: { pokemon_id: number }) => p.pokemon_id);
    await supabase
      .from('pokemon_update_queue')
      .update({ 
        locked_until: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        last_attempt: new Date().toISOString()
      })
      .in('pokemon_id', pokemonIds);

    // 3. Actualizar cada Pokémon
    const results: PokemonUpdateResult[] = [];
    for (const item of pendingPokemon) {
      try {
        // Llamar a PokéAPI
        const pokemonData = await fetchPokemonFromAPI(item.pokemon_id);
        
        // Actualizar en Supabase
        const { error: updateError } = await supabase
          .from('pokemon')
          .upsert(pokemonData)
          .eq('id', item.pokemon_id);
        
        if (updateError) throw updateError;
        
        // Marcar como completado
        await supabase
          .from('pokemon_update_queue')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            locked_until: null
          })
          .eq('pokemon_id', item.pokemon_id);
        
        results.push({ id: item.pokemon_id, status: 'success' });
        
      } catch (error) {
        console.error(`Error actualizando #${item.pokemon_id}:`, error instanceof Error ? error.message : 'Error desconocido');
        
        // Marcar para reintento (obtener el error_count actual e incrementarlo)
        const { data: current } = await supabase
          .from('pokemon_update_queue')
          .select('error_count')
          .eq('pokemon_id', item.pokemon_id)
          .single();

        await supabase
          .from('pokemon_update_queue')
          .update({ 
            status: 'pending',
            locked_until: null,
            error_count: (current?.error_count ?? 0) + 1
          })
          .eq('pokemon_id', item.pokemon_id);
        
        results.push({ id: item.pokemon_id, status: 'error' });
      }
    }
    
    return NextResponse.json({ 
      message: 'Actualización completada',
      results 
    });
    
  } catch (error) {
    console.error('Error en cron:', error instanceof Error ? error.message : 'Error desconocido');
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}

// Función helper para obtener datos de PokéAPI
async function fetchPokemonFromAPI(id: number): Promise<PokemonData> {
  const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const pokemonData = await pokemonResponse.json();
  
  const speciesResponse = await fetch(pokemonData.species.url);
  const speciesData = await speciesResponse.json();
  
  const pokemonDataFormatted: PokemonData = {
    id: pokemonData.id,
    nombre: pokemonData.name,
    numero_pokedex: pokemonData.id,
    tipos: pokemonData.types.map((t: any) => t.type.name),
    peso: pokemonData.weight,
    altura: pokemonData.height,
    habilidades: pokemonData.abilities.map((a: any) => a.ability.name),
    estadisticas: pokemonData.stats.reduce((acc: Record<string, number>, s: any) => {
      acc[s.stat.name] = s.base_stat;
      return acc;
    }, {}),
    imagen_url: pokemonData.sprites.other['official-artwork'].front_default,
    color: speciesData.color?.name,
    generacion: speciesData.generation?.name
  };
  
  return pokemonDataFormatted;
}