import { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  KeyRound,
  LoaderCircle,
  MessageCircle,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  ShieldCheck,
  UserCheck,
  UserRound,
  Users,
  Settings2,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api.js';
import { ErrorState, PageLoader } from '../components/Common.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import AdminSurveyConfigDrawer from '../components/AdminSurveyConfigDrawer.jsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

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

export function AdminSurveyPage() {
  const { token } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [configOpen, setConfigOpen] = useState(false);
  const [adminQuestions, setAdminQuestions] = useState([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [surveyPayload, questionPayload] = await Promise.all([
        apiRequest('/admin/surveys', { token }),
        apiRequest('/admin/survey-questions', { token })
      ]);
      setSurveys(surveyPayload.data || []);
      setAdminQuestions(questionPayload.data || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const reloadQuestions = async () => {
    try {
      const qPayload = await apiRequest('/admin/survey-questions', { token });
      setAdminQuestions(qPayload.data || []);
    } catch {
      // keep current questions on soft refresh failure
    }
  };

  const deleteSurvey = async (id) => {
    if (!window.confirm('Xoá phiếu khảo sát này?')) return;
    try {
      await apiRequest('/admin/surveys/' + id, { method: 'DELETE', token });
      setSurveys(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err.message || 'Không xoá được phiếu.');
    }
  };

  useEffect(() => { load(); }, [token]);

  // Compute statistics
  const total = surveys.length;
  let overallSum = 0;
  let qCount = 0;

  const genderDataMap = { 'Nam': 0, 'Nữ': 0, 'Khác': 0 };

  const dynamicQuestionStats = {};
  adminQuestions.forEach(q => {
    if (q.type === 'RATING_1_5') {
      dynamicQuestionStats[q.id] = { id: q.id, text: q.text, type: q.type, total: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    } else if (q.type === 'SINGLE_CHOICE') {
      dynamicQuestionStats[q.id] = { id: q.id, text: q.text, type: q.type, total: 0, answers: {} };
    } else {
      dynamicQuestionStats[q.id] = { id: q.id, text: q.text, type: q.type, total: 0, answers: [] };
    }
  });

  const productAverages = {
    prod_video: { sum: 0, count: 0 },
    prod_comic: { sum: 0, count: 0 },
    prod_game: { sum: 0, count: 0 },
    prod_simulation: { sum: 0, count: 0 }
  };

  surveys.forEach(s => {
    if (s.gender) {
      if (genderDataMap[s.gender] !== undefined) genderDataMap[s.gender]++;
      else genderDataMap['Khác']++;
    }

    const r = s.ratings || {};
    Object.keys(r).forEach(k => {
      const qObj = dynamicQuestionStats[k];
      if (!qObj) return;

      if (qObj.type === 'RATING_1_5') {
        const score = Number(r[k]);
        if (!Number.isFinite(score)) return;
        overallSum += score;
        qCount++;
        qObj[score] = (qObj[score] || 0) + 1;
      } else if (qObj.type === 'SINGLE_CHOICE') {
        qObj.answers[r[k]] = (qObj.answers[r[k]] || 0) + 1;
      } else if (r[k]) {
        qObj.answers.push(r[k]);
      }
      qObj.total++;
    });

    const pr = s.productRatings || {};
    Object.keys(pr).forEach(k => {
      if (productAverages[k] !== undefined) {
        productAverages[k].sum += Number(pr[k]);
        productAverages[k].count++;
      }
    });
  });

  const overallAvg = qCount > 0 ? (overallSum / qCount).toFixed(2) : 0;

  const pieData = Object.keys(genderDataMap)
    .filter(k => genderDataMap[k] > 0)
    .map(k => ({ name: k, value: genderDataMap[k] }));

  const questionBarData = Object.values(dynamicQuestionStats).filter(q => q.type === 'RATING_1_5').map(q => {
    if (q.total === 0) return { name: q.text, 'Mức 1': 0, 'Mức 2': 0, 'Mức 3': 0, 'Mức 4': 0, 'Mức 5': 0, raw1: 0, raw2: 0, raw3: 0, raw4: 0, raw5: 0, avg: 0 };
    return {
      name: q.text,
      'Mức 1': Number(((q[1] / q.total) * 100).toFixed(1)),
      'Mức 2': Number(((q[2] / q.total) * 100).toFixed(1)),
      'Mức 3': Number(((q[3] / q.total) * 100).toFixed(1)),
      'Mức 4': Number(((q[4] / q.total) * 100).toFixed(1)),
      'Mức 5': Number(((q[5] / q.total) * 100).toFixed(1)),
      raw1: q[1], raw2: q[2], raw3: q[3], raw4: q[4], raw5: q[5],
      avg: Number(((q[1]*1 + q[2]*2 + q[3]*3 + q[4]*4 + q[5]*5) / q.total).toFixed(2))
    };
  });

  const productBarData = [
    { name: 'Video', 'Điểm TB': productAverages.prod_video.count > 0 ? Number((productAverages.prod_video.sum / productAverages.prod_video.count).toFixed(2)) : 0 },
    { name: 'Truyện số', 'Điểm TB': productAverages.prod_comic.count > 0 ? Number((productAverages.prod_comic.sum / productAverages.prod_comic.count).toFixed(2)) : 0 },
    { name: 'Trò chơi', 'Điểm TB': productAverages.prod_game.count > 0 ? Number((productAverages.prod_game.sum / productAverages.prod_game.count).toFixed(2)) : 0 },
    { name: 'Sơ đồ', 'Điểm TB': productAverages.prod_simulation.count > 0 ? Number((productAverages.prod_simulation.sum / productAverages.prod_simulation.count).toFixed(2)) : 0 }
  ];

  const PIE_COLORS = ['#3b82f6', '#ec4899', '#8b5cf6'];

  if (loading) return <PageLoader label="Đang tải dữ liệu khảo sát..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="page admin-operations-page">
      <header className="admin-title">
        <div>
          <span className="section-kicker">Phân tích</span>
          <h1>Kết quả khảo sát</h1>
          <p>Thống kê chi tiết đánh giá từ học sinh qua các biểu đồ phân tích.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="button button-primary" onClick={() => setConfigOpen(true)}><Settings2 size={17} /> Cấu hình câu hỏi</button>
          <button className="button button-secondary" onClick={load}><RotateCcw size={17} /> Làm mới</button>
        </div>
      </header>
      
      <div className="dashboard-grid" style={{ marginBottom: 30 }}>
        <div className="stat-card">
          <span className="stat-icon"><ClipboardList size={24} /></span>
          <div className="stat-info">
            <strong>{total}</strong>
            <span>Tổng số phiếu</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon"><CheckCircle2 size={24} /></span>
          <div className="stat-info">
            <strong>{overallAvg} / 5.0</strong>
            <span>Điểm đánh giá trung bình</span>
          </div>
        </div>
      </div>

      {total > 0 && (
        <section className="survey-charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginTop: '24px' }}>
        
        <div className="admin-table-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '16px' }}>Chi tiết đánh giá từng câu hỏi (%)</h3>
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <BarChart data={questionBarData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={180} tick={{fontSize: 12}} />
                <RechartsTooltip formatter={(value, name, props) => {
                  if (name.includes('Mức')) {
                    const level = name.replace('Mức ', '');
                    const raw = props.payload['raw' + level];
                    return [`${value}% (${raw} lượt)`, name];
                  }
                  return [value, name];
                }} />
                <Legend />
                <Bar dataKey="Mức 1" stackId="a" fill="#ef4444" radius={[4, 0, 0, 4]} />
                <Bar dataKey="Mức 2" stackId="a" fill="#f97316" />
                <Bar dataKey="Mức 3" stackId="a" fill="#eab308" />
                <Bar dataKey="Mức 4" stackId="a" fill="#3b82f6" />
                <Bar dataKey="Mức 5" stackId="a" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="admin-table-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '16px', textAlign: 'center' }}>Thống kê Giới tính</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`${value} học sinh`, 'Số lượng']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="admin-table-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '16px', textAlign: 'center' }}>Điểm trung bình theo loại học liệu</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={productBarData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} />
                  <RechartsTooltip formatter={(value) => [`${value} / 5 điểm`, 'Điểm TB']} />
                  <Bar dataKey="Điểm TB" fill="#10b981" radius={[6, 6, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
      )}

      <section className="admin-table-card">
        <div className="table-toolbar">
          <h3>Danh sách phiếu khảo sát chi tiết</h3>
          <span>{total} kết quả</span>
        </div>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Học sinh</th>
                <th>Email</th>
                <th>Lớp</th>
                <th>Ngày gửi</th>
                <th>Ý kiến đóng góp</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {surveys.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.userFullName || '—'}</strong></td>
                  <td>{s.userEmail || '—'}</td>
                  <td>{s.schoolClass || '—'} ({s.gender || '—'})</td>
                  <td>{dateTimeLabel(s.createdAt)}</td>
                  <td style={{ maxWidth: 300, whiteSpace: 'normal' }}>
                    {s.feedback ? <span style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', display: 'inline-block', fontSize: '13px' }}>{s.feedback}</span> : <em className="muted">Không có</em>}
                  </td>
                  <td>
                    <button type="button" className="icon-button" onClick={() => deleteSurvey(s.id)} aria-label="Xoá phiếu">
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))}
              {surveys.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-cell">Chưa có khảo sát nào được gửi.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminSurveyConfigDrawer
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        onChanged={reloadQuestions}
      />
    </div>
  );
}
