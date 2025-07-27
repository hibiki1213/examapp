'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Category } from '@/types/exam'
import { CategoryCard } from '@/components/CategoryCard'

export default function MultinationalEnterpriseHome() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/multinational-enterprise/categories')
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        const data = await response.json()
        setCategories(data)
      } catch (err) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            多国籍企業論テスト対策
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            各回を選択してテストを開始してください
          </p>
          <div className="flex justify-center space-x-4 flex-wrap gap-y-2">
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 text-gray-600 text-sm hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400 bg-white/50 backdrop-blur-sm"
            >
              財政学
            </Link>
            <Link 
              href="/business-strategy"
              className="inline-flex items-center px-4 py-2 text-gray-600 text-sm hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400 bg-white/50 backdrop-blur-sm"
            >
              企業経営
            </Link>
            <Link 
              href="/industrial-organization"
              className="inline-flex items-center px-4 py-2 text-gray-600 text-sm hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400 bg-white/50 backdrop-blur-sm"
            >
              産業組織論
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {categories.map((category) => (
            <CategoryCard 
              key={category.id} 
              category={category}
              href={`/multinational-enterprise/${category.id}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 