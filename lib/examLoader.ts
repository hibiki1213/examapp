import { Category } from '@/types/exam'
import { parseExamData, parseExam2Data, parseExam3Data, parseExam4Data } from './examData'

let cachedExamData: Category[] | null = null
let cachedExam2Data: Category[] | null = null
let cachedExam3Data: Category[] | null = null
let cachedExam4Data: Category[] | null = null

/**
 * 財政学のexam.mdデータを読み込む
 */
export async function loadExamData(): Promise<Category[]> {
  if (cachedExamData) {
    return cachedExamData
  }

  try {
    cachedExamData = await parseExamData()
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
 * 産業組織論のexam3.mdデータを読み込む
 */
export async function loadExam3Data(): Promise<Category[]> {
  if (cachedExam3Data) {
    return cachedExam3Data
  }

  try {
    cachedExam3Data = await parseExam3Data()
    return cachedExam3Data
  } catch (error) {
    console.error('Failed to load exam3 data:', error)
    return []
  }
}

/**
 * 多国籍企業論のexam4.mdデータを読み込む
 */
export async function loadExam4Data(): Promise<Category[]> {
  if (cachedExam4Data) {
    return cachedExam4Data
  }

  try {
    cachedExam4Data = await parseExam4Data()
    return cachedExam4Data
  } catch (error) {
    console.error('Failed to load exam4 data:', error)
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
 * 財政学の全カテゴリのデータを取得
 */
export async function getAllCategories(): Promise<Category[]> {
  return await loadExamData()
}

/**
 * 企業戦略論の特定カテゴリのデータを取得
 */
export async function getCategory2Data(categoryId: string): Promise<Category | null> {
  const data = await loadExam2Data()
  return data.find(category => category.id === categoryId) || null
}

/**
 * 企業戦略論の全カテゴリのデータを取得
 */
export async function getAllCategories2(): Promise<Category[]> {
  return await loadExam2Data()
}

/**
 * 産業組織論の特定カテゴリのデータを取得
 */
export async function getCategory3Data(categoryId: string): Promise<Category | null> {
  const data = await loadExam3Data()
  return data.find(category => category.id === categoryId) || null
}

/**
 * 産業組織論の全カテゴリのデータを取得
 */
export async function getAllCategories3(): Promise<Category[]> {
  return await loadExam3Data()
}

/**
 * 多国籍企業論の特定カテゴリのデータを取得
 */
export async function getCategory4Data(categoryId: string): Promise<Category | null> {
  const data = await loadExam4Data()
  return data.find(category => category.id === categoryId) || null
}

/**
 * 多国籍企業論の全カテゴリのデータを取得
 */
export async function getAllCategories4(): Promise<Category[]> {
  return await loadExam4Data()
} 