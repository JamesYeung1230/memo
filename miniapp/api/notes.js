/**
 * 笔记模块 API
 *
 * 对接 Core Service (:8000)
 */

var request = require('../utils/request')

/**
 * 获取笔记列表
 * GET /notes
 *
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.page_size - 每页条数
 * @param {string} params.keyword - 搜索关键词
 * @param {string} params.audit_status - 审核状态筛选
 */
function listNotes(params) {
  return request.get('/notes', { data: params })
}

/**
 * 创建笔记
 * POST /notes
 *
 * @param {Object} data
 * @param {string} data.title - 标题
 * @param {string} data.content - 内容
 * @param {string} data.tags - 标签（逗号分隔）
 * @param {number} data.card_id - 关联知识卡片 ID
 */
function createNote(data) {
  return request.post('/notes', data)
}

/**
 * 获取笔记详情
 * GET /notes/{noteId}
 */
function getNote(noteId) {
  return request.get('/notes/' + noteId)
}

/**
 * 更新笔记
 * PUT /notes/{noteId}
 */
function updateNote(noteId, data) {
  return request.put('/notes/' + noteId, data)
}

/**
 * 删除笔记
 * DELETE /notes/{noteId}
 */
function deleteNote(noteId) {
  return request.del('/notes/' + noteId)
}

/**
 * 提交审核
 * POST /notes/{noteId}/submit-review
 */
function submitReview(noteId) {
  return request.post('/notes/' + noteId + '/submit-review')
}

/**
 * 撤回审核
 * POST /notes/{noteId}/withdraw-review
 */
function withdrawReview(noteId) {
  return request.post('/notes/' + noteId + '/withdraw-review')
}

/**
 * 获取分享卡片内容
 * GET /notes/{noteId}/share-card
 */
function shareCard(noteId) {
  return request.get('/notes/' + noteId + '/share-card')
}

/**
 * 获取审核状态选项
 * GET /notes/audit-status
 */
function getAuditStatus() {
  return request.get('/notes/audit-status')
}

module.exports = {
  listNotes: listNotes,
  createNote: createNote,
  getNote: getNote,
  updateNote: updateNote,
  deleteNote: deleteNote,
  submitReview: submitReview,
  withdrawReview: withdrawReview,
  shareCard: shareCard,
  getAuditStatus: getAuditStatus
}
