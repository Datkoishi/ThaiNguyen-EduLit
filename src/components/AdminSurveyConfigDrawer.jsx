import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Edit2, Trash2, X, Save, GripVertical } from 'lucide-react';
import { apiRequest } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { SURVEY_AUDIENCE, normalizeSurveyQuestion } from '../constants/surveyAudience.js';

const emptyForm = {
  text: '',
  type: 'RATING_1_5',
  section: '',
  isActive: true,
  required: true,
  ratingStyle: 'NUMBER',
  options: '',
  targetAudience: SURVEY_AUDIENCE.STUDENT
};

const AUDIENCE_LABELS = {
  [SURVEY_AUDIENCE.STUDENT]: 'Học sinh',
  [SURVEY_AUDIENCE.TEACHER]: 'Giáo viên'
};

export default function AdminSurveyConfigDrawer({ open, onClose, onChanged }) {
  const { token } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [audienceTab, setAudienceTab] = useState(SURVEY_AUDIENCE.STUDENT);

  useEffect(() => {
    if (open) loadQuestions();
  }, [open, token]);

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

  const notifyChanged = () => {
    if (onChanged) onChanged();
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, targetAudience: audienceTab });
  };

  const needsOptions = form.type === 'SINGLE_CHOICE' || form.type === 'MULTI_CHOICE';

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      text: form.text.trim(),
      type: form.type,
      section: form.section.trim(),
      isActive: form.isActive,
      required: form.required,
      targetAudience: form.targetAudience,
      ratingStyle: form.type === 'RATING_1_5' ? form.ratingStyle : null,
      options: needsOptions
        ? form.options.split(',').map((s) => s.trim()).filter(Boolean)
        : null
    };

    if (needsOptions && payload.options.length < 2) {
      setError('Cần ít nhất 2 đáp án (cách nhau bởi dấu phẩy).');
      return;
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

  const handleDelete = async (id) => {
    if (!window.confirm('Ẩn/xoá câu hỏi này? Phiếu cũ vẫn giữ câu trả lời lịch sử.')) return;
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
      text: q.text,
      type: q.type || 'RATING_1_5',
      section: q.section || '',
      isActive: q.isActive !== false,
      required: q.required !== false,
      ratingStyle: q.ratingStyle || 'NUMBER',
      targetAudience: q.targetAudience || SURVEY_AUDIENCE.STUDENT,
      options: Array.isArray(q.options) ? q.options.join(', ') : ''
    });
  };

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
            <p className="survey-config-drawer-sub">Quản lý riêng bộ câu hỏi Học sinh và Giáo viên. Thay đổi áp dụng ngay cho phiếu mới.</p>
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
          <form className="survey-config-form" onSubmit={handleSave}>
            <h3>{editingId ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'} — {AUDIENCE_LABELS[form.targetAudience]}</h3>
            <label>Nội dung câu hỏi
              <input value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required />
            </label>
            <label>Nhóm tiêu chí (Section)
              <input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} required placeholder="VD: I. MỨC ĐỘ HỨNG THÚ" />
            </label>
            <div className="survey-config-form-row">
              <label>Đối tượng
                <select value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}>
                  <option value={SURVEY_AUDIENCE.STUDENT}>Học sinh</option>
                  <option value={SURVEY_AUDIENCE.TEACHER}>Giáo viên</option>
                </select>
              </label>
              <label>Loại câu hỏi
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="RATING_1_5">Thang điểm 1–5</option>
                  <option value="SINGLE_CHOICE">Trắc nghiệm 1 đáp án</option>
                  <option value="MULTI_CHOICE">Trắc nghiệm nhiều đáp án</option>
                  <option value="TEXT_SHORT">Câu trả lời mở (ngắn)</option>
                </select>
              </label>
            </div>
            <div className="survey-config-form-row">
              {form.type === 'RATING_1_5' && (
                <label>Kiểu hiển thị
                  <select value={form.ratingStyle} onChange={(e) => setForm({ ...form, ratingStyle: e.target.value })}>
                    <option value="NUMBER">Số (Mức 1–5)</option>
                    <option value="EMOJI">Biểu cảm (emoji)</option>
                  </select>
                </label>
              )}
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

            <div className="survey-config-form-actions">
              <button type="submit" className="button button-primary" disabled={saving}>
                <Save size={18} /> {editingId ? 'Lưu thay đổi' : 'Thêm câu hỏi'}
              </button>
              {editingId && <button type="button" className="button button-secondary" onClick={resetForm}>Huỷ</button>}
            </div>
          </form>

          <div className="survey-config-list">
            <h3>Danh sách — {AUDIENCE_LABELS[audienceTab]} ({filteredQuestions.length})</h3>
            <div className="survey-config-list-scroll">
              {loading ? <p>Đang tải...</p> : filteredQuestions.map((q) => (
                <div key={q.id} className={'survey-config-item' + (q.isActive ? '' : ' is-inactive')}>
                  <GripVertical size={20} color="#94a3b8" />
                  <div className="survey-config-item-copy">
                    <div className="survey-config-item-meta">{q.section} • {q.type}{q.ratingStyle === 'EMOJI' ? ' • emoji' : ''}{q.required === false ? ' • tuỳ chọn' : ''}</div>
                    <div>{q.text}</div>
                    {q.options?.length > 0 && <small>Đáp án: {q.options.join(', ')}</small>}
                  </div>
                  <div className="survey-config-item-actions">
                    <button type="button" onClick={() => toggleStatus(q.id, q.isActive)} className="text-button">
                      {q.isActive ? 'Ẩn' : 'Bật'}
                    </button>
                    <button type="button" onClick={() => startEdit(q)} className="icon-button" aria-label="Sửa"><Edit2 size={16} /></button>
                    <button type="button" onClick={() => handleDelete(q.id)} className="icon-button danger-icon-button" aria-label="Xoá"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              {!loading && filteredQuestions.length === 0 && <p className="muted">Chưa có câu hỏi cho nhóm này.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
