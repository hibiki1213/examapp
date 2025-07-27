import { NextResponse } from 'next/server'
import { getAllCategories3 } from '@/lib/examLoader'

export async function GET() {
  try {
    const categories = await getAllCategories3()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching industrial organization categories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 