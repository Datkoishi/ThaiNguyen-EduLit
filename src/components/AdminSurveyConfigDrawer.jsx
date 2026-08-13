import { useEffect, useState } from 'react';
import { Edit2, Trash2, X, Save, GripVertical } from 'lucide-react';
import { apiRequest } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { text: '', type: 'RATING_1_5', section: '', isActive: true, options: '' };

export default function AdminSurveyConfigDrawer({ open, onClose, onChanged }) {
  const { token } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) loadQuestions();
  }, [open, token]);

  const loadQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest('/admin/survey-questions', { token });
      setQuestions(res.data || []);
    } catch (e) {
      setError(e.message || 'Không tải được danh sách câu hỏi.');
    } finally {
      setLoading(false);
    }
  };

  const notifyChanged = () => {
    if (onChanged) onChanged();
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      text: form.text.trim(),
      type: form.type,
      section: form.section.trim(),
      isActive: form.isActive,
      options: form.type === 'SINGLE_CHOICE'
        ? form.options.split(',').map(s => s.trim()).filter(Boolean)
        : null
    };

    if (payload.type === 'SINGLE_CHOICE' && payload.options.length < 2) {
      setError('Trắc nghiệm cần ít nhất 2 đáp án (cách nhau bởi dấu phẩy).');
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
      options: Array.isArray(q.options) ? q.options.join(', ') : ''
    });
  };

  if (!open) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
      <div className="operation-drawer" style={{ zIndex: 1001, width: 600, padding: 0, display: 'flex', flexDirection: 'column' }}>
        <header className="panel-heading" style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="section-kicker">Tuỳ chỉnh nâng cao</span>
            <h2>Bộ câu hỏi khảo sát</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button"><X size={24} /></button>
        </header>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

          <form className="operation-form-grid" onSubmit={handleSave} style={{ marginBottom: '32px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: 16, marginBottom: 16, marginTop: 0 }}>{editingId ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h3>
            <label>Nội dung câu hỏi
              <input value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} required placeholder="VD: Giao diện có dễ nhìn không?" />
            </label>
            <label>Nhóm tiêu chí (Section)
              <input value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} required placeholder="VD: III. GIAO DIỆN & SỬ DỤNG" />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label>Loại câu hỏi
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="RATING_1_5">Đánh giá sao (1-5)</option>
                  <option value="SINGLE_CHOICE">Trắc nghiệm 1 đáp án</option>
                  <option value="TEXT_SHORT">Điền chữ (ngắn)</option>
                </select>
              </label>
              <label>Trạng thái
                <select value={String(form.isActive)} onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}>
                  <option value="true">Đang hiển thị</option>
                  <option value="false">Tạm ẩn</option>
                </select>
              </label>
            </div>

            {form.type === 'SINGLE_CHOICE' && (
              <label>Danh sách đáp án (cách nhau bởi dấu phẩy)
                <input value={form.options} onChange={e => setForm({ ...form, options: e.target.value })} required placeholder="Rất đẹp, Bình thường, Xấu" />
              </label>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button type="submit" className="button button-primary" disabled={saving}>
                <Save size={18} /> {editingId ? 'Lưu thay đổi' : 'Thêm câu hỏi'}
              </button>
              {editingId && (
                <button type="button" className="button button-secondary" onClick={resetForm}>Huỷ</button>
              )}
            </div>
          </form>

          <div className="questions-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: 16, margin: 0 }}>Danh sách câu hỏi hiện tại ({questions.length})</h3>
            {loading ? <p>Đang tải...</p> : questions.map(q => (
              <div key={q.id} style={{ display: 'flex', alignItems: 'flex-start', padding: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, gap: 12, opacity: q.isActive ? 1 : 0.6 }}>
                <GripVertical size={20} color="#94a3b8" style={{ marginTop: 4 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{q.section} • {q.type}</div>
                  <div style={{ fontWeight: 500 }}>{q.text}</div>
                  {q.type === 'SINGLE_CHOICE' && q.options?.length > 0 && (
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Đáp án: {q.options.join(', ')}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button type="button" onClick={() => toggleStatus(q.id, q.isActive)} className="text-button" style={{ color: q.isActive ? '#eab308' : '#22c55e', padding: '4px 8px' }}>
                    {q.isActive ? 'Ẩn' : 'Bật'}
                  </button>
                  <button type="button" onClick={() => startEdit(q)} className="icon-button" style={{ padding: 4 }} aria-label="Sửa"><Edit2 size={16} /></button>
                  <button type="button" onClick={() => handleDelete(q.id)} className="icon-button" style={{ padding: 4, color: '#ef4444' }} aria-label="Xoá"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {!loading && questions.length === 0 && <p className="muted">Chưa có câu hỏi nào.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
