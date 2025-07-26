import { Question, BlankField, Category } from '@/types/exam'
import fs from 'fs/promises'
import path from 'path'

// カテゴリマッピング
const CATEGORY_MAPPING = {
  '財政学と政府': {
    id: 'public-finance',
    nameEn: 'Public Finance and Government',
    description: '政府支出、課税、政府の経済活動に関する基本概念'
  },
  '市場機能と政府の役割': {
    id: 'market-government',
    nameEn: 'Market Functions and the Role of Government', 
    description: '市場の失敗、外部性、公共財の理論'
  },
  '公共財': {
    id: 'public-goods',
    nameEn: 'Public Goods',
    description: '公共財の特性、効率的供給、ただ乗り問題'
  },
  '外部性': {
    id: 'externalities',
    nameEn: 'Externalities',
    description: '外部効果、ピグー税、コーズ定理'
  },
  '社会保障': {
    id: 'social-security',
    nameEn: 'Social Security',
    description: '社会保険、年金制度、所得再分配'
  }
} as const

/**
 * exam.mdファイルからデータを抽出してパースする
 */
export async function parseExamData(): Promise<Category[]> {
  try {
    const filePath = path.join(process.cwd(), 'exam.md')
    const examContent = await fs.readFile(filePath, 'utf-8')
    
    const lines = examContent.split('\n')
    const categories: Category[] = []
    
    // 問題セクションと回答セクションを分離
    const problemSectionEnd = lines.findIndex(line => line.includes('### 回答集'))
    const problemLines = lines.slice(0, problemSectionEnd)
    const answerLines = lines.slice(problemSectionEnd)
    
    // 問題を解析
    const problemsByCategory = parseProblemsSection(problemLines)
    
    // 回答を解析
    const answersByCategory = parseAnswersSection(answerLines)
    
    // カテゴリを構築
    for (const categoryName of Object.keys(problemsByCategory)) {
      const mapping = CATEGORY_MAPPING[categoryName as keyof typeof CATEGORY_MAPPING]
      if (mapping) {
        const questions = problemsByCategory[categoryName]
        const answers = answersByCategory[categoryName] || {}
        
        // 回答を問題に結合
        questions.forEach(question => {
          question.blanks.forEach((blank, index) => {
            const questionNumber = parseInt(question.id.split('-').pop() || '0')
            if (answers[questionNumber]) {
              blank.answer = answers[questionNumber][index] || ''
            }
          })
        })
        
        categories.push({
          id: mapping.id,
          name: categoryName,
          nameEn: mapping.nameEn,
          description: mapping.description,
          questionCount: questions.length,
          questions: questions
        })
      }
    }

    // 財政学カテゴリを適切な順序で並び替え
    categories.sort((a, b) => {
      const getOrder = (name: string): number => {
        if (name.includes('財政学と政府')) return 1
        if (name.includes('公債論')) return 2
        if (name.includes('租税論')) return 3
        if (name.includes('地方財政論')) return 4
        if (name.includes('財政政策')) return 5
        return 999
      }
      
      const orderA = getOrder(a.name)
      const orderB = getOrder(b.name)
      return orderA - orderB
    })

    return categories
  } catch (error) {
    console.error('Error parsing exam data:', error)
    throw error
  }
}

/**
 * 問題セクションを解析
 */
function parseProblemsSection(lines: string[]): { [category: string]: Question[] } {
  const result: { [category: string]: Question[] } = {}
  let currentCategory: string | null = null
  let questionNumber = 0
  let currentQuestionText = ''
  let isInQuestion = false

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim()
    
    // 空行をスキップ
    if (!trimmedLine) continue
    
    // カテゴリヘッダーの検出
    const categoryMatch = trimmedLine.match(/^#### (.+?) \(.+?\)/)
    if (categoryMatch) {
      // 前の問題を保存
      if (currentCategory && isInQuestion && currentQuestionText) {
        const question = createQuestion(questionNumber, currentCategory, currentQuestionText.trim())
        result[currentCategory].push(question)
      }
      
      currentCategory = categoryMatch[1]
      result[currentCategory] = []
      questionNumber = 0
      currentQuestionText = ''
      isInQuestion = false
      continue
    }
    
    // 問題の検出
    const questionMatch = trimmedLine.match(/^(\d+)\.\s+(.+)/)
    if (questionMatch && currentCategory) {
      // 前の問題を保存
      if (isInQuestion && currentQuestionText) {
        const question = createQuestion(questionNumber, currentCategory, currentQuestionText.trim())
        result[currentCategory].push(question)
      }
      
      questionNumber = parseInt(questionMatch[1])
      currentQuestionText = questionMatch[2]
      isInQuestion = true
      continue
    }
    
    // 継続行の検出（リスト項目やインデントされた行）
    if (isInQuestion && currentCategory && (trimmedLine.startsWith('*') || trimmedLine.startsWith('    '))) {
      currentQuestionText += ' ' + trimmedLine
      continue
    }
    
    // その他の継続行
    if (isInQuestion && currentCategory && trimmedLine && !trimmedLine.match(/^#### /)) {
      currentQuestionText += ' ' + trimmedLine
      continue
    }
  }
  
  // 最後の問題を保存
  if (currentCategory && isInQuestion && currentQuestionText) {
    const question = createQuestion(questionNumber, currentCategory, currentQuestionText.trim())
    result[currentCategory].push(question)
  }
  
  return result
}

/**
 * 回答セクションを解析
 */
function parseAnswersSection(lines: string[]): { [category: string]: { [questionNumber: number]: string[] } } {
  const result: { [category: string]: { [questionNumber: number]: string[] } } = {}
  let currentCategory: string | null = null
  let currentQuestionNumber: number | null = null
  let currentAnswers: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim()
    
    // 空行をスキップ
    if (!trimmedLine) continue
    
    // カテゴリヘッダーの検出
    const categoryMatch = trimmedLine.match(/^#### (.+?) \(.+?\)/)
    if (categoryMatch) {
      // 前の問題の回答を保存
      if (currentCategory && currentQuestionNumber !== null && currentAnswers.length > 0) {
        if (!result[currentCategory]) result[currentCategory] = {}
        result[currentCategory][currentQuestionNumber] = currentAnswers
      }
      
      currentCategory = categoryMatch[1]
      result[currentCategory] = {}
      currentQuestionNumber = null
      currentAnswers = []
      continue
    }
    
    // 問題番号の検出
    const questionMatch = trimmedLine.match(/^(\d+)\.\s+(.+)/)
    if (questionMatch && currentCategory) {
      // 前の問題の回答を保存
      if (currentQuestionNumber !== null && currentAnswers.length > 0) {
        result[currentCategory][currentQuestionNumber] = currentAnswers
      }
      
      currentQuestionNumber = parseInt(questionMatch[1])
      const answerText = questionMatch[2]
      
      // 「該当なし」の場合はスキップ
      if (answerText.includes('該当なし')) {
        currentAnswers = []
        continue
      }
      
      currentAnswers = extractAnswersFromText(answerText)
      continue
    }
    
    // 継続する回答行の検出（インデントされた行や項目行）
    if (currentCategory && currentQuestionNumber !== null) {
      // ①②③項目の回答を検出
      const itemMatch = trimmedLine.match(/[①②③④⑤⑥⑦⑧⑨⑩]\s*\*\*([^*]+)\*\*/)
      if (itemMatch) {
        currentAnswers.push(itemMatch[1].trim())
        continue
      }
      
      // **答え**形式の継続行
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        const additionalAnswers = extractAnswersFromText(trimmedLine)
        currentAnswers.push(...additionalAnswers)
        continue
      }
    }
  }
  
  // 最後の問題の回答を保存
  if (currentCategory && currentQuestionNumber !== null && currentAnswers.length > 0) {
    if (!result[currentCategory]) result[currentCategory] = {}
    result[currentCategory][currentQuestionNumber] = currentAnswers
  }
  
  return result
}

/**
 * 問題オブジェクトを作成
 */
function createQuestion(questionNumber: number, category: string, text: string): Question {
  const blanks: BlankField[] = []
  let blankCounter = 0
  
  // **...** パターンを検出し、中身がアンダースコア（虫食い）のみを抽出
  const allStarPattern = /\*\*(.*?)\*\*/g
  let match
  
  while ((match = allStarPattern.exec(text)) !== null) {
    const content = match[1]
    // 虫食い箇所かどうかチェック（バックスラッシュ+アンダースコアまたはアンダースコアのみ）
    // バックスラッシュエスケープされたアンダースコアに対応
    if (content.match(/^[\_\\]*\_+[\_\\]*$/) || content.match(/^\\+_+\\*$/) || content.includes('_')) {
      // アンダースコアが含まれている場合は虫食い箇所とみなす
      if (content.includes('_') && !content.match(/[a-zA-Z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)) {
        blanks.push({
          id: `blank-${blankCounter}`,
          answer: '', // 後で設定
          position: match.index,
          placeholder: `回答${blankCounter + 1}`
        })
        blankCounter++
      }
    }
  }
  
  const categoryMapping = CATEGORY_MAPPING[category as keyof typeof CATEGORY_MAPPING]
  const categoryId = categoryMapping?.id || category.toLowerCase().replace(/[^a-z0-9]/g, '-')
  
  return {
    id: `${categoryId}-${questionNumber}`,
    category: categoryId,
    text: text,
    blanks: blanks
  }
}

/**
 * 回答テキストから個別の回答を抽出
 */
function extractAnswersFromText(text: string): string[] {
  // **答え**形式の回答を抽出
  const boldAnswers = text.match(/\*\*([^*]+)\*\*/g)
  if (boldAnswers) {
    return boldAnswers.map(answer => answer.replace(/\*\*/g, '').trim())
  }
  
  // フォールバック：空の配列を返す
  return []
} 

/**
 * 企業戦略論用のexam2.mdファイルをパースする
 */
export async function parseExam2Data(): Promise<Category[]> {
  try {
    const filePath = path.join(process.cwd(), 'exam2.md')
    const fileContent = await fs.readFile(filePath, 'utf-8')
    
    // console.log('Loading exam2 data from file...')
    // console.log('File loaded, parsing data...')
    
    // 問題セクションと解答セクションを分離
    const sections = fileContent.split('### **テスト解答集**')
    const problemsSection = sections[0]
    const answersSection = sections[1] || ''
    
    // 問題をパース
    const questionsByCategory = parseProblemsSection2(problemsSection)
    
    // 解答をパース
    const answersByCategory = parseAnswersSection2(answersSection)
    
    // カテゴリを作成
    const categories: Category[] = []
    
    Object.keys(questionsByCategory).forEach(categoryName => {
      const category = saveCategory2(
        categoryName,
        questionsByCategory[categoryName],
        answersByCategory[categoryName] || {}
      )
      if (category.questions.length > 0) {
        categories.push(category)
      }
    })
    
    // 章番号順に並び替え
    categories.sort((a, b) => {
      const getChapterNumber = (name: string): number => {
        const match = name.match(/第(\d+)章/)
        return match ? parseInt(match[1]) : 999
      }
      
      const chapterA = getChapterNumber(a.name)
      const chapterB = getChapterNumber(b.name)
      return chapterA - chapterB
    })
    
    // console.log(`Data parsed successfully: ${categories.length} categories`)
    return categories
  } catch (error) {
    console.error('Error parsing exam2 data:', error)
    throw error
  }
}

/**
 * 企業戦略論の問題セクションをパース
 */
function parseProblemsSection2(content: string): { [categoryName: string]: { questionNumber: number, text: string }[] } {
  const questionsByCategory: { [categoryName: string]: { questionNumber: number, text: string }[] } = {}
  const lines = content.split('\n')
  
  let currentCategory = ''
  let inQuestion = false
  let currentQuestionText = ''
  let currentQuestionNumber = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // カテゴリヘッダーを検出
    const categoryMatch = line.match(/#### \*\*第(\d+)章\s+(.+?)\*\*/)
    if (categoryMatch) {
      // 前の問題を保存
      if (inQuestion && currentQuestionText.trim() && currentCategory) {
        if (!questionsByCategory[currentCategory]) {
          questionsByCategory[currentCategory] = []
        }
        questionsByCategory[currentCategory].push({
          questionNumber: currentQuestionNumber,
          text: currentQuestionText.trim()
        })
      }
      
      const chapterNum = categoryMatch[1]
      const chapterTitle = categoryMatch[2]
      currentCategory = `第${chapterNum}章 ${chapterTitle}`
      inQuestion = false
      currentQuestionText = ''
      currentQuestionNumber = 0
      continue
    }
    
    // 問題を検出
    const questionMatch = line.match(/^\*\*問題(\d+)\*\*$/)
    if (questionMatch) {
      // 前の問題を保存
      if (inQuestion && currentQuestionText.trim() && currentCategory) {
        if (!questionsByCategory[currentCategory]) {
          questionsByCategory[currentCategory] = []
        }
        questionsByCategory[currentCategory].push({
          questionNumber: currentQuestionNumber,
          text: currentQuestionText.trim()
        })
      }
      
      currentQuestionNumber = parseInt(questionMatch[1])
      inQuestion = true
      currentQuestionText = ''
      continue
    }
    
    // 問題の内容を蓄積
    if (inQuestion && line && !line.startsWith('---') && !line.startsWith('### ')) {
      if (currentQuestionText) {
        currentQuestionText += '\n' + line
      } else {
        currentQuestionText = line
      }
    }
  }
  
  // 最後の問題を保存
  if (inQuestion && currentQuestionText.trim() && currentCategory) {
    if (!questionsByCategory[currentCategory]) {
      questionsByCategory[currentCategory] = []
    }
    questionsByCategory[currentCategory].push({
      questionNumber: currentQuestionNumber,
      text: currentQuestionText.trim()
    })
  }
  
  return questionsByCategory
}

/**
 * 企業戦略論の解答セクションをパース
 */
function parseAnswersSection2(content: string): { [categoryName: string]: { [questionNumber: number]: string[] } } {
  const answersByCategory: { [categoryName: string]: { [questionNumber: number]: string[] } } = {}
  const lines = content.split('\n')
  
  let currentCategory = ''
  let currentQuestionNumber = 0
  
  // console.log('Starting parseAnswersSection2...')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // カテゴリヘッダーを検出（修正された正規表現）
    const categoryMatch = line.match(/^#### \*\*第(\d+)章\s+(.+?)\*\*$/)
    if (categoryMatch) {
      const chapterNum = categoryMatch[1]
      const chapterTitle = categoryMatch[2]
      currentCategory = `第${chapterNum}章 ${chapterTitle}`
      answersByCategory[currentCategory] = {}
      // console.log(`Found category: ${currentCategory}`)
      continue
    }
    
    // 解答を検出
    const answerMatch = line.match(/^\*\*解答(\d+)\*\*$/)
    if (answerMatch) {
      currentQuestionNumber = parseInt(answerMatch[1])
      // console.log(`Found answer ${currentQuestionNumber} for category: ${currentCategory}`)
      
      // 次の行から解答を読み取り
      let answerText = ''
      let j = i + 1
      while (j < lines.length) {
        const answerLine = lines[j].trim()
        // 次の解答または次のカテゴリまで読み続ける
        if (answerLine.match(/^\*\*解答\d+\*\*$/) || answerLine.match(/^#### \*\*第\d+章/)) {
          break
        }
        if (answerLine) {
          if (answerText) {
            answerText += '\n' + answerLine
          } else {
            answerText = answerLine
          }
        }
        j++
      }
      
      if (currentCategory && answerText) {
        // 複数の解答がある場合の処理を改善
        let answers: string[] = []
        
        // 番号付きリスト形式の場合（例：1. **答え** 2. **答え**）
        const numberedListMatch = answerText.match(/\d+\.\s*\*\*([^*]+)\*\*/g)
        if (numberedListMatch) {
          answers = numberedListMatch.map(match => {
            const answerMatch = match.match(/\*\*([^*]+)\*\*/)
            return answerMatch ? answerMatch[1].trim() : ''
          }).filter(ans => ans)
        } else {
          // 通常の形式（カンマ区切りや改行区切り）
          answers = answerText.split(/[、，\n]/).map(ans => ans.trim()).filter(ans => ans)
        }
        
        answersByCategory[currentCategory][currentQuestionNumber] = answers
        // console.log(`Stored answers for question ${currentQuestionNumber}:`, answers)
      }
      i = j - 1 // ループを調整
    }
  }
  
  // console.log('Final answersByCategory:', answersByCategory)
  return answersByCategory
}

/**
 * 企業戦略論用のカテゴリ作成
 */
function saveCategory2(
  categoryName: string,
  questions: { questionNumber: number, text: string }[],
  answers: { [questionNumber: number]: string[] }
): Category {
  const categoryId = createCategoryId2(categoryName)
  const parsedQuestions: Question[] = []
  
  // console.log(`Creating category: ${categoryName}`)
  // console.log(`Available answers for this category:`, answers)
  
  questions.forEach((questionData) => {
    const { questionNumber, text } = questionData
    const question = createQuestion2(categoryId, questionNumber, text)
    
    // console.log(`\nProcessing question ${questionNumber}:`)
    // console.log(`Question has ${question.blanks.length} blanks`)
    // console.log(`Available answers for question ${questionNumber}:`, answers[questionNumber])
    
    // 解答を設定
    if (answers[questionNumber]) {
      question.blanks.forEach((blank, blankIndex) => {
        if (answers[questionNumber][blankIndex]) {
          blank.answer = answers[questionNumber][blankIndex]
          // console.log(`Set answer for blank ${blankIndex}: "${blank.answer}"`)
        } else {
          // console.log(`No answer available for blank ${blankIndex}`)
        }
      })
    } else {
      // console.log(`No answers found for question ${questionNumber}`)
    }
    
    // console.log(`Final question blanks:`, question.blanks.map(b => ({ id: b.id, answer: b.answer })))
    
    if (question.blanks.length > 0) {
      parsedQuestions.push(question)
    }
  })
  
  // console.log(`\nCategory ${categoryName} created with ${parsedQuestions.length} questions`)
  
  return {
    id: categoryId,
    name: categoryName,
    nameEn: categoryId,
    description: `${categoryName}の問題集`,
    questionCount: parsedQuestions.length,
    questions: parsedQuestions
  }
}

/**
 * 企業戦略論用のカテゴリID作成
 */
function createCategoryId2(categoryName: string): string {
  return categoryName
    .replace(/第(\d+)章\s*/, 'chapter-$1-')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/[^\w-]/g, '')
}

/**
 * 企業戦略論用の問題作成（虫食いパターン: ____________）
 */
function createQuestion2(categoryId: string, questionNumber: number, questionText: string): Question {
  // 企業戦略論の虫食いパターン（アンダースコア12個）
  const blankPattern = /____________/g
  const blanks: BlankField[] = []
  
  let match
  let blankIndex = 0
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  while ((match = blankPattern.exec(questionText)) !== null) {
    blanks.push({
      id: `${categoryId}-${questionNumber}-${blankIndex}`,
      answer: '',
      position: blankIndex,
      placeholder: `空欄${blankIndex + 1}`
    })
    blankIndex++
    // console.log(`Found blank pattern: "${match[0]}"`)
  }
  
  // console.log(`Created ${blanks.length} blanks for question ${questionNumber}`)
  
  return {
    id: `${categoryId}-${questionNumber}`,
    category: categoryId,
    text: questionText,
    blanks: blanks
  }
} 