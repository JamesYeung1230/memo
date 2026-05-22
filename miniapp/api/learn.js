/**
 * 学习模块 API
 *
 * 对接 Core Service (:8000)
 * 涵盖知识卡片、答题、复习三大子模块
 */

var request = require('../utils/request')

// ==================== 领域 & 章节 & 卡片 ====================

/**
 * 获取知识领域列表
 * GET /learn/domains
 */
function getDomains() {
  return request.get('/learn/domains')
}

/**
 * 获取领域下的章节列表
 * GET /learn/domains/{domainId}/chapters
 */
function getChapters(domainId) {
  return request.get('/learn/domains/' + domainId + '/chapters')
}

/**
 * 获取章节下的卡片列表
 * GET /learn/chapters/{chapterId}/cards
 */
function getCards(chapterId) {
  return request.get('/learn/chapters/' + chapterId + '/cards')
}

/**
 * 获取卡片详情
 * GET /learn/cards/{cardId}
 */
function getCardDetail(cardId) {
  return request.get('/learn/cards/' + cardId)
}

/**
 * 标记卡片已掌握
 * POST /learn/cards/{cardId}/master
 */
function masterCard(cardId) {
  return request.post('/learn/cards/' + cardId + '/master')
}

/**
 * 收藏/取消收藏卡片
 * POST /learn/cards/{cardId}/favorite
 */
function favoriteCard(cardId) {
  return request.post('/learn/cards/' + cardId + '/favorite')
}

/**
 * 查询卡片掌握/收藏状态
 * GET /learn/cards/{cardId}/status
 */
function getCardStatus(cardId) {
  return request.get('/learn/cards/' + cardId + '/status')
}

/**
 * 获取收藏列表
 * GET /learn/favorites
 */
function getFavorites() {
  return request.get('/learn/favorites')
}

/**
 * 获取学习进度
 * GET /learn/progress
 */
function getProgress() {
  return request.get('/learn/progress')
}

// ==================== 刷题 ====================

/**
 * 获取答题题目
 * GET /quiz/domain/{domainId}/questions
 */
/**
 * 获取卡片题目
 * GET /learn/cards/{cardId}/question
 */
function getCardQuestion(cardId) {
  return request.get('/learn/cards/' + cardId + '/question')
}

function getQuizQuestions(domainId) {
  return request.get('/quiz/domain/' + domainId + '/questions')
}

/**
 * 提交单题答案
 * POST /quiz/submit
 */
function submitAnswer(questionId, selectedOption) {
  return request.post('/quiz/submit', {
    question_id: questionId,
    selected_option: selectedOption
  })
}

/**
 * 获取错题列表
 * GET /quiz/wrong-questions
 */
function getWrongQuestions() {
  return request.get('/quiz/wrong-questions')
}

/**
 * 发起每日挑战
 * POST /quiz/daily-challenge
 */
function getDailyChallenge() {
  return request.post('/quiz/daily-challenge')
}

/**
 * 提交每日挑战
 * POST /quiz/daily-challenge/submit
 */
function submitDailyChallenge(answers) {
  return request.post('/quiz/daily-challenge/submit', { answers: answers })
}

/**
 * 获取答题统计
 * GET /quiz/statistics
 */
function getQuizStats() {
  return request.get('/quiz/statistics')
}

/**
 * 错题练习
 * POST /quiz/wrong-questions/{id}/practice
 */
function errorPractice(id, selectedOption) {
  return request.post('/quiz/wrong-questions/' + id + '/practice', {
    selected_option: selectedOption
  })
}

// ==================== 复习 ====================

/**
 * 获取今日待复习
 * GET /review/today
 */
function getReviewToday() {
  return request.get('/review/today')
}

/**
 * 完成复习
 * POST /review/cards/{cardId}/complete
 */
function completeReview(cardId) {
  return request.post('/review/cards/' + cardId + '/complete')
}

/**
 * 获取遗忘列表
 * GET /review/forgotten
 */
function getForgotten() {
  return request.get('/review/forgotten')
}

/**
 * 获取复习配置
 * GET /review/config
 */
function getReviewConfig() {
  return request.get('/review/config')
}

/**
 * 更新复习配置
 * PUT /review/config
 */
function updateReviewConfig(data) {
  return request.put('/review/config', data)
}

/**
 * 重置复习配置
 * POST /review/config/reset
 */
function resetReviewConfig() {
  return request.post('/review/config/reset')
}

module.exports = {
  // 领域 & 章节 & 卡片
  getDomains: getDomains,
  getChapters: getChapters,
  getCards: getCards,
  getCardDetail: getCardDetail,
  getCardQuestion: getCardQuestion,
  masterCard: masterCard,
  favoriteCard: favoriteCard,
  getCardStatus: getCardStatus,
  getFavorites: getFavorites,
  getProgress: getProgress,
  // 刷题
  getQuizQuestions: getQuizQuestions,
  submitAnswer: submitAnswer,
  getWrongQuestions: getWrongQuestions,
  getDailyChallenge: getDailyChallenge,
  submitDailyChallenge: submitDailyChallenge,
  getQuizStats: getQuizStats,
  errorPractice: errorPractice,
  // 复习
  getReviewToday: getReviewToday,
  completeReview: completeReview,
  getForgotten: getForgotten,
  getReviewConfig: getReviewConfig,
  updateReviewConfig: updateReviewConfig,
  resetReviewConfig: resetReviewConfig
}
