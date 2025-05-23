
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

interface RequestData {
  bookId: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Get data from request body
    const { bookId } = await req.json() as RequestData;

    if (!bookId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all chunks for this book
    const { data: chunks, error: chunksError } = await supabaseClient
      .from('chunks')
      .select('*')
      .eq('book_id', bookId)
      .order('chunk_number', { ascending: true });
      
    if (chunksError) {
      throw new Error(chunksError.message);
    }
    
    // Reset all chunks to processing state
    const chunkPromises = chunks.map(chunk => {
      return supabaseClient
        .from('chunks')
        .update({ status: 'processing' })
        .eq('id', chunk.id);
    });
    
    await Promise.all(chunkPromises);
    
    // Process chunks sequentially (in real life this might be done in a queue)
    for (const chunk of chunks) {
      // Simulate audio generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update with new audio URL
      const simulatedAudioUrl = `https://mnggqmkkeknclrmyifmt.supabase.co/storage/v1/object/public/books/regenerated_audio_${bookId}_chunk_${chunk.chunk_number}.mp3?t=${Date.now()}`;
      
      await supabaseClient
        .from('chunks')
        .update({ 
          audio_url: simulatedAudioUrl,
          status: 'completed'
        })
        .eq('id', chunk.id);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Audio regeneration completed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error regenerating audio:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
