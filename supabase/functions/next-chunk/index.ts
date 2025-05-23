
// Adding this to prevent build errors from edge function references
// This is a minimal stub to satisfy TypeScript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  return new Response(
    JSON.stringify({ message: "Next chunk processing started" }),
    { headers: { "Content-Type": "application/json" } }
  );
});
