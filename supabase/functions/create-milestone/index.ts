// The line below is the fix. It tells VS Code how to understand Deno and Supabase functions.
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  // This is needed to handle the preflight request from the browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the details of the milestone from the request.
    const { project_id, title, description } = await req.json()

    // Create a special "admin" Supabase client that can bypass security rules.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find the highest current sort_order for this project to add the new one at the end.
    const { data: milestones, error: sortError } = await supabaseAdmin
      .from('project_milestones')
      .select('sort_order')
      .eq('project_id', project_id)
      .order('sort_order', { ascending: false })
      .limit(1)

    if (sortError) throw sortError

    const maxSortOrder = milestones?.[0]?.sort_order || 0

    // Insert the new milestone into the database.
    const { data: newMilestone, error: insertError } = await supabaseAdmin
      .from('project_milestones')
      .insert({
        project_id,
        title,
        description: description || null,
        status: 'To Do',
        sort_order: maxSortOrder + 1,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Send the newly created milestone back to your app.
    return new Response(JSON.stringify({ newMilestone }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // If anything goes wrong, send back an error message.
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
