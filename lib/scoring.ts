import { Question, UserAnswer, QuestionResult, ExamSession } from '@/types/exam'

/**
 * 答えを正規化（空白、大小文字の違いを無視）
 */
export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase()
}

/**
 * 1つの問題の採点を行う
 */
export function scoreQuestion(question: Question, userAnswers: UserAnswer[]): QuestionResult {
  const correctAnswers = question.blanks.map(blank => blank.answer)
  const userAnswerTexts = question.blanks.map(blank => {
    const userAnswer = userAnswers.find(ua => ua.blankId === blank.id)
    return userAnswer ? userAnswer.answer : ''
  })

  // 正解数をカウント
  let correctCount = 0
  for (let i = 0; i < correctAnswers.length; i++) {
    const normalizedCorrect = normalizeAnswer(correctAnswers[i])
    const normalizedUser = normalizeAnswer(userAnswerTexts[i])
    if (normalizedCorrect === normalizedUser) {
      correctCount++
    }
  }

  const maxScore = correctAnswers.length
  const score = correctCount

  return {
    questionId: question.id,
    isCorrect: correctCount === maxScore,
    correctAnswers,
    userAnswers: userAnswerTexts,
    score,
    maxScore
  }
}

/**
 * セッション全体の結果を計算
 */
export function calculateSessionScore(results: QuestionResult[]): {
  totalScore: number
  maxScore: number
  percentage: number
  correctQuestions: number
  totalQuestions: number
} {
  const totalScore = results.reduce((sum, result) => sum + result.score, 0)
  const maxScore = results.reduce((sum, result) => sum + result.maxScore, 0)
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
  const correctQuestions = results.filter(result => result.isCorrect).length
  const totalQuestions = results.length

  return {
    totalScore,
    maxScore,
    percentage,
    correctQuestions,
    totalQuestions
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
 * 財政学と企業戦略論の虫食いパターンを検出して分割情報を返す
 */
export function splitQuestionForInputs(questionText: string): Array<{ type: 'text' | 'input', content: string, blankIndex?: number }> {
  const parts: Array<{ type: 'text' | 'input', content: string, blankIndex?: number }> = []
  let lastIndex = 0
  let blankIndex = 0

  // 財政学パターン: **[内容]** で、内容がアンダースコアのみの場合
  const blankPattern = /\*\*(.*?)\*\*/g
  let match

  while ((match = blankPattern.exec(questionText)) !== null) {
    const content = match[1]
    
    // アンダースコアだけ、または特定の文字を含まない場合は虫食いとして扱う
    if (content.includes('_') && !content.match(/[a-zA-Z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)) {
      // 前の部分を追加
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: questionText.slice(lastIndex, match.index)
        })
      }

      // 入力フィールドを追加
      parts.push({
        type: 'input',
        content: '',
        blankIndex: blankIndex++
      })

      lastIndex = match.index + match[0].length
    }
  }

  // 企業戦略論パターン: ____________ (アンダースコア12個)
  const businessPattern = /____________/g
  let businessMatch
  
  // 財政学パターンで処理されなかった部分を企業戦略論パターンで処理
  const remainingText = questionText.slice(lastIndex)
  let businessLastIndex = 0
  
  while ((businessMatch = businessPattern.exec(remainingText)) !== null) {
    // 前の部分を追加
    if (businessMatch.index > businessLastIndex) {
      parts.push({
        type: 'text',
        content: remainingText.slice(businessLastIndex, businessMatch.index)
      })
    }

    // 入力フィールドを追加
    parts.push({
      type: 'input',
      content: '',
      blankIndex: blankIndex++
    })

    businessLastIndex = businessMatch.index + businessMatch[0].length
  }

  // 残りの部分を追加
  if (businessLastIndex < remainingText.length) {
    parts.push({
      type: 'text',
      content: remainingText.slice(businessLastIndex)
    })
  } else if (lastIndex < questionText.length) {
    // 財政学パターンのみの場合
    parts.push({
      type: 'text',
      content: questionText.slice(lastIndex)
    })
  }

  return parts
} 