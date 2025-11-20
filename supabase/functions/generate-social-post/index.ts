// supabase/functions/generate-social-post/index.ts
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { blogContent } = await req.json()
    const apiKey = Deno.env.get('GOOGLE_API_KEY')

    if (!apiKey) {
      throw new Error('API key is not configured.')
    }

    const prompt = `You are a professional virtual assistant social media expert. Your task is to write a short, engaging social media post (e.g., for LinkedIn, Facebook, or Instagram) based on the following blog post content. The post should be friendly, professional, and include a clear call to action. Do not include hashtags. Keep it under 250 characters. Here is the blog post content: \n\n${blogContent}`;

    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${errorText}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No content generated. The API may have blocked the request for safety reasons.');
    }

    return new Response(JSON.stringify({ socialPost: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
