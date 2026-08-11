import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, KeyRound, LoaderCircle, LockKeyhole, Mail, School, ShieldCheck, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const notice = location.state?.message || (params.get('passwordChanged') === '1' ? 'Mật khẩu đã được cập nhật và các phiên cũ đã được thu hồi. Vui lòng đăng nhập lại.' : '');

  useEffect(() => {
    apiRequest('/demo/accounts').then((payload) => setDemoAccounts(payload.data)).catch(() => {});
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      const fallback = user.role === 'ADMIN' ? '/quan-tri' : user.role === 'TEACHER' ? '/giao-vien/hoc-lieu' : '/';
      const requestedPath = new URLSearchParams(location.search).get('next');
      const safeRequestedPath = requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : null;
      navigate(safeRequestedPath || location.state?.from || fallback, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const useDemo = (account) => {
    setForm({ email: account.email, password: account.password });
    setError('');
  };

  return (
    <section className="auth-card">
      <span className="auth-kicker">Chào mừng trở lại</span>
      <h1>Đăng nhập để tiếp tục</h1>
      <p>Truy cập học liệu, trao đổi và nội dung phù hợp với vai trò của bạn.</p>
      {notice && <div className="form-success"><CheckCircle2 size={18} />{notice}</div>}

      <form onSubmit={submit} className="stack-form">
        <label>Email
          <span className="input-with-icon"><Mail size={18} /><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="ban@example.edu.vn" required /></span>
        </label>
        <label>Mật khẩu
          <span className="input-with-icon"><LockKeyhole size={18} /><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Nhập mật khẩu" required /></span>
        </label>
        <div className="form-between"><span /><Link to="/quen-mat-khau">Quên mật khẩu?</Link></div>
        {error && <div className="form-error">{error}</div>}
        <button className="button button-primary button-block" disabled={submitting}>
          {submitting ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />} Đăng nhập
        </button>
      </form>

      {demoAccounts.length > 0 && (
        <div className="demo-box">
          <span><ShieldCheck size={16} /> Tài khoản dùng thử</span>
          <div>{demoAccounts.map((account) => <button key={account.email} onClick={() => useDemo(account)}>{account.role}</button>)}</div>
        </div>
      )}
      <div className="auth-footer">Chưa có tài khoản? <Link to="/dang-ky">Đăng ký ngay</Link></div>
    </section>
  );
}

export function RegisterPage() {
  const [role, setRole] = useState('STUDENT');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', school: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận chưa trùng khớp.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = await apiRequest('/auth/register', {
        method: 'POST',
        body: { fullName: form.fullName, email: form.email, password: form.password, role, school: form.school.trim() || undefined }
      });
      setSuccess(payload.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const verifyDemo = async () => {
    setSubmitting(true);
    try {
      await apiRequest('/auth/verify-email', { method: 'POST', body: { token: success.demoVerificationToken } });
      navigate('/dang-nhap', { state: { message: 'Xác thực thành công.' } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <section className="auth-card auth-success">
        <span className="success-orb"><CheckCircle2 size={34} /></span>
        <h1>Kiểm tra email của bạn</h1>
        <p>{success.message}</p>
        {success.demoVerificationToken && <button className="button button-primary button-block" onClick={verifyDemo} disabled={submitting}>Xác thực tài khoản demo</button>}
        <Link className="button button-secondary button-block" to="/dang-nhap">Về trang đăng nhập</Link>
      </section>
    );
  }

  return (
    <section className="auth-card">
      <span className="auth-kicker">Tạo tài khoản</span>
      <h1>Bắt đầu hành trình học tập</h1>
      <p>Chọn loại tài khoản phù hợp với bạn.</p>

      <div className="role-selector">
        <button
          type="button"
          className={'role-option' + (role === 'STUDENT' ? ' is-selected' : '')}
          onClick={() => setRole('STUDENT')}
        >
          <UserRound size={24} />
          <span>Học sinh</span>
          <small>Khám phá học liệu và theo dõi tiến độ học tập.</small>
        </button>
        <button
          type="button"
          className={'role-option' + (role === 'TEACHER' ? ' is-selected' : '')}
          onClick={() => setRole('TEACHER')}
        >
          <ShieldCheck size={24} />
          <span>Giáo viên</span>
          <small>Tạo và quản lý học liệu dành cho lớp học.</small>
        </button>
      </div>

      <form onSubmit={submit} className="stack-form">
        <label>Họ và tên<span className="input-with-icon"><UserRound size={18} /><input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required minLength={2} /></span></label>
        <label>Email<span className="input-with-icon"><Mail size={18} /><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></span></label>
        <label>
          {role === 'TEACHER' ? 'Trường đang dạy' : 'Trường học'}
          <span className="input-with-icon">
            <School size={18} />
            <input
              value={form.school}
              onChange={(event) => setForm({ ...form, school: event.target.value })}
              placeholder={role === 'TEACHER' ? 'Ví dụ: THPT Lương Ngọc Quyến' : 'Ví dụ: THCS Hoàng Văn Thụ'}
              maxLength={120}
            />
          </span>
          <small>Không bắt buộc, giúp thống kê theo trường.</small>
        </label>
        <label>Mật khẩu<span className="input-with-icon"><LockKeyhole size={18} /><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={10} /></span><small>Tối thiểu 10 ký tự.</small></label>
        <label>Xác nhận mật khẩu<span className="input-with-icon"><LockKeyhole size={18} /><input type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} required /></span></label>
        {error && <div className="form-error">{error}</div>}
        <button className="button button-primary button-block" disabled={submitting}>
          {submitting ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />} Đăng ký {role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
        </button>
      </form>
      <div className="auth-footer">Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link></div>
    </section>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = await apiRequest('/auth/forgot-password', { method: 'POST', body: { email } });
      setResult(payload.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-card">
      <span className="auth-kicker">Khôi phục tài khoản</span>
      <h1>Quên mật khẩu?</h1>
      <p>Nhập email đã đăng ký, hệ thống sẽ gửi liên kết đặt lại mật khẩu.</p>
      {result ? (
        <div className="auth-success-inline">
          <CheckCircle2 size={28} /><p>{result.message}</p>
          {result.demoResetToken && <Link className="button button-primary button-block" to={'/dat-lai-mat-khau?token=' + result.demoResetToken}>Mở liên kết demo</Link>}
        </div>
      ) : (
        <form onSubmit={submit} className="stack-form">
          <label>Email<span className="input-with-icon"><Mail size={18} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></span></label>
          {error && <div className="form-error">{error}</div>}
          <button className="button button-primary button-block" disabled={submitting}>{submitting ? <LoaderCircle className="spin" size={18} /> : <KeyRound size={18} />} Gửi liên kết</button>
        </form>
      )}
      <div className="auth-footer"><Link to="/dang-nhap">Quay lại đăng nhập</Link></div>
    </section>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const token = params.get('token') || '';

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Mật khẩu xác nhận chưa trùng khớp.');
    setSubmitting(true);
    try {
      await apiRequest('/auth/reset-password', { method: 'POST', body: { token, newPassword: form.password } });
      setDone(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-card">
      <span className="auth-kicker">Bảo mật tài khoản</span>
      <h1>Đặt mật khẩu mới</h1>
      {done ? <div className="auth-success-inline"><CheckCircle2 size={28} /><p>Mật khẩu đã được cập nhật.</p><Link className="button button-primary button-block" to="/dang-nhap">Đăng nhập</Link></div> : (
        <form onSubmit={submit} className="stack-form">
          <label>Mật khẩu mới<span className="input-with-icon"><LockKeyhole size={18} /><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={10} /></span></label>
          <label>Xác nhận mật khẩu<span className="input-with-icon"><LockKeyhole size={18} /><input type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} required /></span></label>
          {error && <div className="form-error">{error}</div>}
          <button className="button button-primary button-block" disabled={submitting || !token}>{submitting ? <LoaderCircle className="spin" size={18} /> : <KeyRound size={18} />} Cập nhật mật khẩu</button>
        </form>
      )}
    </section>
  );
}
