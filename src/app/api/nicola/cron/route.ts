// app/api/nicola/cron/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a separate, admin-level Supabase client for this server-side process.
// We use the SERVICE_ROLE_KEY here to bypass Row Level Security,
// as this process needs to see ALL scheduled posts, not just those of a specific user.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SERVICE_ROLE_KEY! // Using your existing environment variable
);

export async function GET(request: Request) {
  // 1. Secure the endpoint
  // This section is commented out for easy local testing.
  // Remember to remove the "/*" and "*/" before deploying your app!
  /*
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  */

  try {
    // 2. Find posts that are due to be published
    const now = new Date().toISOString();
    const { data: duePosts, error: fetchError } = await supabaseAdmin
      .from('content_plans')
      .select('id, body, link_url') // Select only what's needed for posting
      .eq('status', 'Scheduled')
      .lte('publish_at', now);

    if (fetchError) {
      console.error('Cron job failed to fetch posts:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    if (!duePosts || duePosts.length === 0) {
      return NextResponse.json({ message: 'No posts due for publishing.' });
    }

    // 3. "Publish" each post
    const publishingPromises = duePosts.map(async (post) => {
      console.log(`Publishing post ID: ${post.id}`);
      
      // --- THIS IS WHERE YOU WOULD CALL THE LINKEDIN API ---
      // Example:
      // const linkedInResponse = await postToLinkedIn(post.body, post.link_url);
      // if (!linkedInResponse.success) {
      //   throw new Error(`Failed to post to LinkedIn for post ID: ${post.id}`);
      // }
      // For now, we'll just log it to simulate success.
      
      // 4. Update the post's status to 'Published'
      const { error: updateError } = await supabaseAdmin
        .from('content_plans')
        .update({ status: 'Published' })
        .eq('id', post.id);
        
      if (updateError) {
        console.error(`Failed to update status for post ${post.id}:`, updateError);
        // In a real app, you might set the status to 'Failed' here
      }

      return { id: post.id, status: 'Published' };
    });

    await Promise.all(publishingPromises);

    return NextResponse.json({ message: `Successfully processed ${duePosts.length} posts.` });

  } catch (error: any) {
    console.error('An error occurred in the cron job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
