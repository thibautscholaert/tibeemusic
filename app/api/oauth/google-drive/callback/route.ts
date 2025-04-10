import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect('/error')

  const body = new URLSearchParams({
    code,
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!,
    grant_type: 'authorization_code'
  })

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  })

  const tokens = await res.json()

  const supabase = await createClient();

  const sessionRes = await supabase.auth.getUser()
  const user = sessionRes.data.user

  if (user) {
    await supabase.from('user_drive_tokens').upsert({
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    })
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/protected`)
}