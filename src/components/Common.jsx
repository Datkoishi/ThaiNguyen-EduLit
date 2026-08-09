import { AlertCircle, ArrowRight, BookOpen, FileText, FlaskConical, Gamepad2, LoaderCircle, RefreshCw, SearchX, Video } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function PageLoader({ label = 'Đang tải dữ liệu...' }) {
  return <div className="center-state"><LoaderCircle className="spin" size={28} /><span>{label}</span></div>;
}

export function ErrorState({ message = 'Không thể tải dữ liệu.', onRetry }) {
  return (
    <div className="empty-state error-state">
      <span className="empty-icon"><AlertCircle size={28} /></span>
      <h3>Đã có lỗi xảy ra</h3>
      <p>{message}</p>
      {onRetry && <button className="button button-secondary" onClick={onRetry}><RefreshCw size={17} /> Thử lại</button>}
    </div>
  );
}

export function EmptyState({ title = 'Chưa có học liệu phù hợp', description = 'Hãy thử từ khóa hoặc bộ lọc khác.', action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><SearchX size={28} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

const iconByCategory = {
  'sach-tuong-tac': BookOpen,
  'video-tuong-tac': Video,
  'tro-choi-tuong-tac': Gamepad2,
  'mo-phong-tuong-tac': FlaskConical,
  'tai-lieu-giao-vien': FileText
};

export function ProductArtwork({ product, compact = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = iconByCategory[product.category?.slug] || BookOpen;
  if (product.thumbnailUrl && !imageFailed) {
    return (
      <div className={'product-artwork has-image' + (compact ? ' compact' : '')}>
        <img
          className="product-artwork-image"
          src={product.thumbnailUrl}
          alt=""
          loading={compact ? 'lazy' : 'eager'}
          aria-hidden="true"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }
  return (
    <div className={'product-artwork tone-' + (product.thumbnailTone || 'violet') + (compact ? ' compact' : '')}>
      <span className="art-orbit orbit-a" />
      <span className="art-orbit orbit-b" />
      <span className="art-pedestal" />
      <Icon className="art-main-icon" size={compact ? 48 : 72} strokeWidth={1.6} />
    </div>
  );
}

export function ProductCard({ product }) {
  const subjectLabel = product.subjects?.[0]?.name || 'Nhiều môn';
  const gradeLabel = product.grades?.[0]?.name || 'Nhiều khối';
  const downloadFormats = product.downloadFormats || [];
  return (
    <article className="product-card">
      <Link to={'/san-pham/' + product.slug} className="product-card-art" aria-label={'Xem ' + product.title}>
        <ProductArtwork product={product} compact />
        <span className="category-badge">{product.category?.name}</span>
        {downloadFormats.length > 0 && <span className="format-badge-group">{downloadFormats.slice(0, 3).map((format) => <i key={format} className={'format-badge format-' + format.toLowerCase()}>{format}</i>)}</span>}
      </Link>
      <div className="product-card-body">
        <div className="metadata-row"><span>{subjectLabel}</span><i /> <span>{gradeLabel}</span></div>
        <h3><Link to={'/san-pham/' + product.slug}>{product.title}</Link></h3>
        <p>{product.shortDescription}</p>
        <Link className="card-link" to={'/san-pham/' + product.slug}>Xem chi tiết <ArrowRight size={16} /></Link>
      </div>
    </article>
  );
}
