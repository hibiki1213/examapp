import { NextResponse } from 'next/server'
import { getAllCategories4 } from '@/lib/examLoader'

export async function GET() {
  try {
    const categories = await getAllCategories4()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching multinational enterprise categories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 