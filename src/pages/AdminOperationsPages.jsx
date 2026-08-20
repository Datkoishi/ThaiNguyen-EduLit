import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  KeyRound,
  LoaderCircle,
  MessageCircle,
  MessageSquareText,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Star,
  Trash2,
  UserCheck,
  UserRound,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api.js';
import { ErrorState, PageLoader } from '../components/Common.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import AdminSurveyConfigDrawer from '../components/AdminSurveyConfigDrawer.jsx';
import { SURVEY_AUDIENCE, flattenAnswerableQuestions, normalizeSurveyQuestion } from '../constants/surveyAudience.js';

const dateTimeLabel = (value) => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—';

const roleLabel = (role) => role === 'ADMIN' ? 'Admin' : role === 'TEACHER' ? 'Giáo viên' : 'Học sinh';
const userStatusLabel = (status) => status === 'ACTIVE' ? 'Đang hoạt động' : status === 'SUSPENDED' ? 'Đã khóa' : status === 'PENDING_VERIFICATION' ? 'Chờ duyệt' : 'Chờ xác thực';

export function AdminUsersPage() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [resetId, setResetId] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', role: 'STUDENT', password: '' });
  const [editForm, setEditForm] = useState({ fullName: '', email: '', role: 'STUDENT', status: 'ACTIVE' });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await apiRequest('/admin/users', { token });
      setUsers(payload.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('vi');
    return users.filter((item) => !term || [item.fullName, item.email, roleLabel(item.role), userStatusLabel(item.status)].join(' ').toLocaleLowerCase('vi').includes(term));
  }, [users, query]);

  const createUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await apiRequest('/admin/users', { method: 'POST', token, body: createForm });
      setCreateForm({ fullName: '', email: '', role: 'STUDENT', password: '' });
      setNotice('Đã tạo và kích hoạt tài khoản mới.');
      await load();
    } catch (requestError) {
      setError(Object.values(requestError.fields || {})[0] || requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (item) => {
    setEditingId(item.id);
    setResetId(null);
    setEditForm({ fullName: item.fullName, email: item.email, role: item.role, status: item.status });
    setNotice('');
    setError('');
  };

  const updateUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await apiRequest('/admin/users/' + editingId, { method: 'PATCH', token, body: editForm });
      setEditingId(null);
      setNotice('Đã cập nhật tài khoản và quyền truy cập.');
      await load();
    } catch (requestError) {
      setError(Object.values(requestError.fields || {})[0] || requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const submitResetPassword = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await apiRequest('/admin/users/' + resetId + '/reset-password', { method: 'POST', token, body: { password: resetPassword } });
      setResetId(null);
      setResetPassword('');
      setNotice('Đã đặt mật khẩu mới và thu hồi các phiên đăng nhập cũ.');
    } catch (requestError) {
      setError(Object.values(requestError.fields || {})[0] || requestError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !users.length) return <PageLoader label="Đang tải tài khoản..." />;
  if (error && !users.length) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="page admin-page">
      <div className="admin-title">
        <div><span className="section-kicker">Danh tính và phân quyền</span><h1>Quản lý tài khoản</h1><p>Tạo tài khoản, đổi vai trò, khóa truy cập và đặt lại mật khẩu an toàn.</p></div>
        <span className="admin-title-stat"><Users size={20} /><strong>{users.length}</strong> tài khoản</span>
      </div>

      <section className="form-section operation-create-panel">
        <div className="form-section-title"><span><Plus size={19} /></span><div><h2>Cấp tài khoản mới</h2><p>Tài khoản do Admin tạo được xác thực và kích hoạt ngay.</p></div></div>
        <form className="operation-form-grid" onSubmit={createUser}>
          <label>Họ và tên<input value={createForm.fullName} onChange={(event) => setCreateForm({ ...createForm, fullName: event.target.value })} required minLength={2} /></label>
          <label>Email<input type="email" value={createForm.email} onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })} required /></label>
          <label>Vai trò<select value={createForm.role} onChange={(event) => setCreateForm({ ...createForm, role: event.target.value })}><option value="STUDENT">Học sinh</option><option value="TEACHER">Giáo viên</option></select></label>
          <label>Mật khẩu tạm<input type="password" value={createForm.password} onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })} required minLength={10} placeholder="Tối thiểu 10 ký tự" /></label>
          <button className="button button-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" size={18} /> : <UserCheck size={18} />} Tạo tài khoản</button>
        </form>
      </section>

      {notice && <div className="inline-notice">{notice}</div>}
      {error && <div className="form-error">{error}</div>}

      <section className="admin-table-card">
        <div className="table-toolbar"><label className="table-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên, email, vai trò..." /></label><span>{filteredUsers.length} kết quả</span></div>
        <div className="table-responsive">
          <table className="admin-table users-table">
            <thead><tr><th>Tài khoản</th><th>Vai trò</th><th>Trường</th><th>Trạng thái</th><th>Ngày tạo</th><th /></tr></thead>
            <tbody>
              {filteredUsers.map((item) => (
                <tr key={item.id}>
                  <td><div className="table-product"><span className="avatar compact-avatar">{item.fullName.slice(0, 1).toUpperCase()}</span><div><strong>{item.fullName}</strong><small>{item.email}</small></div></div></td>
                  <td><span className={'role-chip role-' + item.role.toLowerCase()}>{roleLabel(item.role)}</span></td>
                  <td><span className="school-cell">{item.school || <em>—</em>}</span></td>
                  <td><span className={'status-badge status-' + item.status.toLowerCase()}>{userStatusLabel(item.status)}</span></td>
                  <td>{dateTimeLabel(item.createdAt)}</td>
                  <td>
                    {item.role !== 'ADMIN' && item.id !== currentUser.id && <div className="table-actions">
                      <button className="icon-button" onClick={() => beginEdit(item)} aria-label={'Sửa ' + item.fullName}><Pencil size={17} /></button>
                      <button className="icon-button" onClick={() => { setResetId(item.id); setEditingId(null); setResetPassword(''); }} aria-label={'Đặt lại mật khẩu ' + item.fullName}><KeyRound size={17} /></button>
                    </div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editingId && <section className="operation-drawer">
        <div className="panel-heading"><div><span className="section-kicker">Chỉnh sửa tài khoản</span><h2>{editForm.fullName}</h2></div><button className="text-button" onClick={() => setEditingId(null)}>Đóng</button></div>
        <form className="operation-form-grid" onSubmit={updateUser}>
          <label>Họ và tên<input value={editForm.fullName} onChange={(event) => setEditForm({ ...editForm, fullName: event.target.value })} required /></label>
          <label>Email<input type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} required /></label>
          <label>Vai trò<select value={editForm.role} onChange={(event) => setEditForm({ ...editForm, role: event.target.value })}><option value="STUDENT">Học sinh</option><option value="TEACHER">Giáo viên</option></select></label>
          <label>Trạng thái<select value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}><option value="ACTIVE">Đang hoạt động</option><option value="SUSPENDED">Khóa tài khoản</option></select></label>
          <button className="button button-primary" disabled={saving}><Save size={18} /> Lưu thay đổi</button>
        </form>
      </section>}

      {resetId && <section className="operation-drawer warning-drawer">
        <div className="panel-heading"><div><span className="section-kicker">Bảo mật tài khoản</span><h2>Đặt lại mật khẩu</h2></div><button className="text-button" onClick={() => setResetId(null)}>Đóng</button></div>
        <form className="reset-password-form" onSubmit={submitResetPassword}>
          <label>Mật khẩu mới<input type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} minLength={10} required placeholder="Tối thiểu 10 ký tự" /></label>
          <p>Thao tác này thu hồi toàn bộ refresh token đang hoạt động của tài khoản.</p>
          <button className="button button-primary" disabled={saving}><KeyRound size={18} /> Xác nhận đặt lại</button>
        </form>
      </section>}
    </div>
  );
}

const commentStatusLabel = (status) => status === 'VISIBLE' ? 'Đang hiển thị' : status === 'HIDDEN' ? 'Đã ẩn' : 'Đã xử lý';

export function AdminCommentsPage() {
  const { token } = useAuth();
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [replyBodies, setReplyBodies] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (query.trim()) params.set('q', query.trim());
      const payload = await apiRequest('/admin/comments?' + params.toString(), { token });
      setComments(payload.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token, status]);

  const act = async (comment, body) => {
    setBusyId(comment.id);
    setError('');
    setNotice('');
    try {
      await apiRequest('/admin/comments/' + comment.id, { method: 'PATCH', token, body });
      if (body.action === 'REPLY') setReplyBodies((current) => ({ ...current, [comment.id]: '' }));
      setNotice(body.action === 'REPLY' ? 'Đã gửi phản hồi tới người dùng.' : 'Đã cập nhật trạng thái bình luận.');
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId(null);
    }
  };

  const submitSearch = (event) => { event.preventDefault(); load(); };

  if (loading && !comments.length) return <PageLoader label="Đang tải hộp thư bình luận..." />;

  return (
    <div className="page admin-page">
      <div className="admin-title">
        <div><span className="section-kicker">Trao đổi người dùng</span><h1>Quản lý bình luận</h1><p>Phản hồi câu hỏi, ẩn nội dung vi phạm và đánh dấu công việc đã xử lý.</p></div>
        <span className="admin-title-stat"><MessageCircle size={20} /><strong>{comments.length}</strong> hội thoại</span>
      </div>

      <section className="admin-table-card comment-inbox">
        <div className="comment-inbox-toolbar">
          <form className="table-search" onSubmit={submitSearch}><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm nội dung, người gửi, học liệu..." /><button aria-label="Tìm kiếm"><Search size={16} /></button></form>
          <div className="status-tabs">
            {[['', 'Tất cả'], ['VISIBLE', 'Đang hiển thị'], ['RESOLVED', 'Đã xử lý'], ['HIDDEN', 'Đã ẩn']].map(([value, label]) => <button key={value || 'all'} className={status === value ? 'active' : ''} onClick={() => setStatus(value)}>{label}</button>)}
          </div>
        </div>
        {notice && <div className="inline-notice">{notice}</div>}
        {error && <div className="form-error">{error}</div>}
        <div className="admin-comment-list">
          {comments.map((comment) => (
            <article className={'admin-comment-card comment-' + comment.status.toLowerCase()} key={comment.id}>
              <div className="admin-comment-head">
                <div className="comment-author-block"><span className="avatar compact-avatar">{comment.author.fullName.slice(0, 1).toUpperCase()}</span><div><strong>{comment.author.fullName}</strong><small>{roleLabel(comment.author.role)} · {comment.author.email}</small></div></div>
                <div className="comment-state"><span className={'status-badge status-' + comment.status.toLowerCase()}>{commentStatusLabel(comment.status)}</span><time>{dateTimeLabel(comment.createdAt)}</time></div>
              </div>
              <div className="comment-product-link"><Link to={'/san-pham/' + comment.product.slug}><Eye size={15} /> {comment.product.title}</Link></div>
              <p className="admin-comment-body">{comment.body}</p>
              {comment.replies.length > 0 && <div className="reply-history">
                {comment.replies.map((reply) => <div key={reply.id}><ShieldCheck size={16} /><div><strong>{reply.author.fullName}</strong><p>{reply.body}</p><small>{dateTimeLabel(reply.createdAt)}</small></div></div>)}
              </div>}
              <div className="comment-moderation-actions">
                <button className="button button-secondary button-compact" onClick={() => act(comment, { action: 'SET_STATUS', status: 'VISIBLE' })} disabled={busyId === comment.id || comment.status === 'VISIBLE'}><Eye size={16} /> Hiện</button>
                <button className="button button-secondary button-compact" onClick={() => act(comment, { action: 'SET_STATUS', status: 'RESOLVED' })} disabled={busyId === comment.id || comment.status === 'RESOLVED'}><CheckCircle2 size={16} /> Đã xử lý</button>
                <button className="button button-danger button-compact" onClick={() => act(comment, { action: 'SET_STATUS', status: 'HIDDEN' })} disabled={busyId === comment.id || comment.status === 'HIDDEN'}><Ban size={16} /> Ẩn</button>
              </div>
              <form className="admin-reply-form" onSubmit={(event) => { event.preventDefault(); act(comment, { action: 'REPLY', body: replyBodies[comment.id] || '' }); }}>
                <textarea value={replyBodies[comment.id] || ''} onChange={(event) => setReplyBodies((current) => ({ ...current, [comment.id]: event.target.value }))} maxLength={2000} placeholder="Nhập phản hồi chính thức từ Admin..." required />
                <button className="button button-primary" disabled={busyId === comment.id || !(replyBodies[comment.id] || '').trim()}>{busyId === comment.id ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />} Gửi phản hồi</button>
              </form>
            </article>
          ))}
          {!comments.length && <div className="empty-assets"><MessageCircle size={28} /><p>Không có bình luận phù hợp bộ lọc.</p></div>}
        </div>
      </section>
    </div>
  );
}

const auditActionLabels = {
  PRODUCT_CREATED: 'Tạo học liệu',
  PRODUCT_UPDATED: 'Cập nhật học liệu',
  PRODUCT_STATUS_CHANGED: 'Đổi trạng thái học liệu',
  USER_CREATED: 'Tạo tài khoản',
  USER_UPDATED: 'Cập nhật tài khoản',
  USER_PASSWORD_RESET: 'Đặt lại mật khẩu',
  USER_PROFILE_UPDATED: 'Cập nhật hồ sơ cá nhân',
  USER_PASSWORD_CHANGED: 'Đổi mật khẩu cá nhân',
  COMMENT_REPLIED: 'Phản hồi bình luận',
  COMMENT_STATUS_CHANGED: 'Kiểm duyệt bình luận',
  CATEGORY_CREATED: 'Tạo danh mục',
  CATEGORY_UPDATED: 'Cập nhật danh mục',
  SUBJECT_CREATED: 'Tạo môn học',
  SUBJECT_UPDATED: 'Cập nhật môn học',
  GRADE_CREATED: 'Tạo khối lớp',
  GRADE_UPDATED: 'Cập nhật khối lớp'
};

export function AdminAuditPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    apiRequest('/admin/audit-logs?limit=200', { token })
      .then((payload) => setLogs(payload.data))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);
  if (loading) return <PageLoader label="Đang tải nhật ký hệ thống..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="page admin-page">
      <div className="admin-title">
        <div><span className="section-kicker">Truy vết vận hành</span><h1>Nhật ký quản trị</h1><p>Ghi nhận ai đã thay đổi dữ liệu nào và vào thời điểm nào.</p></div>
        <button className="button button-secondary" onClick={load}><RotateCcw size={17} /> Làm mới</button>
      </div>
      <section className="admin-table-card audit-timeline">
        {logs.map((entry) => <article key={entry.id}>
          <span className="audit-icon"><Clock3 size={18} /></span>
          <div><div className="audit-title"><strong>{auditActionLabels[entry.action] || entry.action}</strong><span>{entry.entityType} #{entry.entityId}</span></div><p>{entry.actor?.fullName || 'Hệ thống'} · {entry.actor?.email || 'Tác vụ tự động'}</p><small>{dateTimeLabel(entry.createdAt)}</small>{entry.metadata && Object.keys(entry.metadata).length > 0 && <code>{JSON.stringify(entry.metadata)}</code>}</div>
        </article>)}
        {!logs.length && <div className="empty-assets"><Clock3 size={28} /><p>Chưa có thao tác quản trị mới trong phiên demo.</p></div>}
      </section>
    </div>
  );
}

const LEVEL_COLORS = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#3b82f6',
  5: '#22c55e'
};

const PRODUCT_LABELS = {
  prod_video: 'Video tương tác',
  prod_comic: 'Truyện tranh số',
  prod_game: 'Trò chơi tương tác',
  prod_simulation: 'Sơ đồ / Mô phỏng'
};

function DistBar({ counts, total }) {
  if (!total) {
    return <div className="survey-dist-bar survey-dist-bar--empty" />;
  }
  return (
    <div className="survey-dist-bar" title={`Tổng ${total} lượt`}>
      {[1, 2, 3, 4, 5].map((level) => {
        const n = counts[level] || 0;
        if (!n) return null;
        return (
          <span
            key={level}
            style={{ width: `${(n / total) * 100}%`, background: LEVEL_COLORS[level] }}
            title={`Mức ${level}: ${n} (${Math.round((n / total) * 100)}%)`}
          />
        );
      })}
    </div>
  );
}

export function AdminSurveyPage() {
  const { token } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [configOpen, setConfigOpen] = useState(false);
  const [adminQuestions, setAdminQuestions] = useState([]);
  const [tab, setTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [audienceFilter, setAudienceFilter] = useState(SURVEY_AUDIENCE.STUDENT);

  const surveyAudienceOf = (survey) => survey.targetAudience || survey.target_audience || SURVEY_AUDIENCE.STUDENT;
  const questionAudienceOf = (question) => question.targetAudience || SURVEY_AUDIENCE.STUDENT;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [surveyPayload, questionPayload] = await Promise.all([
        apiRequest('/admin/surveys', { token }),
        apiRequest('/admin/survey-questions', { token })
      ]);
      setSurveys(surveyPayload.data || []);
      setAdminQuestions((questionPayload.data || []).map(normalizeSurveyQuestion));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const reloadQuestions = async () => {
    try {
      const qPayload = await apiRequest('/admin/survey-questions', { token });
      setAdminQuestions((qPayload.data || []).map(normalizeSurveyQuestion));
    } catch {
      // keep current questions on soft refresh failure
    }
  };

  const deleteSurvey = async (id) => {
    if (!window.confirm('Xoá phiếu khảo sát này?')) return;
    try {
      await apiRequest('/admin/surveys/' + id, { method: 'DELETE', token });
      setSurveys(prev => prev.filter(s => s.id !== id));
      setExpandedId(prev => (prev === id ? null : prev));
    } catch (err) {
      setError(err.message || 'Không xoá được phiếu.');
    }
  };

  useEffect(() => { load(); }, [token]);

  const scopedSurveys = useMemo(
    () => surveys.filter((s) => surveyAudienceOf(s) === audienceFilter),
    [surveys, audienceFilter]
  );

  const scopedTree = useMemo(
    () => adminQuestions.filter((q) => questionAudienceOf(q) === audienceFilter),
    [adminQuestions, audienceFilter]
  );

  const scopedQuestions = useMemo(
    () => flattenAnswerableQuestions(scopedTree),
    [scopedTree]
  );

  const total = scopedSurveys.length;
  let overallSum = 0;
  let qCount = 0;
  const genderDataMap = { Nam: 0, Nữ: 0, Khác: 0 };

  const dynamicQuestionStats = {};
  scopedQuestions.forEach(q => {
    if (q.type === 'RATING_1_5') {
      dynamicQuestionStats[q.id] = { id: q.id, text: q.text, section: q.section, type: q.type, isActive: q.isActive, total: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    } else if (q.type === 'SINGLE_CHOICE' || q.type === 'MULTI_CHOICE') {
      dynamicQuestionStats[q.id] = { id: q.id, text: q.text, section: q.section, type: q.type, isActive: q.isActive, total: 0, answers: {} };
    } else {
      dynamicQuestionStats[q.id] = { id: q.id, text: q.text, section: q.section, type: q.type, isActive: q.isActive, total: 0, answers: [] };
    }
  });

  const productAverages = {
    prod_video: { sum: 0, count: 0 },
    prod_comic: { sum: 0, count: 0 },
    prod_game: { sum: 0, count: 0 },
    prod_simulation: { sum: 0, count: 0 }
  };

  let feedbackCount = 0;

  scopedSurveys.forEach(s => {
    if (s.feedback?.trim()) feedbackCount += 1;
    if (s.gender) {
      if (genderDataMap[s.gender] !== undefined) genderDataMap[s.gender] += 1;
      else genderDataMap.Khác += 1;
    }

    const r = s.ratings || {};
    Object.keys(r).forEach(k => {
      const qObj = dynamicQuestionStats[k];
      if (!qObj) return;

      if (qObj.type === 'RATING_1_5') {
        const score = Number(r[k]);
        if (!Number.isFinite(score)) return;
        overallSum += score;
        qCount += 1;
        qObj[score] = (qObj[score] || 0) + 1;
      } else if (qObj.type === 'SINGLE_CHOICE') {
        qObj.answers[r[k]] = (qObj.answers[r[k]] || 0) + 1;
      } else if (qObj.type === 'MULTI_CHOICE' && Array.isArray(r[k])) {
        r[k].forEach((choice) => {
          qObj.answers[choice] = (qObj.answers[choice] || 0) + 1;
        });
      } else if (r[k]) {
        qObj.answers.push(r[k]);
      }
      qObj.total += 1;
    });

    const pr = s.productRatings || {};
    Object.keys(pr).forEach(k => {
      if (productAverages[k] !== undefined) {
        productAverages[k].sum += Number(pr[k]);
        productAverages[k].count += 1;
      }
    });
  });

  const overallAvg = qCount > 0 ? (overallSum / qCount).toFixed(2) : '—';
  const activeQuestionCount = scopedQuestions.filter(q => q.isActive !== false).length;

  const ratingQuestions = Object.values(dynamicQuestionStats)
    .filter(q => q.type === 'RATING_1_5')
    .map(q => {
      const avg = q.total
        ? Number(((q[1] * 1 + q[2] * 2 + q[3] * 3 + q[4] * 4 + q[5] * 5) / q.total).toFixed(2))
        : null;
      return { ...q, avg };
    })
    .sort((a, b) => (b.avg || 0) - (a.avg || 0));

  const otherQuestions = Object.values(dynamicQuestionStats).filter(q => q.type !== 'RATING_1_5');

  const productRows = Object.keys(PRODUCT_LABELS).map(id => ({
    id,
    label: PRODUCT_LABELS[id],
    avg: productAverages[id].count
      ? Number((productAverages[id].sum / productAverages[id].count).toFixed(2))
      : null,
    count: productAverages[id].count
  }));

  const genderRows = Object.entries(genderDataMap)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({
      name,
      value,
      pct: total ? Math.round((value / total) * 100) : 0
    }));

  const filteredSurveys = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('vi');
    const base = scopedSurveys;
    if (!term) return base;
    return base.filter(s =>
      [s.userFullName, s.userEmail, s.schoolClass, s.gender, s.feedback]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('vi')
        .includes(term)
    );
  }, [scopedSurveys, query]);

  if (loading) return <PageLoader label="Đang tải dữ liệu khảo sát..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="page admin-operations-page survey-admin-page">
      <header className="admin-title">
        <div>
          <span className="section-kicker">Phân tích</span>
          <h1>Kết quả khảo sát</h1>
          <p>Theo dõi điểm theo câu hỏi, loại học liệu và danh sách phiếu đã gửi.</p>
        </div>
        <div className="survey-admin-actions">
          <button type="button" className="button button-primary" onClick={() => setConfigOpen(true)}>
            <Settings2 size={17} /> Cấu hình câu hỏi
          </button>
          <button type="button" className="button button-secondary" onClick={load}>
            <RotateCcw size={17} /> Làm mới
          </button>
        </div>
      </header>

      <div className="survey-admin-tabs survey-audience-filter" role="tablist">
        <button
          type="button"
          className={'survey-admin-tab' + (audienceFilter === SURVEY_AUDIENCE.STUDENT ? ' is-active' : '')}
          onClick={() => setAudienceFilter(SURVEY_AUDIENCE.STUDENT)}
        >
          Học sinh
        </button>
        <button
          type="button"
          className={'survey-admin-tab' + (audienceFilter === SURVEY_AUDIENCE.TEACHER ? ' is-active' : '')}
          onClick={() => setAudienceFilter(SURVEY_AUDIENCE.TEACHER)}
        >
          Giáo viên
        </button>
      </div>

      <div className="metric-grid survey-metric-grid">
        <article className="metric-card">
          <span className="metric-icon"><ClipboardList size={20} /></span>
          <div>
            <span>TỔNG PHIẾU</span>
            <strong>{total}</strong>
            <small>Đã nhận từ học sinh / GV</small>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon tone-green"><Star size={20} /></span>
          <div>
            <span>ĐIỂM TRUNG BÌNH</span>
            <strong>{overallAvg === '—' ? '—' : `${overallAvg}`}</strong>
            <small>{overallAvg === '—' ? 'Chưa có điểm Likert' : 'Trên thang điểm 5'}</small>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon tone-cyan"><Settings2 size={20} /></span>
          <div>
            <span>CÂU HỎI ĐANG HIỆN</span>
            <strong>{activeQuestionCount}</strong>
            <small>Trong tổng {scopedQuestions.length} câu ({audienceFilter === SURVEY_AUDIENCE.STUDENT ? 'HS' : 'GV'})</small>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon tone-pink"><MessageSquareText size={20} /></span>
          <div>
            <span>Ý KIẾN ĐÓNG GÓP</span>
            <strong>{feedbackCount}</strong>
            <small>{total ? `${Math.round((feedbackCount / total) * 100)}% phiếu có góp ý` : 'Chưa có phiếu'}</small>
          </div>
        </article>
      </div>

      <div className="survey-admin-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'overview'}
          className={'survey-admin-tab' + (tab === 'overview' ? ' is-active' : '')}
          onClick={() => setTab('overview')}
        >
          Tổng quan
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'responses'}
          className={'survey-admin-tab' + (tab === 'responses' ? ' is-active' : '')}
          onClick={() => setTab('responses')}
        >
          Danh sách phiếu
          <span className="survey-admin-tab-count">{total}</span>
        </button>
      </div>

      {tab === 'overview' && (
        <div className="survey-admin-layout">
          <section className="admin-table-card survey-admin-main">
            <div className="panel-heading survey-panel-heading">
              <div>
                <span className="section-kicker">Theo câu hỏi</span>
                <h2>Điểm trung bình & phân bố</h2>
              </div>
              <div className="survey-legend">
                {[1, 2, 3, 4, 5].map(level => (
                  <span key={level}><i style={{ background: LEVEL_COLORS[level] }} /> Mức {level}</span>
                ))}
              </div>
            </div>

            {!total ? (
              <div className="survey-empty-hint">
                <ClipboardList size={28} />
                <p>Chưa có phiếu nào. Khi học sinh gửi khảo sát, điểm từng câu sẽ hiện tại đây.</p>
              </div>
            ) : (
              <ul className="survey-question-stats">
                {ratingQuestions.map((q, index) => (
                  <li key={q.id} className="survey-question-stat">
                    <div className="survey-question-stat-top">
                      <div className="survey-question-stat-copy">
                        <span className="survey-question-stat-index">#{index + 1}</span>
                        {q.section && <span className="survey-question-stat-section">{q.section}</span>}
                        <strong title={q.text}>{q.text}</strong>
                      </div>
                      <div className="survey-question-stat-score">
                        <em>{q.avg != null ? q.avg.toFixed(2) : '—'}</em>
                        <span>/ 5 · {q.total} lượt</span>
                      </div>
                    </div>
                    <DistBar counts={q} total={q.total} />
                  </li>
                ))}
                {otherQuestions.map(q => (
                  <li key={q.id} className="survey-question-stat survey-question-stat--other">
                    <div className="survey-question-stat-top">
                      <div className="survey-question-stat-copy">
                        <span className="survey-question-stat-section">{q.section || q.type}</span>
                        <strong title={q.text}>{q.text}</strong>
                      </div>
                      <div className="survey-question-stat-score">
                        <em>{q.total}</em>
                        <span>câu trả lời</span>
                      </div>
                    </div>
                    {(q.type === 'SINGLE_CHOICE' || q.type === 'MULTI_CHOICE') && (
                      <div className="survey-choice-summary">
                        {Object.entries(q.answers || {}).map(([label, count]) => (
                          <span key={label}>{label}: <strong>{count}</strong></span>
                        ))}
                      </div>
                    )}
                    {q.type === 'TEXT_SHORT' && Array.isArray(q.answers) && q.answers.length > 0 && (
                      <div className="survey-choice-summary">
                        {q.answers.slice(0, 3).map((answer, i) => (
                          <span key={i}>“{answer}”</span>
                        ))}
                        {q.answers.length > 3 && <span>+{q.answers.length - 3} khác</span>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="survey-admin-side">
            <section className="admin-table-card">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">Nhân khẩu</span>
                  <h2>Giới tính</h2>
                </div>
              </div>
              {!genderRows.length ? (
                <p className="muted survey-side-empty">Chưa có dữ liệu.</p>
              ) : (
                <ul className="survey-side-list">
                  {genderRows.map(row => (
                    <li key={row.name}>
                      <div className="survey-side-row">
                        <strong>{row.name}</strong>
                        <span>{row.value} · {row.pct}%</span>
                      </div>
                      <div className="survey-side-track">
                        <span style={{ width: `${row.pct}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {audienceFilter === SURVEY_AUDIENCE.STUDENT && (
            <section className="admin-table-card">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">Sản phẩm</span>
                  <h2>Độ hữu ích</h2>
                </div>
              </div>
              <ul className="survey-side-list">
                {productRows.map(row => (
                  <li key={row.id}>
                    <div className="survey-side-row">
                      <strong>{row.label}</strong>
                      <span>{row.avg != null ? `${row.avg} / 5` : '—'}</span>
                    </div>
                    <div className="survey-side-track survey-side-track--product">
                      <span style={{ width: `${row.avg != null ? (row.avg / 5) * 100 : 0}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
            )}

            <section className="admin-table-card survey-config-card">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">Quản lý</span>
                  <h2>Bộ câu hỏi</h2>
                </div>
              </div>
              <p className="survey-config-copy">Thêm, sửa, ẩn hoặc xoá câu hỏi khảo sát. Thay đổi áp dụng ngay cho phiếu mới.</p>
              <button type="button" className="button button-primary" onClick={() => setConfigOpen(true)}>
                <Settings2 size={17} /> Mở cấu hình
              </button>
            </section>
          </aside>
        </div>
      )}

      {tab === 'responses' && (
        <section className="admin-table-card">
          <div className="table-toolbar survey-responses-toolbar">
            <div>
              <h3>Danh sách phiếu</h3>
              <span>{filteredSurveys.length} / {total} kết quả</span>
            </div>
            <label className="survey-search">
              <Search size={16} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Tìm tên, email, lớp, góp ý…"
              />
            </label>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Học sinh</th>
                  <th>Lớp</th>
                  <th>Ngày gửi</th>
                  <th>Góp ý</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredSurveys.map(s => {
                  const open = expandedId === s.id;
                  return (
                    <Fragment key={s.id}>
                      <tr>
                        <td>
                          <strong>{s.userFullName || '—'}</strong>
                          <small>{s.userEmail || '—'}</small>
                        </td>
                        <td>{s.schoolClass || '—'} · {s.gender || '—'}</td>
                        <td>{dateTimeLabel(s.createdAt)}</td>
                        <td>
                          {s.feedback ? (
                            <button
                              type="button"
                              className="text-button survey-feedback-preview"
                              onClick={() => setExpandedId(open ? null : s.id)}
                            >
                              {s.feedback.length > 60 ? s.feedback.slice(0, 60) + '…' : s.feedback}
                            </button>
                          ) : (
                            <em className="muted">Không có</em>
                          )}
                        </td>
                        <td className="survey-row-actions">
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => setExpandedId(open ? null : s.id)}
                            aria-label="Xem chi tiết"
                          >
                            <Eye size={17} />
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => deleteSurvey(s.id)}
                            aria-label="Xoá phiếu"
                          >
                            <Trash2 size={17} />
                          </button>
                        </td>
                      </tr>
                      {open && (
                        <tr className="survey-detail-row">
                          <td colSpan={5}>
                            <div className="survey-detail-panel">
                              {s.feedback && (
                                <div>
                                  <span className="section-kicker">Ý kiến</span>
                                  <p>{s.feedback}</p>
                                </div>
                              )}
                              <div>
                                <span className="section-kicker">Điểm câu hỏi</span>
                                <ul className="survey-detail-ratings">
                                  {scopedQuestions.map(q => (
                                    <li key={q.id}>
                                      <span>{q.text}</span>
                                      <strong>{Array.isArray(s.ratings?.[q.id]) ? s.ratings[q.id].join(', ') : (s.ratings?.[q.id] ?? '—')}</strong>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              {audienceFilter === SURVEY_AUDIENCE.STUDENT && (
                              <div>
                                <span className="section-kicker">Sản phẩm</span>
                                <ul className="survey-detail-ratings">
                                  {Object.entries(PRODUCT_LABELS).map(([id, label]) => (
                                    <li key={id}>
                                      <span>{label}</span>
                                      <strong>{s.productRatings?.[id] ?? '—'}</strong>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {filteredSurveys.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      {total ? 'Không có phiếu khớp từ khoá tìm kiếm.' : 'Chưa có khảo sát nào được gửi.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <AdminSurveyConfigDrawer
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        onChanged={reloadQuestions}
        initialAudience={audienceFilter}
      />
    </div>
  );
}
