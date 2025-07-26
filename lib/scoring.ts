import { Question, UserAnswer, QuestionResult } from '@/types/exam'

/**
 * 回答を正規化（大文字小文字、空白の除去など）
 */
export function normalizeAnswer(answer: string): string {
  return answer
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[「」()（）]/g, '') // 括弧を除去
}

/**
 * 単一問題の採点
 */
export function scoreQuestion(
  question: Question, 
  userAnswers: UserAnswer[]
): QuestionResult {
  const questionAnswers = userAnswers.filter(
    answer => answer.questionId === question.id
  )
  
  let correctCount = 0
  const totalBlanks = question.blanks.length
  const correctAnswers: string[] = []
  const userAnswerTexts: string[] = []
  
  for (const blank of question.blanks) {
    const userAnswer = questionAnswers.find(
      answer => answer.blankId === blank.id
    )
    
    const normalizedCorrect = normalizeAnswer(blank.answer)
    const normalizedUser = userAnswer ? normalizeAnswer(userAnswer.answer) : ''
    
    correctAnswers.push(blank.answer)
    userAnswerTexts.push(userAnswer?.answer || '')
    
    if (normalizedCorrect === normalizedUser) {
      correctCount++
    }
  }
  
  const score = correctCount
  const maxScore = totalBlanks
  const isCorrect = score === maxScore
  
  return {
    questionId: question.id,
    isCorrect,
    correctAnswers,
    userAnswers: userAnswerTexts,
    score,
    maxScore
  }
}

/**
 * セッション全体の採点
 */
export function calculateSessionScore(results: QuestionResult[]) {
  const totalScore = results.reduce((sum, result) => sum + result.score, 0)
  const totalMaxScore = results.reduce((sum, result) => sum + result.maxScore, 0)
  const correctQuestions = results.filter(result => result.isCorrect).length
  
  return {
    totalScore,
    totalMaxScore,
    correctQuestions,
    totalQuestions: results.length,
    percentage: totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0
  }
}

/**
 * 問題文の虫食い部分をplaceholderに置換
 */
export function formatQuestionText(questionText: string): string {
  let counter = 0
  return questionText.replace(/\*\*[\_]+\*\*/g, () => {
    counter++
    return `[${counter}]`
  })
}

/**
 * 問題文の虫食い部分をinput要素に置換するためのパーツに分割
 */
export function splitQuestionForInputs(questionText: string): Array<{ type: 'text' | 'input', content: string, blankIndex?: number }> {
  const parts: Array<{ type: 'text' | 'input', content: string, blankIndex?: number }> = []
  let lastIndex = 0
  let blankIndex = 0
  
  // **...** パターンを検出し、虫食い箇所を特定
  const allStarPattern = /\*\*(.*?)\*\*/g
  let match
  
  while ((match = allStarPattern.exec(questionText)) !== null) {
    const content = match[1]
    
    // 虫食い箇所かどうかチェック
    const isBlank = content.includes('_') && !content.match(/[a-zA-Z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)
    
    if (isBlank) {
      // マッチ前のテキスト
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: questionText.slice(lastIndex, match.index)
        })
      }
      
      // 入力フィールド
      parts.push({
        type: 'input',
        content: '',
        blankIndex: blankIndex++
      })
      
      lastIndex = match.index + match[0].length
    }
  }
  
  // 最後のテキスト
  if (lastIndex < questionText.length) {
    parts.push({
      type: 'text',
      content: questionText.slice(lastIndex)
    })
  }
  
  return parts
} 