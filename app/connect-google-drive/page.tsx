'use client'
import { Button } from '@/components/ui/button';

export default function ConnectGoogleDrive() {

const connectGoogleDrive = async () => {

  // TODO : check if already connected
  // Add possibility to disconnect
  // create access to this ghost page
    
    const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!,
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        scope: 'https://www.googleapis.com/auth/drive',
      })
  
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
    }

  return (
<Button onClick={connectGoogleDrive}>
Connect Google Drive
</Button>
  )
  
}
