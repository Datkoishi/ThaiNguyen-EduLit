import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Save,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, formatLearningDuration } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const roleLabel = (role) => role === 'ADMIN' ? 'Quản trị viên' : role === 'TEACHER' ? 'Giáo viên' : 'Học sinh';
const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : 'Chưa có dữ liệu';

export default function AccountPage() {
  const { user, token, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [profileState, setProfileState] = useState({ loading: false, error: '', success: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordState, setPasswordState] = useState({ loading: false, error: '', fields: {} });
  const [learning, setLearning] = useState(null);

  useEffect(() => setFullName(user?.fullName || ''), [user?.fullName]);
  useEffect(() => {
    apiRequest('/me/learning-progress', { token })
      .then((payload) => setLearning(payload.data.summary))
      .catch(() => setLearning(null));
  }, [token]);

  const passwordHints = useMemo(() => [
    { label: 'Tối thiểu 10 ký tự', met: passwordForm.newPassword.length >= 10 },
    { label: 'Nên có chữ hoa và chữ thường', met: /[A-ZÀ-Ỹ]/.test(passwordForm.newPassword) && /[a-zà-ỹ]/.test(passwordForm.newPassword) },
    { label: 'Nên có ít nhất một chữ số', met: /\d/.test(passwordForm.newPassword) }
  ], [passwordForm.newPassword]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileState({ loading: true, error: '', success: '' });
    try {
      await updateProfile(fullName.trim());
      setProfileState({ loading: false, error: '', success: 'Thông tin hồ sơ đã được cập nhật.' });
    } catch (error) {
      setProfileState({ loading: false, error: error.message, success: '' });
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordState({ loading: false, error: 'Mật khẩu xác nhận chưa trùng khớp.', fields: { confirmPassword: 'Mật khẩu xác nhận chưa trùng khớp.' } });
      return;
    }
    setPasswordState({ loading: true, error: '', fields: {} });
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      navigate('/dang-nhap?passwordChanged=1', { replace: true });
    } catch (error) {
      setPasswordState({ loading: false, error: error.message, fields: error.fields || {} });
    }
  };

  return (
    <div className="page account-page">
      <section className="account-hero">
        <div className="account-identity">
          <span className="account-avatar-large">{user.fullName.slice(0, 1).toUpperCase()}</span>
          <div>
            <span className="section-kicker">Tài khoản của tôi</span>
            <h1>{user.fullName}</h1>
            <p>{user.email}</p>
            <div className="account-badges">
              <span><ShieldCheck size={15} />{roleLabel(user.role)}</span>
              <span className="is-verified"><BadgeCheck size={15} />Email đã xác thực</span>
            </div>
          </div>
        </div>
        <div className="account-trust-note">
          <LockKeyhole size={22} />
          <div><strong>Phiên đăng nhập được bảo vệ</strong><span>Đổi mật khẩu sẽ thu hồi ngay mọi phiên cũ trên các thiết bị.</span></div>
        </div>
      </section>

      <section className="account-insights" aria-label="Tổng quan tài khoản">
        <article><span><CalendarDays size={19} /></span><div><small>Tham gia từ</small><strong>{formatDateTime(user.createdAt)}</strong></div></article>
        <article><span><Clock3 size={19} /></span><div><small>Đăng nhập gần nhất</small><strong>{formatDateTime(user.lastLoginAt)}</strong></div></article>
        <article><span><Activity size={19} /></span><div><small>Thời gian học tích lũy</small><strong>{learning ? formatLearningDuration(learning.totalActiveSeconds) : 'Đang tổng hợp'}</strong></div></article>
        <article><span><CheckCircle2 size={19} /></span><div><small>Học liệu hoàn thành</small><strong>{learning ? `${learning.completed}/${learning.totalAvailable}` : 'Đang tổng hợp'}</strong></div></article>
      </section>

      <div className="account-settings-grid">
        <section className="account-card">
          <div className="account-card-heading"><span><UserRound size={21} /></span><div><h2>Thông tin cá nhân</h2><p>Email và vai trò do hệ thống quản lý để bảo vệ phân quyền.</p></div></div>
          <form className="account-form" onSubmit={saveProfile}>
            <label>Họ và tên
              <span className="input-with-icon"><UserRound size={18} /><input value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} maxLength={120} required /></span>
            </label>
            <label>Email
              <span className="input-with-icon is-readonly"><Mail size={18} /><input value={user.email} readOnly aria-readonly="true" /></span>
              <small>Đổi email cần một luồng xác thực riêng nên được khóa trong phiên bản hiện tại.</small>
            </label>
            <label>Vai trò
              <span className="input-with-icon is-readonly"><ShieldCheck size={18} /><input value={roleLabel(user.role)} readOnly aria-readonly="true" /></span>
            </label>
            {profileState.error && <div className="form-error">{profileState.error}</div>}
            {profileState.success && <div className="form-success"><CheckCircle2 size={18} />{profileState.success}</div>}
            <button className="button button-primary" disabled={profileState.loading || fullName.trim() === user.fullName}>
              {profileState.loading ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />} Lưu thay đổi
            </button>
          </form>
        </section>

        <section className="account-card account-security-card">
          <div className="account-card-heading"><span><KeyRound size={21} /></span><div><h2>Đổi mật khẩu</h2><p>Xác minh mật khẩu hiện tại trước khi tạo thông tin đăng nhập mới.</p></div></div>
          <form className="account-form" onSubmit={savePassword}>
            <label>Mật khẩu hiện tại
              <span className="input-with-icon"><LockKeyhole size={18} /><input type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} required /></span>
              {passwordState.fields.currentPassword && <small className="field-error">{passwordState.fields.currentPassword}</small>}
            </label>
            <label>Mật khẩu mới
              <span className="input-with-icon"><KeyRound size={18} /><input type="password" autoComplete="new-password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} minLength={10} maxLength={128} required /></span>
              {passwordState.fields.newPassword && <small className="field-error">{passwordState.fields.newPassword}</small>}
            </label>
            <div className="password-guidance" aria-label="Hướng dẫn mật khẩu">
              {passwordHints.map((hint) => <span className={hint.met ? 'is-met' : ''} key={hint.label}><Check size={13} />{hint.label}</span>)}
            </div>
            <label>Xác nhận mật khẩu mới
              <span className="input-with-icon"><KeyRound size={18} /><input type="password" autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} required /></span>
              {passwordState.fields.confirmPassword && <small className="field-error">{passwordState.fields.confirmPassword}</small>}
            </label>
            {passwordState.error && Object.keys(passwordState.fields).length === 0 && <div className="form-error">{passwordState.error}</div>}
            <button className="button button-primary" disabled={passwordState.loading || passwordForm.newPassword.length < 10}>
              {passwordState.loading ? <LoaderCircle className="spin" size={18} /> : <KeyRound size={18} />} Đổi mật khẩu và đăng xuất
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
