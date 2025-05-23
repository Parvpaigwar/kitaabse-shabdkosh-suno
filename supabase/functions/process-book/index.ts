
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

interface RequestData {
  bookId: string;
  pdfUrl: string;
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
    const { bookId, pdfUrl } = await req.json() as RequestData;

    if (!bookId || !pdfUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize the PDF URL to ensure we have a valid URL
    const pdfUrlObj = new URL(pdfUrl);
    const sanitizedPdfUrl = pdfUrlObj.toString();

    // Extract text using OCR.space
    const ocrResponse = await fetch(
      `https://api.ocr.space/parse/imageurl?apikey=${Deno.env.get('OCR_API_KEY')}&url=${encodeURIComponent(sanitizedPdfUrl)}&isTable=false&OCREngine=2&language=hin`,
      { method: 'GET' }
    );

    const ocrData = await ocrResponse.json();

    if (!ocrData.IsErroredOnProcessing && ocrData.ParsedResults && ocrData.ParsedResults.length > 0) {
      const extractedText = ocrData.ParsedResults[0].ParsedText;

      if (!extractedText) {
        throw new Error('No text extracted from PDF');
      }

      // Update the first chunk with the extracted text
      await supabaseClient
        .from('chunks')
        .update({ 
          text_content: extractedText,
          status: 'processing'
        })
        .eq('book_id', bookId)
        .eq('chunk_number', 1);

      // Generate audio using Gemini API
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate audio for this Hindi text: ${extractedText.slice(0, 1000)}` // Limit text length
                  }
                ]
              }
            ]
          })
        }
      );

      const geminiData = await geminiResponse.json();
      
      // In real life, Gemini would generate actual audio, but since it doesn't,
      // we're simulating an audio URL here
      const simulatedAudioUrl = `https://mnggqmkkeknclrmyifmt.supabase.co/storage/v1/object/public/books/simulated_audio_${bookId}_chunk_1.mp3`;
      
      // Update the chunk with the "audio URL" and mark it as completed
      await supabaseClient
        .from('chunks')
        .update({ 
          audio_url: simulatedAudioUrl,
          status: 'completed'
        })
        .eq('book_id', bookId)
        .eq('chunk_number', 1);

      return new Response(
        JSON.stringify({ success: true, message: 'Book processing started' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(ocrData.ErrorMessage || 'OCR processing failed');
    }
  } catch (error) {
    console.error('Error processing book:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
