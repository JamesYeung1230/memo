import { ApiResponse } from '@/types/api'
import type { CardSearchItem, AiGeneratedQuestion } from '@/types/question'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Mock 卡片数据 */
const mockCards: CardSearchItem[] = [
  { id: 'c1', title: '什么是变量', chapterName: '变量与数据类型', domainName: '编程基础概念', difficulty: '入门' },
  { id: 'c2', title: '基本数据类型', chapterName: '变量与数据类型', domainName: '编程基础概念', difficulty: '入门' },
  { id: 'c3', title: '条件判断语句', chapterName: '控制流程', domainName: '编程基础概念', difficulty: '入门' },
  { id: 'c4', title: '循环结构', chapterName: '控制流程', domainName: '编程基础概念', difficulty: '基础' },
  { id: 'c5', title: '函数的定义与调用', chapterName: '函数', domainName: '编程基础概念', difficulty: '基础' },
  { id: 'c6', title: 'HTTP 请求方法', chapterName: 'HTTP 协议', domainName: '计算机网络基础', difficulty: '基础' },
  { id: 'c7', title: 'TCP/IP 协议栈', chapterName: '传输层协议', domainName: '计算机网络基础', difficulty: '进阶' },
  { id: 'c8', title: 'Git 基本操作', chapterName: '版本控制', domainName: '软件工程流程', difficulty: '入门' },
]

export const aiApi = {
  /** 搜索知识卡片 */
  async searchCards(keyword: string): Promise<ApiResponse<CardSearchItem[]>> {
    await delay(200)
    const q = keyword.toLowerCase()
    const filtered = q
      ? mockCards.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.chapterName.toLowerCase().includes(q) ||
            c.domainName.toLowerCase().includes(q),
        )
      : mockCards
    return { data: filtered }
  },

  /** AI 生成题目 */
  async generateQuestion(cardId: string): Promise<ApiResponse<AiGeneratedQuestion>> {
    await delay(1500)

    const questions: Record<string, AiGeneratedQuestion> = {
      c1: {
        stem: '在 Python 中，下列哪个选项是正确的变量命名方式？',
        options: [
          { label: 'A', text: '2variable' },
          { label: 'B', text: 'my_var' },
          { label: 'C', text: 'my-var' },
          { label: 'D', text: 'var name' },
        ],
        correctAnswer: 'B',
        analysis:
          'Python 变量命名规则：只能包含字母、数字和下划线，且不能以数字开头。`my_var` 符合规则，其他选项均不符合。',
      },
      c2: {
        stem: '以下哪个是 Python 中的可变数据类型？',
        options: [
          { label: 'A', text: 'tuple' },
          { label: 'B', text: 'str' },
          { label: 'C', text: 'list' },
          { label: 'D', text: 'int' },
        ],
        correctAnswer: 'C',
        analysis: 'Python 中 list（列表）是可变数据类型，tuple（元组）、str（字符串）和 int（整型）都是不可变数据类型。',
      },
      c3: {
        stem: '在 Python 中，以下哪个关键字用于条件判断？',
        options: [
          { label: 'A', text: 'for' },
          { label: 'B', text: 'while' },
          { label: 'C', text: 'if' },
          { label: 'D', text: 'def' },
        ],
        correctAnswer: 'C',
        analysis: '`if` 是 Python 中用于条件判断的关键字。`for` 和 `while` 用于循环，`def` 用于定义函数。',
      },
    }

    const result = questions[cardId]
    if (result) return { data: result }

    return {
      data: {
        stem: '根据所选知识卡片，以下哪个描述是正确的？',
        options: [
          { label: 'A', text: '选项 A 的描述内容' },
          { label: 'B', text: '选项 B 的描述内容' },
          { label: 'C', text: '选项 C 的描述内容' },
          { label: 'D', text: '选项 D 的描述内容' },
        ],
        correctAnswer: 'A',
        analysis: '这是对正确答案的解析说明。',
      },
    }
  },
}
