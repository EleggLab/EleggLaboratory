import { NextResponse } from 'next/server';
import { computeSajuChart } from '@saju/core';
import { parseBirthInput } from '../../../lib/birthInputSchema';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const input = parseBirthInput(body);
    const result = computeSajuChart(input);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
