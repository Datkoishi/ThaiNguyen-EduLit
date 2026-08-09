import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Clock3, FileText, FlaskConical, Gamepad2, PlayCircle, Search, ShieldCheck, Sparkles, Trophy, Video, WandSparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest, formatLearningDuration } from '../api.js';
import { EmptyState, ErrorState, PageLoader, ProductArtwork, ProductCard } from '../components/Common.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const categoryIcons = {
  'sach-tuong-tac': BookOpen,
  'video-tuong-tac': Video,
  'tro-choi-tuong-tac': Gamepad2,
  'mo-phong-tuong-tac': FlaskConical,
  'tai-lieu-giao-vien': FileText
};

export default function HomePage() {
  const [data, setData] = useState({ categories: [], products: [], learning: { summary: { totalAvailable: 0, started: 0, inProgress: 0, completed: 0, totalActiveSeconds: 0, completionPercent: 0 }, recent: [] } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [categoryPayload, productPayload, progressPayload] = await Promise.all([
        apiRequest('/categories', { token }),
        apiRequest('/products?pageSize=8', { token }),
        apiRequest('/me/learning-progress', { token })
      ]);
      setData({ categories: categoryPayload.data, products: productPayload.data, learning: progressPayload.data });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const featured = useMemo(() => data.products[0], [data.products]);

  const submitSearch = (event) => {
    event.preventDefault();
    const value = search.trim();
    navigate(value ? '/tim-kiem?q=' + encodeURIComponent(value) : '/tim-kiem');
  };

  if (loading) return <PageLoader label="Đang chuẩn bị không gian học liệu..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="page home-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow"><WandSparkles size={15} /> Học liệu số cho mọi hành trình</span>
          <h1>Khơi mở tri thức bằng trải nghiệm tương tác</h1>
          <p>Khám phá sách, video và trò chơi học tập được tuyển chọn cho học sinh, cùng kho tài liệu chuyên môn dành cho giáo viên.</p>
          <form className="hero-search" onSubmit={submitSearch}>
            <Search size={20} aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Bạn muốn học gì hôm nay?" aria-label="Tìm kiếm học liệu" />
            <button type="submit">Tìm kiếm</button>
          </form>
          <div className="hero-meta">
            <span><ShieldCheck size={17} /> Nội dung được quản trị</span>
            <span><Sparkles size={17} /> Trải nghiệm đa dạng</span>
          </div>
        </div>
        <div className="hero-visual">
          {featured ? <ProductArtwork product={featured} /> : <div className="hero-placeholder"><BookOpen size={72} /></div>}
          <div className="floating-card floating-top">
            <strong>{data.products.length}+</strong>
            <span>học liệu nổi bật</span>
          </div>
          <div className="floating-card floating-bottom">
            <span className="floating-icon"><Sparkles size={17} /></span>
            <span>Nội dung mới mỗi tuần</span>
          </div>
        </div>
      </section>

      <section className="learning-overview-card">
        <div className="learning-overview-main">
          <div className="learning-overview-heading"><span className="learning-overview-icon"><Trophy size={23} /></span><div><span className="section-kicker">Tiến độ cá nhân</span><h2>Hành trình học tập của bạn</h2><p>Tiếp tục nơi bạn dừng lại và chủ động đánh dấu những học liệu đã hoàn thành.</p></div></div>
          <div className="learning-overview-metrics">
            <div className="completion-ring" style={{ '--progress': data.learning.summary.completionPercent + '%' }}><strong>{data.learning.summary.completionPercent}%</strong><span>hoàn thành</span></div>
            <dl>
              <div><dt><PlayCircle size={16} /> Đang học</dt><dd>{data.learning.summary.inProgress}</dd></div>
              <div><dt><CheckCircle2 size={16} /> Hoàn thành</dt><dd>{data.learning.summary.completed}</dd></div>
              <div><dt><Clock3 size={16} /> Thời gian</dt><dd>{formatLearningDuration(data.learning.summary.totalActiveSeconds)}</dd></div>
            </dl>
          </div>
        </div>
        <div className="continue-learning-panel">
          <div className="continue-learning-title"><div><span className="section-kicker">Hoạt động gần đây</span><h3>{data.learning.recent.length ? 'Tiếp tục học' : 'Sẵn sàng bắt đầu'}</h3></div><span>{data.learning.summary.started}/{data.learning.summary.totalAvailable} đã mở</span></div>
          {data.learning.recent.length ? <div className="continue-learning-list">{data.learning.recent.slice(0, 3).map((item) => <Link key={item.productId} to={'/san-pham/' + item.product.slug}><span className={'continue-status status-' + item.status.toLowerCase()}>{item.status === 'COMPLETED' ? <CheckCircle2 size={16} /> : <PlayCircle size={16} />}</span><div><strong>{item.product.title}</strong><small>{item.product.category.name} · {formatLearningDuration(item.activeSeconds)}</small></div><ArrowRight size={17} /></Link>)}</div> : <div className="continue-learning-empty"><BookOpen size={28} /><p>Chọn một học liệu nổi bật bên dưới để bắt đầu ghi nhận hành trình.</p><Link className="text-link with-icon" to="/tim-kiem">Khám phá ngay <ArrowRight size={16} /></Link></div>}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Khám phá theo nhu cầu</span>
            <h2>Chọn loại học liệu phù hợp</h2>
          </div>
          <Link className="text-link with-icon" to="/tim-kiem">Xem tất cả <ArrowRight size={17} /></Link>
        </div>
        <div className="category-grid">
          {data.categories.map((category, index) => {
            const Icon = categoryIcons[category.slug] || BookOpen;
            const to = category.slug === 'tai-lieu-giao-vien' ? '/tai-lieu-giao-vien' : '/hoc-lieu/' + category.slug;
            return (
              <Link key={category.id} className={'category-card category-' + (index % 5)} to={to}>
                <span className="category-icon"><Icon size={26} /></span>
                <div><h3>{category.name}</h3><p>{category.description}</p></div>
                <span className="category-count">{category.count} học liệu</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Được cập nhật gần đây</span>
            <h2>Học liệu nổi bật</h2>
          </div>
          <Link className="button button-secondary" to="/tim-kiem">Khám phá thêm <ArrowRight size={17} /></Link>
        </div>
        {data.products.length ? (
          <div className="product-grid">{data.products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        ) : (
          <EmptyState />
        )}
      </section>

      <section className="teacher-callout">
        <div className="callout-icon"><FileText size={30} /></div>
        <div>
          <span className="section-kicker">{user?.role === 'TEACHER' || user?.role === 'ADMIN' ? 'Không gian chuyên môn' : 'Dành cho giáo viên'}</span>
          <h2>{user?.role === 'TEACHER' || user?.role === 'ADMIN' ? 'Kho giáo án và tài liệu hỗ trợ giảng dạy' : 'Bạn là giáo viên?'}</h2>
          <p>{user?.role === 'TEACHER' || user?.role === 'ADMIN' ? 'Tải giáo án, slide trình chiếu và tài liệu đã được tuyển chọn.' : 'Đăng nhập bằng tài khoản Giáo viên để truy cập tài liệu chuyên môn.'}</p>
        </div>
        <Link className="button button-primary" to={user ? '/tai-lieu-giao-vien' : '/dang-nhap'}>
          {user ? 'Mở kho tài liệu' : 'Đăng nhập'} <ArrowRight size={17} />
        </Link>
      </section>
    </div>
  );
}
