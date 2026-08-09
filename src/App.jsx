import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';
import { AppLayout, AuthLayout } from './components/Layout.jsx';
import { PageLoader } from './components/Common.jsx';
import { useAuth } from './context/AuthContext.jsx';
import HomePage from './pages/HomePage.jsx';
import CataloguePage from './pages/CataloguePage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from './pages/AuthPages.jsx';
import { AdminAssetsPage, AdminDashboardPage, AdminProductsPage, CreateProductPage, TeacherProductsPage } from './pages/AdminPages.jsx';
import { AdminAuditPage, AdminCommentsPage, AdminUsersPage } from './pages/AdminOperationsPages.jsx';
import AdminMetadataPage from './pages/AdminMetadataPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import { Link } from 'react-router-dom';

function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader label="Đang kiểm tra phiên đăng nhập..." />;
  if (!user) return <Navigate to="/dang-nhap" replace state={{ from: location.pathname + location.search }} />;
  if (!roles.includes(user.role)) return <Navigate to="/khong-co-quyen" replace />;
  return children;
}

function AuthenticatedApp() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader label="Đang kiểm tra phiên đăng nhập..." />;
  if (!user) {
    const requestedPath = location.pathname + location.search;
    return <Navigate to={'/dang-nhap?next=' + encodeURIComponent(requestedPath)} replace state={{ from: requestedPath }} />;
  }
  return <AppLayout />;
}

function GuestApp() {
  const { loading } = useAuth();
  if (loading) return <PageLoader label="Đang kiểm tra phiên đăng nhập..." />;
  return <AuthLayout />;
}

function AccessDeniedPage() {
  return (
    <div className="page standalone-state">
      <span><AlertTriangle size={34} /></span>
      <h1>Bạn không có quyền truy cập</h1>
      <p>Khu vực này chỉ hiển thị với vai trò được cấp phép.</p>
      <Link className="button button-primary" to="/"><Home size={18} /> Về trang chủ</Link>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="page standalone-state">
      <strong>404</strong>
      <h1>Không tìm thấy trang</h1>
      <p>Đường dẫn có thể đã thay đổi hoặc nội dung không còn hiển thị.</p>
      <Link className="button button-primary" to="/"><Home size={18} /> Về trang chủ</Link>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader label="Đang tải hệ thống..." />;

  return (
    <Routes>
      <Route path="/" element={user ? <AuthenticatedApp /> : <LandingPage />}>
        {user && <Route index element={<HomePage />} />}
      </Route>
      <Route element={<AuthenticatedApp />}>
        <Route path="hoc-lieu/:categorySlug" element={<CataloguePage />} />
        <Route path="tim-kiem" element={<CataloguePage />} />
        <Route path="san-pham/:slug" element={<ProductDetailPage />} />
        <Route path="tai-khoan" element={<AccountPage />} />
        <Route path="tai-lieu-giao-vien" element={<RequireRole roles={['TEACHER', 'ADMIN']}><CataloguePage teacherOnly /></RequireRole>} />
        <Route path="quan-tri" element={<RequireRole roles={['ADMIN']}><AdminDashboardPage /></RequireRole>} />
        <Route path="quan-tri/san-pham" element={<RequireRole roles={['ADMIN']}><AdminProductsPage /></RequireRole>} />
        <Route path="quan-tri/san-pham/tao-moi" element={<RequireRole roles={['ADMIN']}><CreateProductPage /></RequireRole>} />
        <Route path="quan-tri/san-pham/:id/tai-nguyen" element={<RequireRole roles={['ADMIN']}><AdminAssetsPage /></RequireRole>} />
        <Route path="quan-tri/san-pham/:id" element={<RequireRole roles={['ADMIN']}><CreateProductPage editMode /></RequireRole>} />
        <Route path="quan-tri/phan-loai" element={<RequireRole roles={['ADMIN']}><AdminMetadataPage /></RequireRole>} />
        <Route path="quan-tri/tai-khoan" element={<RequireRole roles={['ADMIN']}><AdminUsersPage /></RequireRole>} />
        <Route path="quan-tri/binh-luan" element={<RequireRole roles={['ADMIN']}><AdminCommentsPage /></RequireRole>} />
        <Route path="quan-tri/nhat-ky" element={<RequireRole roles={['ADMIN']}><AdminAuditPage /></RequireRole>} />
        <Route path="giao-vien/hoc-lieu" element={<RequireRole roles={['TEACHER']}><TeacherProductsPage /></RequireRole>} />
        <Route path="giao-vien/hoc-lieu/tao-moi" element={<RequireRole roles={['TEACHER']}><CreateProductPage teacherMode /></RequireRole>} />
        <Route path="giao-vien/hoc-lieu/:id/tai-nguyen" element={<RequireRole roles={['TEACHER']}><AdminAssetsPage teacherMode /></RequireRole>} />
        <Route path="khong-co-quyen" element={<AccessDeniedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<GuestApp />}>
        <Route path="dang-nhap" element={<LoginPage />} />
        <Route path="dang-ky" element={<RegisterPage />} />
        <Route path="quen-mat-khau" element={<ForgotPasswordPage />} />
        <Route path="dat-lai-mat-khau" element={<ResetPasswordPage />} />
      </Route>
    </Routes>
  );
}
