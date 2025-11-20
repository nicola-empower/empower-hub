import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data: functionData, error: functionError } = await supabase.functions.invoke('invite-user', {
      body: { email: cleanEmail },
    });

    if (functionError) {
      return NextResponse.json({ error: 'Could not invite user.' }, { status: 500 });
    }

    const invitedUserId = functionData?.data?.user?.id;
    if (!invitedUserId) {
      return NextResponse.json({ error: 'Invite failed. No user ID returned.' }, { status: 500 });
    }

    const { error: dbError } = await supabase
      .from('clients')
      .insert([{ client_id: invitedUserId, name, email: cleanEmail }]);

    if (dbError) {
      return NextResponse.json({ error: 'Could not add client to database.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Client successfully invited!' });

  } catch (error) {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}