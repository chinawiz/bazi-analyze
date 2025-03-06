import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

export const runtime = 'edge';
export const preferredRegion = 'hkg1'; 