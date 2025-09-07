import { NextResponse } from 'next/server';
import { generateCSRFToken } from '@/lib/csrf';

export async function GET() {
  try {
    const token = await generateCSRFToken();
    return NextResponse.json({ token });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json({ token: '' }, { status: 500 });
  }
}
