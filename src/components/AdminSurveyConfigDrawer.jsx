import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Edit2, Trash2, X, Save, GripVertical, Plus } from 'lucide-react';
import { apiRequest } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  SURVEY_AUDIENCE,
  SURVEY_KIND,
  flattenAnswerableQuestions,
  isSurveyGroup,
  normalizeSurveyQuestion
} from '../constants/surveyAudience.js';

const emptyChild = () => ({
  text: '',
  type: 'RATING_1_5',
  required: true,
  ratingStyle: 'NUMBER',
  options: ''
});

const emptyForm = {
  text: '',
  kind: SURVEY_KIND.QUESTION,
  type: 'RATING_1_5',
  section: '',
  isActive: true,
  required: true,
  ratingStyle: 'NUMBER',
  options: '',
  parentId: '',
  targetAudience: SURVEY_AUDIENCE.STUDENT,
  children: [emptyChild()]
};

const AUDIENCE_LABELS = {
  [SURVEY_AUDIENCE.STUDENT]: 'Học sinh',
  [SURVEY_AUDIENCE.TEACHER]: 'Giáo viên'
};

const TYPE_LABELS = {
  RATING_1_5: 'Thang điểm 1–5',
  SINGLE_CHOICE: '1 đáp án',
  MULTI_CHOICE: 'Nhiều đáp án',
  TEXT_SHORT: 'Câu mở'
};

function metaLabel(q) {
  if (isSurveyGroup(q)) {
    const count = (q.children || []).length;
    return `GROUP · ${count} câu nhỏ${q.required === false ? '' : ''}`;
  }
  return [
    q.section,
    q.type,
    q.ratingStyle === 'EMOJI' ? 'emoji' : null,
    q.required === false ? 'tuỳ chọn' : null,
    q.parentId ? 'câu con' : null
  ].filter(Boolean).join(' · ');
}

export default function AdminSurveyConfigDrawer({ open, onClose, onChanged, initialAudience = SURVEY_AUDIENCE.STUDENT }) {
  const { token } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [audienceTab, setAudienceTab] = useState(initialAudience);

  useEffect(() => {
    if (!open) return;
    setAudienceTab(initialAudience);
    setEditingId(null);
    setForm({ ...emptyForm, targetAudience: initialAudience, children: [emptyChild()] });
    setError('');
    loadQuestions();
  }, [open, initialAudience, token]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const loadQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest('/admin/survey-questions', { token });
      setQuestions((res.data || []).map(normalizeSurveyQuestion));
    } catch (e) {
      setError(e.message || 'Không tải được danh sách câu hỏi.');
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = useMemo(
    () => questions.filter((q) => (q.targetAudience || SURVEY_AUDIENCE.STUDENT) === audienceTab),
    [questions, audienceTab]
  );

  const groupOptions = useMemo(
    () => filteredQuestions.filter((q) => isSurveyGroup(q) && q.id !== editingId),
    [filteredQuestions, editingId]
  );

  const answerableCount = useMemo(
    () => flattenAnswerableQuestions(filteredQuestions).length,
    [filteredQuestions]
  );

  const notifyChanged = () => {
    if (onChanged) onChanged();
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, targetAudience: audienceTab, children: [emptyChild()] });
  };

  const isGroup = form.kind === SURVEY_KIND.GROUP;
  const needsOptions = !isGroup && (form.type === 'SINGLE_CHOICE' || form.type === 'MULTI_CHOICE');

  const buildChildPayload = (child) => {
    const type = child.type || 'RATING_1_5';
    const needsChildOptions = type === 'SINGLE_CHOICE' || type === 'MULTI_CHOICE';
    return {
      text: child.text.trim(),
      kind: SURVEY_KIND.QUESTION,
      type,
      required: child.required !== false,
      ratingStyle: type === 'RATING_1_5' ? (child.ratingStyle || 'NUMBER') : null,
      options: needsChildOptions
        ? String(child.options || '').split(',').map((s) => s.trim()).filter(Boolean)
        : null
    };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      text: form.text.trim(),
      kind: form.kind || SURVEY_KIND.QUESTION,
      type: isGroup ? null : form.type,
      section: form.section.trim() || null,
      isActive: form.isActive,
      required: isGroup ? false : form.required,
      targetAudience: form.targetAudience,
      parentId: isGroup ? null : (form.parentId || null),
      ratingStyle: !isGroup && form.type === 'RATING_1_5' ? form.ratingStyle : null,
      options: needsOptions
        ? form.options.split(',').map((s) => s.trim()).filter(Boolean)
        : null
    };

    if (!payload.text) {
      setError('Nhập nội dung câu hỏi / nhóm.');
      return;
    }

    if (needsOptions && (!payload.options || payload.options.length < 2)) {
      setError('Cần ít nhất 2 đáp án (cách nhau bởi dấu phẩy).');
      return;
    }

    if (isGroup) {
      const children = (form.children || [])
        .map(buildChildPayload)
        .filter((child) => child.text);
      if (!children.length) {
        setError('Nhóm cần ít nhất một câu hỏi nhỏ.');
        return;
      }
      for (const child of children) {
        if ((child.type === 'SINGLE_CHOICE' || child.type === 'MULTI_CHOICE') && (!child.options || child.options.length < 2)) {
          setError(`Câu nhỏ “${child.text}” cần ít nhất 2 đáp án.`);
          return;
        }
      }
      payload.children = children;
    }

    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await apiRequest('/admin/survey-questions/' + editingId, { method: 'PUT', token, body: payload });
      } else {
        await apiRequest('/admin/survey-questions', { method: 'POST', token, body: payload });
      }
      resetForm();
      await loadQuestions();
      notifyChanged();
    } catch (err) {
      setError(err.message || 'Lỗi lưu câu hỏi.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    setError('');
    try {
      await apiRequest('/admin/survey-questions/' + id + '/status', {
        method: 'PATCH',
        token,
        body: { isActive: !currentStatus }
      });
      await loadQuestions();
      notifyChanged();
    } catch (err) {
      setError(err.message || 'Không đổi được trạng thái.');
    }
  };

  const handleDelete = async (id, isGroupItem = false) => {
    const message = isGroupItem
      ? 'Xoá nhóm này sẽ xoá luôn các câu hỏi nhỏ bên trong. Tiếp tục?'
      : 'Ẩn/xoá câu hỏi này? Phiếu cũ vẫn giữ câu trả lời lịch sử.';
    if (!window.confirm(message)) return;
    setError('');
    try {
      await apiRequest('/admin/survey-questions/' + id, { method: 'DELETE', token });
      if (editingId === id) resetForm();
      await loadQuestions();
      notifyChanged();
    } catch (err) {
      setError(err.message || 'Không xoá được câu hỏi.');
    }
  };

  const startEdit = (q) => {
    setEditingId(q.id);
    setForm({
      text: q.text || '',
      kind: q.kind || SURVEY_KIND.QUESTION,
      type: q.type || 'RATING_1_5',
      section: q.section || '',
      isActive: q.isActive !== false,
      required: q.required !== false,
      ratingStyle: q.ratingStyle || 'NUMBER',
      targetAudience: q.targetAudience || SURVEY_AUDIENCE.STUDENT,
      parentId: q.parentId || '',
      options: Array.isArray(q.options) ? q.options.join(', ') : '',
      children: isSurveyGroup(q) && q.children?.length
        ? q.children.map((child) => ({
          text: child.text || '',
          type: child.type || 'RATING_1_5',
          required: child.required !== false,
          ratingStyle: child.ratingStyle || 'NUMBER',
          options: Array.isArray(child.options) ? child.options.join(', ') : ''
        }))
        : [emptyChild()]
    });
    if (q.targetAudience && q.targetAudience !== audienceTab) {
      setAudienceTab(q.targetAudience);
    }
    requestAnimationFrame(() => {
      document.getElementById('survey-config-item-' + q.id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      document.getElementById('survey-config-question-text')?.focus({ preventScroll: true });
    });
  };

  const updateChild = (index, patch) => {
    setForm((current) => ({
      ...current,
      children: current.children.map((child, i) => (i === index ? { ...child, ...patch } : child))
    }));
  };

  const renderQuestionRow = (q, { nested = false } = {}) => (
    <div
      key={q.id}
      id={'survey-config-item-' + q.id}
      className={
        'survey-config-item'
        + (nested ? ' is-child' : '')
        + (q.isActive ? '' : ' is-inactive')
        + (editingId === q.id ? ' is-editing' : '')
      }
    >
      <button type="button" className="survey-config-item-main" onClick={() => startEdit(q)}>
        <GripVertical size={20} color="#94a3b8" aria-hidden="true" />
        <span className="survey-config-item-copy">
          <span className="survey-config-item-meta">{metaLabel(q)}</span>
          <span className="survey-config-item-text">{q.text}</span>
          {q.options?.length > 0 && <small>Đáp án: {q.options.join(', ')}</small>}
        </span>
      </button>
      <div className="survey-config-item-actions">
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); toggleStatus(q.id, q.isActive); }}
          className="text-button"
        >
          {q.isActive ? 'Ẩn' : 'Bật'}
        </button>
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); startEdit(q); }}
          className={'button button-secondary survey-config-edit-btn' + (editingId === q.id ? ' is-active' : '')}
          aria-label={'Sửa: ' + q.text}
        >
          <Edit2 size={15} /> Sửa
        </button>
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); handleDelete(q.id, isSurveyGroup(q)); }}
          className="icon-button danger-icon-button"
          aria-label={'Xoá: ' + q.text}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  if (!open) return null;

  return createPortal(
    <div
      className="survey-config-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="survey-config-title"
    >
      <div className="survey-config-drawer">
        <header className="survey-config-drawer-header">
          <div>
            <span className="section-kicker">Tuỳ chỉnh nâng cao</span>
            <h2 id="survey-config-title">Bộ câu hỏi khảo sát</h2>
            <p className="survey-config-drawer-sub">
              Hỗ trợ nhóm (GROUP) chứa câu hỏi nhỏ. Thay đổi áp dụng ngay cho phiếu mới.
            </p>
          </div>
          <div className="survey-config-drawer-header-actions">
            <div className="survey-admin-tabs survey-config-audience-tabs" role="tablist">
              {Object.entries(AUDIENCE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={audienceTab === key}
                  className={'survey-admin-tab' + (audienceTab === key ? ' is-active' : '')}
                  onClick={() => { setAudienceTab(key); if (!editingId) setForm((f) => ({ ...f, targetAudience: key })); }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="button button-secondary" onClick={onClose} type="button">
              <X size={18} /> Đóng
            </button>
          </div>
        </header>

        {error && <div className="form-error survey-config-error">{error}</div>}

        <div className="survey-config-drawer-body">
          <div className="survey-config-list">
            <h3>Danh sách — {AUDIENCE_LABELS[audienceTab]} ({answerableCount} câu trả lời · {filteredQuestions.length} mục)</h3>
            <div className="survey-config-list-scroll">
              {loading ? <p>Đang tải...</p> : filteredQuestions.map((q) => (
                <div key={q.id} className="survey-config-node">
                  {renderQuestionRow(q)}
                  {isSurveyGroup(q) && (q.children || []).map((child) => renderQuestionRow(child, { nested: true }))}
                </div>
              ))}
              {!loading && filteredQuestions.length === 0 && <p className="muted">Chưa có câu hỏi cho nhóm này.</p>}
            </div>
          </div>

          <form id="survey-config-form-panel" className="survey-config-form" onSubmit={handleSave}>
            <h3>{editingId ? 'Sửa' : 'Thêm mới'} — {AUDIENCE_LABELS[form.targetAudience]}</h3>

            <label>Loại mục
              <select
                value={form.kind}
                onChange={(e) => setForm({
                  ...form,
                  kind: e.target.value,
                  parentId: e.target.value === SURVEY_KIND.GROUP ? '' : form.parentId,
                  required: e.target.value === SURVEY_KIND.GROUP ? false : form.required
                })}
              >
                <option value={SURVEY_KIND.QUESTION}>Câu hỏi (trả lời được)</option>
                <option value={SURVEY_KIND.GROUP}>Nhóm chứa câu hỏi nhỏ</option>
              </select>
            </label>

            <label>{isGroup ? 'Tiêu đề nhóm' : 'Nội dung câu hỏi'}
              <input
                id="survey-config-question-text"
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                required
              />
            </label>

            {!isGroup && (
              <label>Nhóm tiêu chí (Section)
                <input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="VD: I. MỨC ĐỘ HỨNG THÚ" />
              </label>
            )}

            <div className="survey-config-form-row">
              <label>Đối tượng
                <select value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}>
                  <option value={SURVEY_AUDIENCE.STUDENT}>Học sinh</option>
                  <option value={SURVEY_AUDIENCE.TEACHER}>Giáo viên</option>
                </select>
              </label>
              {!isGroup && (
                <label>Thuộc nhóm (tuỳ chọn)
                  <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                    <option value="">— Đứng độc lập —</option>
                    {groupOptions.map((group) => (
                      <option key={group.id} value={group.id}>{group.text}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {!isGroup && (
              <>
                <div className="survey-config-form-row">
                  <label>Loại câu hỏi
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="RATING_1_5">Thang điểm 1–5</option>
                      <option value="SINGLE_CHOICE">Trắc nghiệm 1 đáp án</option>
                      <option value="MULTI_CHOICE">Trắc nghiệm nhiều đáp án</option>
                      <option value="TEXT_SHORT">Câu trả lời mở (ngắn)</option>
                    </select>
                  </label>
                  {form.type === 'RATING_1_5' && (
                    <label>Kiểu hiển thị
                      <select value={form.ratingStyle} onChange={(e) => setForm({ ...form, ratingStyle: e.target.value })}>
                        <option value="NUMBER">Số (Mức 1–5)</option>
                        <option value="EMOJI">Biểu cảm (emoji)</option>
                      </select>
                    </label>
                  )}
                </div>
                <div className="survey-config-form-row">
                  <label>Bắt buộc
                    <select value={String(form.required)} onChange={(e) => setForm({ ...form, required: e.target.value === 'true' })}>
                      <option value="true">Có</option>
                      <option value="false">Không</option>
                    </select>
                  </label>
                  <label>Trạng thái
                    <select value={String(form.isActive)} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}>
                      <option value="true">Đang hiển thị</option>
                      <option value="false">Tạm ẩn</option>
                    </select>
                  </label>
                </div>
                {needsOptions && (
                  <label>Danh sách đáp án (cách nhau bởi dấu phẩy)
                    <input value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} required placeholder="Rất dễ, Bình thường, Khó" />
                  </label>
                )}
              </>
            )}

            {isGroup && (
              <>
                <label>Trạng thái nhóm
                  <select value={String(form.isActive)} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}>
                    <option value="true">Đang hiển thị</option>
                    <option value="false">Tạm ẩn (ẩn cả câu con)</option>
                  </select>
                </label>
                <div className="survey-config-children">
                  <div className="survey-config-children-head">
                    <strong>Câu hỏi nhỏ trong nhóm</strong>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setForm({ ...form, children: [...form.children, emptyChild()] })}
                    >
                      <Plus size={16} /> Thêm câu nhỏ
                    </button>
                  </div>
                  {form.children.map((child, index) => (
                    <div key={index} className="survey-config-child-card">
                      <label>Nội dung
                        <input value={child.text} onChange={(e) => updateChild(index, { text: e.target.value })} placeholder={'Câu nhỏ #' + (index + 1)} />
                      </label>
                      <div className="survey-config-form-row">
                        <label>Loại
                          <select value={child.type} onChange={(e) => updateChild(index, { type: e.target.value })}>
                            {Object.entries(TYPE_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </label>
                        {child.type === 'RATING_1_5' && (
                          <label>Hiển thị
                            <select value={child.ratingStyle} onChange={(e) => updateChild(index, { ratingStyle: e.target.value })}>
                              <option value="NUMBER">Số</option>
                              <option value="EMOJI">Emoji</option>
                            </select>
                          </label>
                        )}
                        <label>Bắt buộc
                          <select value={String(child.required !== false)} onChange={(e) => updateChild(index, { required: e.target.value === 'true' })}>
                            <option value="true">Có</option>
                            <option value="false">Không</option>
                          </select>
                        </label>
                      </div>
                      {(child.type === 'SINGLE_CHOICE' || child.type === 'MULTI_CHOICE') && (
                        <label>Đáp án (phẩy)
                          <input value={child.options} onChange={(e) => updateChild(index, { options: e.target.value })} placeholder="A, B, C" />
                        </label>
                      )}
                      {form.children.length > 1 && (
                        <button type="button" className="text-button" onClick={() => setForm({ ...form, children: form.children.filter((_, i) => i !== index) })}>
                          Gỡ câu nhỏ
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="survey-config-form-actions">
              <button type="submit" className="button button-primary" disabled={saving}>
                <Save size={18} /> {editingId ? 'Lưu thay đổi' : (isGroup ? 'Thêm nhóm' : 'Thêm câu hỏi')}
              </button>
              {editingId && <button type="button" className="button button-secondary" onClick={resetForm}>Huỷ</button>}
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
