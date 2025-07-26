'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Category } from '@/types/exam'
import { CategoryCard } from '@/components/CategoryCard'

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('[HomePage] Fetching categories from /api/categories...')
        const response = await fetch('/api/categories')
        console.log('[HomePage] Response status:', response.status)
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        const data = await response.json()
        console.log('[HomePage] Received categories:', data.length, 'items')
        console.log('[HomePage] First category:', data[0])
        setCategories(data)
      } catch (err) {
        console.error('[HomePage] Error fetching categories:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">データを読み込んでいます...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">エラーが発生しました: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* デスクトップでの右上ボタン */}
      <div className="hidden md:block absolute top-6 right-6 z-10">
        <Link 
          href="/business-strategy"
          className="inline-flex items-center px-3 py-1.5 text-gray-600 text-sm hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400 bg-white/50 backdrop-blur-sm"
        >
          企業経営論
        </Link>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            財政学テスト対策
          </h1>
          
          {/* スマホでのボタン（タイトル下） */}
          <div className="md:hidden mb-6">
            <Link 
              href="/business-strategy"
              className="inline-flex items-center px-4 py-2 text-gray-600 text-sm hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400 bg-white/50 backdrop-blur-sm"
            >
              企業経営論
            </Link>
          </div>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            財政学の重要概念を虫食い問題で効率的に学習できます。<br />
            カテゴリを選んで、一問一答形式で知識を確認しましょう。
          </p>
        </div>
        
        {/* カテゴリ一覧 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {categories.map((category) => (
            <CategoryCard 
              key={category.id} 
              category={category}
              href={`/${category.id}`}
            />
          ))}
        </div>

        {/* フッター */}
        <div className="text-center mt-16 text-sm text-gray-500">
          <p>
            問題を解いて、財政学の理解を深めましょう
          </p>
        </div>
      </div>
    </div>
  )
}
