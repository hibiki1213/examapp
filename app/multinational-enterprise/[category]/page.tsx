'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { UserAnswer, QuestionResult, ExamSession, Category } from '@/types/exam'
import { QuestionCard } from '@/components/QuestionCard'
import { ResultDisplay } from '@/components/ResultDisplay'
import { FinalResults } from '@/components/FinalResults'
import { scoreQuestion } from '@/lib/scoring'

export default function MultinationalEnterpriseCategoryPage() {
  const params = useParams()
  const categoryId = params.category as string

  const [category, setCategory] = useState<Category | null>(null)
  const [session, setSession] = useState<ExamSession | null>(null)
  const [currentResult, setCurrentResult] = useState<QuestionResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // カテゴリデータの取得
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/multinational-enterprise/categories/${categoryId}`)
        
        if (!response.ok) {
          throw new Error('カテゴリが見つかりません')
        }

        const categoryData = await response.json()
        setCategory(categoryData)

        // セッションの初期化
        initializeSession(categoryData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの読み込みに失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    if (categoryId) {
      fetchCategoryData()
    }
  }, [categoryId])

  const initializeSession = (categoryData: Category) => {
    const newSession: ExamSession = {
      categoryId: categoryData.id,
      currentQuestionIndex: 0,
      answers: [],
      results: [],
      startTime: new Date(),
      isCompleted: false
    }
    setSession(newSession)
  }

  const handleAnswersChange = (answers: UserAnswer[]) => {
    if (!session) return

    setSession({
      ...session,
      answers: answers
    })
  }

  const handleSubmit = () => {
    if (!session || !category) return

    const currentQuestion = category.questions[session.currentQuestionIndex]
    const result = scoreQuestion(currentQuestion, session.answers)
    
    setCurrentResult(result)
    setSession({
      ...session,
      results: [...session.results, result]
    })
  }

  const handleNext = () => {
    if (!session || !category) return

    const nextIndex = session.currentQuestionIndex + 1

    if (nextIndex >= category.questions.length) {
      setSession({
        ...session,
        isCompleted: true,
        endTime: new Date()
      })
    } else {
      setSession({
        ...session,
        currentQuestionIndex: nextIndex,
        answers: [] // 前の問題の回答をクリア
      })
    }

    setCurrentResult(null)
  }

  const handleRestart = () => {
    if (!category) return
    
    initializeSession(category)
    setCurrentResult(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">問題を読み込んでいます...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">エラーが発生しました: {error}</p>
          <Link 
            href="/multinational-enterprise"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← カテゴリ一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  if (!category || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">カテゴリが見つかりません</p>
          <Link 
            href="/multinational-enterprise"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← カテゴリ一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <Link 
            href="/multinational-enterprise"
            className="inline-flex items-center px-4 py-2 text-gray-600 text-sm hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400 bg-white/50 backdrop-blur-sm mb-4"
          >
            ← 多国籍企業論のカテゴリ一覧に戻る
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {category.name}
          </h1>
          
          <p className="text-gray-600 max-w-2xl mx-auto">
            {category.description}
          </p>
        </div>

        {/* メインコンテンツ */}
        {session.isCompleted ? (
          <FinalResults
            results={session.results}
            categoryName={category.name}
            onRestart={handleRestart}
            homeLink="/multinational-enterprise"
            homeLabel="多国籍企業論のカテゴリ一覧に戻る"
          />
        ) : currentResult ? (
          <ResultDisplay
            result={currentResult}
            onNext={handleNext}
            isLastQuestion={session.currentQuestionIndex === category.questions.length - 1}
          />
        ) : (
          <QuestionCard
            question={category.questions[session.currentQuestionIndex]}
            questionNumber={session.currentQuestionIndex + 1}
            totalQuestions={category.questions.length}
            userAnswers={session.answers}
            onAnswersChange={handleAnswersChange}
            onSubmit={handleSubmit}
            isSubmitted={false}
          />
        )}
      </div>
    </div>
  )
} 