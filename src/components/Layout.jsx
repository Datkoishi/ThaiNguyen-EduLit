import { useEffect, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Compass,
  FilePlus2,
  FileText,
  Gamepad2,
  FlaskConical,
  GraduationCap,
  Home,
  LogIn,
  LogOut,
  Menu,
  MessageSquareText,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  Users,
  Video,
  X
} from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const publicNav = [
  { to: '/', label: 'Trang chủ', icon: Home, end: true },
  { to: '/hoc-lieu/sach-tuong-tac', label: 'Sách tương tác', icon: BookOpen },
  { to: '/hoc-lieu/video-tuong-tac', label: 'Video tương tác', icon: Video },
  { to: '/hoc-lieu/tro-choi-tuong-tac', label: 'Trò chơi tương tác', icon: Gamepad2 },
  { to: '/hoc-lieu/mo-phong-tuong-tac', label: 'Sơ đồ tương tác', icon: FlaskConical },
  { to: '/tim-kiem', label: 'Tìm kiếm học liệu', icon: Search }
];

const pathMatches = (pathname, item) => item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + '/');

function SidebarSection({ id, label, icon: SectionIcon, items, open, pathname, onToggle, onNavigate }) {
  const hasActiveItem = items.some((item) => pathMatches(pathname, item));
  const panelId = `sidebar-section-${id}`;

  return (
    <section className={'sidebar-section ' + (open ? 'is-open ' : '') + (hasActiveItem ? 'has-active' : '')}>
      <button className="sidebar-section-toggle" type="button" onClick={onToggle} aria-expanded={open} aria-controls={panelId}>
        <span className="sidebar-section-icon"><SectionIcon size={17} aria-hidden="true" /></span>
        <span className="sidebar-section-copy"><strong>{label}</strong><small>{items.length} mục</small></span>
        <ChevronDown className="sidebar-section-chevron" size={17} aria-hidden="true" />
      </button>
      <div className="sidebar-section-panel" id={panelId} aria-hidden={!open}>
        <div className="sidebar-section-inner">
          <nav className="main-nav" aria-label={'Điều hướng ' + label.toLocaleLowerCase('vi')}>
            {items.map(({ to, label: itemLabel, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} onClick={onNavigate}>
                <Icon size={19} aria-hidden="true" />
                <span>{itemLabel}</span>
                <ChevronRight className="nav-chevron" size={16} aria-hidden="true" />
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const maySeeTeacher = ['TEACHER', 'ADMIN'].includes(user?.role);

  const submitSearch = (event) => {
    event.preventDefault();
    const value = search.trim();
    navigate(value ? '/tim-kiem?q=' + encodeURIComponent(value) : '/tim-kiem');
    setDrawerOpen(false);
  };

  const navItems = maySeeTeacher
    ? [...publicNav.slice(0, 5), { to: '/tai-lieu-giao-vien', label: 'Tài liệu giáo viên', icon: FileText }, ...publicNav.slice(5)]
    : publicNav;

  const adminItems = [
    { to: '/quan-tri', label: 'Tổng quan', icon: ShieldCheck, end: true },
    { to: '/quan-tri/san-pham', label: 'Quản lý học liệu', icon: Settings },
    { to: '/quan-tri/phan-loai', label: 'Danh mục & Môn/Khối', icon: Tags },
    { to: '/quan-tri/tai-khoan', label: 'Quản lý tài khoản', icon: Users },
    { to: '/quan-tri/binh-luan', label: 'Bình luận', icon: MessageSquareText },
    { to: '/quan-tri/nhat-ky', label: 'Nhật ký quản trị', icon: ScrollText }
  ];
  const teacherItems = [
    { to: '/giao-vien/hoc-lieu', label: 'Học liệu của tôi', icon: BookOpen, end: true },
    { to: '/giao-vien/hoc-lieu/tao-moi', label: 'Tạo học liệu', icon: FilePlus2 }
  ];
  const sectionForPath = (pathname) => pathname.startsWith('/quan-tri') && user?.role === 'ADMIN'
    ? 'admin'
    : pathname.startsWith('/giao-vien') && user?.role === 'TEACHER'
      ? 'teacher'
      : 'explore';
  const [openSection, setOpenSection] = useState(() => sectionForPath(location.pathname));

  useEffect(() => {
    setOpenSection(sectionForPath(location.pathname));
  }, [location.pathname, user?.role]);

  const toggleSection = (section) => setOpenSection((current) => current === section ? null : section);

  return (
    <div className="app-shell">
      <button className="mobile-menu-button" onClick={() => setDrawerOpen(true)} aria-label="Mở điều hướng">
        <Menu size={21} />
      </button>
      {drawerOpen && <button className="drawer-backdrop" onClick={() => setDrawerOpen(false)} aria-label="Đóng điều hướng" />}
      <aside className={'sidebar ' + (drawerOpen ? 'is-open' : '')}>
        <div className="sidebar-header">
          <Link className="brand" to="/" onClick={() => setDrawerOpen(false)}>
            <img src="/logo.png" alt="Logo" style={{ height: '56px', width: 'auto', maxWidth: '100%', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
          </Link>
          <button className="icon-button close-drawer" onClick={() => setDrawerOpen(false)} aria-label="Đóng điều hướng">
            <X size={20} />
          </button>
        </div>

        <form className="sidebar-search" onSubmit={submitSearch}>
          <Search size={17} aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm học liệu..." aria-label="Tìm học liệu" />
        </form>

        <div className="sidebar-sections">
          <SidebarSection id="explore" label="Khám phá" icon={Compass} items={navItems} open={openSection === 'explore'} pathname={location.pathname} onToggle={() => toggleSection('explore')} onNavigate={() => setDrawerOpen(false)} />

          {user?.role === 'ADMIN' && <SidebarSection id="admin" label="Quản trị" icon={ShieldCheck} items={adminItems} open={openSection === 'admin'} pathname={location.pathname} onToggle={() => toggleSection('admin')} onNavigate={() => setDrawerOpen(false)} />}

          {user?.role === 'TEACHER' && <SidebarSection id="teacher" label="Không gian giáo viên" icon={GraduationCap} items={teacherItems} open={openSection === 'teacher'} pathname={location.pathname} onToggle={() => toggleSection('teacher')} onNavigate={() => setDrawerOpen(false)} />}
        </div>

        <div className="sidebar-account">
          {user ? (
            <>
              <Link className="account-profile-link" to="/tai-khoan" onClick={() => setDrawerOpen(false)} aria-label="Mở tài khoản của tôi">
                <div className="avatar">{user.fullName.slice(0, 1).toUpperCase()}</div>
                <div className="account-copy">
                  <strong>{user.fullName}</strong>
                  <span>{user.role === 'ADMIN' ? 'Quản trị viên' : user.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}</span>
                </div>
              </Link>
              <button className="icon-button" onClick={logout} aria-label="Đăng xuất"><LogOut size={18} /></button>
            </>
          ) : (
            <Link className="login-link" to="/dang-nhap">
              <LogIn size={19} />
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-kicker"><Sparkles size={16} /> Không gian học tập truyền cảm hứng</div>
          <div className="topbar-actions">
            {user ? <span className="role-pill">{user.role === 'ADMIN' ? 'Admin' : user.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}</span> : <Link className="text-link" to="/dang-ky">Tạo tài khoản</Link>}
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

export function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <Link className="auth-brand" to="/">
            <img src="/logo.png" alt="Logo" className="lp-logo" style={{ filter: 'brightness(0) invert(1)' }} onError={(e) => e.target.style.display = 'none'} />
          </Link>
          <div className="auth-quote">
            <BookOpen size={48} className="auth-quote-icon" />
            <h2>Không gian học tập <br/>truyền cảm hứng</h2>
            <p>Khám phá kho tàng văn học dân gian Thái Nguyên qua các bài học tương tác, trò chơi và nội dung sinh động được ứng dụng trí tuệ nhân tạo.</p>
          </div>
        </div>
        <div className="auth-visual-shapes">
          <div className="shape shape-1" />
          <div className="shape shape-2" />
          <div className="shape shape-3" />
        </div>
      </div>
      <div className="auth-panel">
        <Outlet />
      </div>
    </div>
  );
}
