import { refreshAccessToken, uploadToGoogleDrive } from '@/utils/googleDrive';
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

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

  let { access_token, refresh_token, expires_at } = tokenRes.data

  if (new Date(expires_at).getTime() < new Date().getTime()) {
    const refreshed = await refreshAccessToken(refresh_token)
    access_token = refreshed.access_token

    await supabase.from('user_drive_tokens').update({
      access_token,
      expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
    }).eq('user_id', user.id)
  }

  const uploaded = await uploadToGoogleDrive(access_token, file)
  return NextResponse.json(uploaded)
}
