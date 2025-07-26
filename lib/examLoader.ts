import { Category } from '@/types/exam'
import { parseExamData, parseExam2Data } from './examData'

let cachedExamData: Category[] | null = null
let cachedExam2Data: Category[] | null = null

/**
 * 財政学のexam.mdデータを読み込む
 */
export async function loadExamData(): Promise<Category[]> {
  if (cachedExamData) {
    return cachedExamData
  }

  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'exam.md')
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const data = await parseExamData(fileContent)
    cachedExamData = data.categories
    return cachedExamData
  } catch (error) {
    console.error('Failed to load exam data:', error)
    return []
  }
}

/**
 * 企業戦略論のexam2.mdデータを読み込む
 */
export async function loadExam2Data(): Promise<Category[]> {
  if (cachedExam2Data) {
    return cachedExam2Data
  }

  try {
    cachedExam2Data = await parseExam2Data()
    return cachedExam2Data
  } catch (error) {
    console.error('Failed to load exam2 data:', error)
    return []
  }
}

/**
 * 財政学の特定カテゴリのデータを取得
 */
export async function getCategoryData(categoryId: string): Promise<Category | null> {
  const data = await loadExamData()
  return data.find(category => category.id === categoryId) || null
}

/**
 * 企業戦略論の特定カテゴリのデータを取得
 */
export async function getCategory2Data(categoryId: string): Promise<Category | null> {
  const data = await loadExam2Data()
  return data.find(category => category.id === categoryId) || null
}

/**
 * 財政学の全カテゴリを取得
 */
export async function getAllCategories(): Promise<Category[]> {
  return await loadExamData()
}

/**
 * 企業戦略論の全カテゴリを取得
 */
export async function getAllCategories2(): Promise<Category[]> {
  return await loadExam2Data()
} 