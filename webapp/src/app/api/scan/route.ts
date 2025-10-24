import { NextResponse } from 'next/server';

import { getGameById } from '@/lib/catalog';
import { calculateScore } from '@/lib/scoring';

export async function POST(request: Request) {
  try {
    const { code } = (await request.json()) as { code?: string };
    if (!code) {
      return NextResponse.json(
        { error: 'QR code payload is required' },
        { status: 400 },
      );
    }

    const game = getGameById(code);
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found in catalog', code: code.toUpperCase() },
        { status: 404 },
      );
    }

    const score = calculateScore(game);
    return NextResponse.json({
      code: game.id,
      game,
      score,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to process scan request' },
      { status: 500 },
    );
  }
}
