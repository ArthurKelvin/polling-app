import { NextResponse } from 'next/server';
import { generateCSRFTokenAction } from '@/lib/csrf-actions';

export async function GET() {
  try {
    const token = await generateCSRFTokenAction();
    return NextResponse.json({ token });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json({ token: '' }, { status: 500 });
  }
}
