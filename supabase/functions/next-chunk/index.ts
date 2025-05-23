
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

interface RequestData {
  bookId: string;
  currentChunk: number;
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
    const { bookId, currentChunk } = await req.json() as RequestData;

    if (!bookId || !currentChunk) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create next chunk if it doesn't exist yet
    const nextChunkNumber = currentChunk + 1;
    
    // Check if next chunk already exists
    const { data: existingChunk } = await supabaseClient
      .from('chunks')
      .select('*')
      .eq('book_id', bookId)
      .eq('chunk_number', nextChunkNumber)
      .single();
      
    if (!existingChunk) {
      // Insert new chunk
      await supabaseClient
        .from('chunks')
        .insert({
          book_id: bookId,
          chunk_number: nextChunkNumber,
          status: 'pending',
        });
      
      // Simulate extracting more text - in a real app we'd extract from PDF
      const sampleHindiText = "यह एक नया हिंदी अंश है जिसे हम स्वचालित रूप से उत्पन्न कर रहे हैं। इस अंश में कुछ अतिरिक्त हिंदी पाठ है जिसे हमने OCR द्वारा निकाला है। यह सिमुलेशन है कि वास्तव में PDF से अगले पन्ने का पाठ कैसे निकाला जाएगा।";
      
      // Update the chunk with text and mark it as processing
      await supabaseClient
        .from('chunks')
        .update({ 
          text_content: sampleHindiText,
          status: 'processing'
        })
        .eq('book_id', bookId)
        .eq('chunk_number', nextChunkNumber);
      
      // Simulate delay for audio generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate "audio" URL for the new chunk
      const simulatedAudioUrl = `https://mnggqmkkeknclrmyifmt.supabase.co/storage/v1/object/public/books/simulated_audio_${bookId}_chunk_${nextChunkNumber}.mp3`;
      
      // Update the chunk with the audio URL and mark it as completed
      await supabaseClient
        .from('chunks')
        .update({ 
          audio_url: simulatedAudioUrl,
          status: 'completed'
        })
        .eq('book_id', bookId)
        .eq('chunk_number', nextChunkNumber);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Next chunk processing initiated'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing next chunk:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
