import { NextResponse } from 'next/server'
import { getAllCategories5 } from '@/lib/examLoader'

export async function GET() {
  try {
    const categories = await getAllCategories5()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching health economics categories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 