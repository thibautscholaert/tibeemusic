import { refreshAccessToken } from '@/utils/googleDrive';
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const session = await supabase.auth.getUser()
  const user = session.data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const tokenRes = await supabase
    .from('user_drive_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (tokenRes.error || !tokenRes.data) return NextResponse.json({ error: 'no tokens' }, { status: 403 })
    let { access_token, refresh_token } = tokenRes.data;

  try {
    const refreshed = await refreshAccessToken(refresh_token)
    access_token = refreshed.access_token;
    console.log('Refreshed access token:', refreshed);

    const expires_at = new Date(Date.now() + refreshed.expires_in * 1000 - (10*1000)).toUTCString() // 10 seconds before expiration

    console.log('Expires at:', expires_at, user.id);

    await supabase.from('user_drive_tokens').update({
      access_token,
      expires_at 
    }).eq('user_id', user.id);

  } catch (error) {
    console.error('Error refreshing access token:', error);
    return NextResponse.json({ error: 'Error refreshing access token', success:false }, { status: 500 })

  }

    return NextResponse.json({success: true, access_token}, { status: 200 })

}