'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function submitPreviewPassword(formData: FormData) {
  const password = formData.get('password');
  const validPassword = process.env.PREVIEW_PASSWORD || 'preview';

  if (password === validPassword) {
    const cookieStore = await cookies();
    // 7 dagar
    cookieStore.set('preview_access', '1', {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    redirect('/');
  } else {
    redirect('/preview?error=1');
  }
}
