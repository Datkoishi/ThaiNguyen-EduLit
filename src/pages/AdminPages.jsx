import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Archive, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Download, Eye, EyeOff, FileCheck2, FilePlus2, FileText, LayoutDashboard, ListChecks, LoaderCircle, MessageCircle, Paperclip, Pencil, Plus, Save, Search, ShieldCheck, Sparkles, Trash2, UploadCloud, Users, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { API_BASE, apiRequest, formatFileSize } from '../api.js';
import { ErrorState, PageLoader } from '../components/Common.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function AdminDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    apiRequest('/admin/dashboard', { token }).then((payload) => setData(payload.data)).catch((requestError) => setError(requestError.message));
  };

  useEffect(load, [token]);
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <PageLoader label="Đang tổng hợp số liệu..." />;

  const metrics = [
    { label: 'Tài khoản', value: data.users.total, detail: '+' + data.users.newInRange + ' trong 30 ngày', icon: Users, tone: 'violet' },
    { label: 'Học liệu công bố', value: data.products.published, detail: data.products.draft + ' bản nháp', icon: BookOpen, tone: 'cyan' },
    { label: 'Lượt trải nghiệm', value: data.engagement.experienceOpens, detail: data.engagement.detailViews + ' lượt xem', icon: Eye, tone: 'green' },
    { label: 'Bình luận mới', value: data.comments.newInRange, detail: data.comments.resolved + ' đã xử lý', icon: MessageCircle, tone: 'pink' }
  ];

  return (
    <div className="page admin-page">
      <div className="admin-title">
        <div><span className="section-kicker">Trung tâm quản trị</span><h1>Tổng quan hệ thống</h1><p>Theo dõi nội dung, người dùng và mức độ tương tác.</p></div>
        <Link className="button button-primary" to="/quan-tri/san-pham/tao-moi"><Plus size={18} /> Tạo học liệu</Link>
      </div>
      <div className="metric-grid">
        {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
          <article className="metric-card" key={label}>
            <span className={'metric-icon tone-' + tone}><Icon size={22} /></span>
            <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
          </article>
        ))}
      </div>
      <div className="admin-grid">
        <section className="admin-panel">
          <div className="panel-heading"><div><span className="section-kicker">Công việc ưu tiên</span><h2>Hoàn thiện học liệu</h2></div><Link to="/quan-tri/san-pham">Xem tất cả <ArrowRight size={16} /></Link></div>
          <div className="task-row"><span className="task-number">{data.products.draft}</span><div><strong>Bản nháp đang chờ hoàn thiện</strong><p>Kiểm tra metadata Môn/Khối và phương thức trải nghiệm trước khi công bố.</p></div></div>
          <div className="task-row"><span className="task-number warning">{data.products.hidden}</span><div><strong>Học liệu đang ẩn</strong><p>Rà soát nguồn ngoài hoặc nội dung cần cập nhật.</p></div></div>
        </section>
        <section className="admin-panel guide-panel">
          <span className="guide-icon"><LayoutDashboard size={26} /></span>
          <h2>Quản trị nhất quán</h2>
          <p>Mọi thay đổi trạng thái cần được kiểm tra quyền, ghi nhật ký và có phương án khôi phục.</p>
          <Link className="button button-secondary" to="/quan-tri/san-pham">Quản lý học liệu</Link>
        </section>
      </div>
    </div>
  );
}

export function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    setError('');
    apiRequest('/admin/products', { token })
      .then((payload) => setProducts(payload.data))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, [token]);

  const deleteProduct = async (product) => {
    const warn = product.status === 'PUBLISHED'
      ? `Học liệu "${product.title}" đang công bố. Xoá hẳn khỏi hệ thống?`
      : `Xoá hẳn học liệu "${product.title}"?`;
    if (!window.confirm(warn)) return;

    setDeletingId(product.id);
    setActionError('');
    try {
      await apiRequest('/admin/products/' + product.id, { method: 'DELETE', token });
      setProducts((prev) => prev.filter((item) => item.id !== product.id));
    } catch (requestError) {
      setActionError(requestError.message || 'Không xoá được học liệu.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => products.filter((product) => {
    const matchesQuery = [product.title, product.slug, product.category?.name || ''].join(' ').toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'));
    return matchesQuery && (!statusFilter || product.status === statusFilter);
  }), [products, query, statusFilter]);
  if (loading) return <PageLoader label="Đang tải danh sách quản trị..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="page admin-page">
      <div className="admin-title">
        <div><span className="section-kicker">Nội dung hệ thống</span><h1>Quản lý học liệu</h1><p>{products.length} học liệu trong hệ thống.</p></div>
        <Link className="button button-primary" to="/quan-tri/san-pham/tao-moi"><Plus size={18} /> Tạo học liệu</Link>
      </div>
      {actionError && <div className="form-error" style={{ marginBottom: 16 }}>{actionError}</div>}
      <section className="admin-table-card">
        <div className="table-toolbar"><label className="table-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tiêu đề, slug, danh mục..." /></label><label className="compact-select">Trạng thái<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Tất cả</option><option value="DRAFT">Chờ duyệt</option><option value="PUBLISHED">Đã công bố</option><option value="HIDDEN">Đang ẩn</option><option value="ARCHIVED">Lưu trữ</option></select></label><span>{filtered.length} kết quả</span></div>
        <div className="table-responsive">
          <table className="admin-table">
            <thead><tr><th>Học liệu</th><th>Danh mục</th><th>Môn/Khối</th><th>Phương thức</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id}>
                  <td><div className="table-product"><span className={'mini-art tone-' + (product.thumbnailTone || 'violet')}>{product.thumbnailUrl ? <img src={product.thumbnailUrl} alt="" loading="lazy" /> : <BookOpen size={18} />}</span><div><strong>{product.title}</strong><small>/{product.slug}</small></div></div></td>
                  <td>{product.category.name}</td>
                  <td><span>{product.subjects?.[0]?.name || 'Tất cả môn'}</span><small>{product.grades?.[0]?.name || 'Tất cả khối'}</small></td>
                  <td><span className="delivery-mini">{product.deliveryType}</span></td>
                  <td><span className={'status-badge status-' + product.status.toLowerCase()}>{product.status === 'PUBLISHED' ? 'Đã công bố' : product.status === 'DRAFT' ? 'Bản nháp' : product.status === 'HIDDEN' ? 'Đang ẩn' : 'Lưu trữ'}</span></td>
                  <td>
                    <div className="table-actions">
                      <Link className="icon-button" to={'/quan-tri/san-pham/' + product.id} aria-label={'Duyệt và chỉnh sửa ' + product.title}><Pencil size={18} /></Link>
                      <Link className="icon-button" to={'/quan-tri/san-pham/' + product.id + '/tai-nguyen'} aria-label={'Quản lý tệp ' + product.title}><Paperclip size={18} /></Link>
                      {product.status === 'PUBLISHED' && <Link className="icon-button" to={'/san-pham/' + product.slug} aria-label={'Xem ' + product.title}><Eye size={18} /></Link>}
                      <button
                        type="button"
                        className="icon-button danger-icon-button"
                        aria-label={'Xoá ' + product.title}
                        disabled={deletingId === product.id}
                        onClick={() => deleteProduct(product)}
                      >
                        {deletingId === product.id ? <LoaderCircle className="spin" size={18} /> : <Trash2 size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function TeacherProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    apiRequest('/teacher/products', { token })
      .then((payload) => setProducts(payload.data))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);
  if (loading) return <PageLoader label="Đang tải học liệu của bạn..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="page admin-page">
      <div className="admin-title teacher-title">
        <div>
          <span className="section-kicker">Không gian giáo viên</span>
          <h1>Học liệu của tôi</h1>
          <p>Tạo học liệu bằng liên kết hoặc tải lên Word, PowerPoint, PDF và theo dõi trạng thái kiểm duyệt.</p>
        </div>
        <Link className="button button-primary" to="/giao-vien/hoc-lieu/tao-moi"><Plus size={18} /> Tạo học liệu</Link>
      </div>
      <div className="teacher-workflow-note">
        <ShieldCheck size={20} />
        <div><strong>Quy trình kiểm duyệt</strong><p>Học liệu mới được lưu thành bản nháp. Bạn có thể gắn tệp Word/PowerPoint ngay sau khi tạo; Admin sẽ kiểm tra trước khi công bố.</p></div>
      </div>
      <section className="admin-table-card">
        <div className="panel-heading">
          <div><span className="section-kicker">Nội dung đã tạo</span><h2>{products.length} học liệu</h2></div>
        </div>
        <div className="table-responsive">
          <table className="admin-table">
            <thead><tr><th>Học liệu</th><th>Danh mục</th><th>Môn/Khối</th><th>Phương thức</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td><div className="table-product"><span className={'mini-art tone-' + (product.thumbnailTone || 'violet')}>{product.thumbnailUrl ? <img src={product.thumbnailUrl} alt="" loading="lazy" /> : <BookOpen size={18} />}</span><div><strong>{product.title}</strong><small>/{product.slug}</small></div></div></td>
                  <td>{product.category.name}</td>
                  <td><span>{product.subjects?.map((item) => item.name).join(', ') || '—'}</span><small>{product.grades?.map((item) => item.name).join(', ') || '—'}</small></td>
                  <td><span className="delivery-mini">{product.deliveryType}</span></td>
                  <td>{product.deliveryType === 'DOWNLOAD_ONLY' && product.status === 'DRAFT' && !product.assets?.length
                    ? <span className="status-badge status-incomplete">Cần bổ sung tệp</span>
                    : <span className={'status-badge status-' + product.status.toLowerCase()}>{product.status === 'PUBLISHED' ? 'Đã công bố' : product.status === 'DRAFT' ? 'Chờ duyệt' : product.status === 'HIDDEN' ? 'Đang ẩn' : 'Lưu trữ'}</span>}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="table-action-link" to={'/giao-vien/hoc-lieu/' + product.id + '/tai-nguyen'}><Paperclip size={16} /> Tệp ({product.assets?.length || 0})</Link>
                      {product.status === 'PUBLISHED' && <Link className="icon-button" to={'/san-pham/' + product.slug} aria-label={'Xem ' + product.title}><Eye size={18} /></Link>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!products.length && <div className="empty-assets"><FilePlus2 size={28} /><p>Bạn chưa tạo học liệu nào.</p></div>}
      </section>
    </div>
  );
}

const deliveryTypeLabel = (type) => {
  if (type === 'EMBED') return 'Chạy trong website';
  if (type === 'EXTERNAL') return 'Mở tab mới';
  if (type === 'DOWNLOAD_ONLY') return 'Tải Word / PowerPoint';
  if (type === 'HTML_PACKAGE') return 'Gói HTML tương tác';
  return type.replaceAll('_', ' ');
};

const TEACHER_FILE_ACCEPT = '.pdf,.doc,.docx,.rtf,.odt,.ppt,.pptx,.odp,.xls,.xlsx,.ods,.csv,.txt,.epub,.jpg,.jpeg,.png,.webp,.gif,.mp3,.wav,.m4a,.mp4,.webm,.zip';

export function CreateProductPage({ teacherMode = false, editMode = false }) {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [metadata, setMetadata] = useState({ categories: [], subjects: [], grades: [] });
  const [form, setForm] = useState({
    categoryId: '',
    title: '',
    slug: '',
    shortDescription: '',
    contentDescription: '',
    deliveryType: teacherMode ? 'EMBED' : 'EXTERNAL',
    experienceUrl: '',
    embedUrl: '',
    subjectIds: [],
    gradeIds: [],
    keywordsText: '',
    learningGuide: null,
    aiAssisted: false,
    aiModel: null,
    aiGeneratedAt: null,
    status: 'DRAFT'
  });
  const [formLoading, setFormLoading] = useState(editMode);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSourceNotes, setAiSourceNotes] = useState('');
  const [aiNotice, setAiNotice] = useState('');

  useEffect(() => {
    const metadataRequest = teacherMode
      ? Promise.all([
        apiRequest('/categories', { token }),
        apiRequest('/subjects', { token }),
        apiRequest('/grades', { token })
      ]).then(([categories, subjects, grades]) => ({ categories: categories.data, subjects: subjects.data, grades: grades.data }))
      : apiRequest('/admin/metadata', { token }).then((payload) => payload.data);
    const productRequest = editMode ? apiRequest('/admin/products/' + id, { token }) : Promise.resolve(null);
    Promise.all([metadataRequest, productRequest])
      .then(([metadataPayload, productPayload]) => {
        setMetadata(metadataPayload);
        if (productPayload) {
          const product = productPayload.data;
          setForm({
            categoryId: String(product.category.id),
            title: product.title,
            slug: product.slug,
            shortDescription: product.shortDescription,
            contentDescription: product.contentDescription || '',
            deliveryType: product.deliveryType,
            experienceUrl: product.experienceUrl || '',
            embedUrl: product.embedUrl || '',
            subjectIds: product.subjects.map((item) => item.id),
            gradeIds: product.grades.map((item) => item.id),
            keywordsText: (product.keywords || []).join(', '),
            learningGuide: product.learningGuide || null,
            aiAssisted: Boolean(product.aiAssisted),
            aiModel: product.aiModel || null,
            aiGeneratedAt: product.aiGeneratedAt || null,
            status: product.status
          });
        }
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setFormLoading(false));
  }, [editMode, id, teacherMode, token]);

  const slugify = (value) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const changeTitle = (value) => setForm((current) => ({ ...current, title: value, slug: slugify(value) }));
  const selectDeliveryType = (type) => setForm((current) => ({
    ...current,
    deliveryType: type,
    ...(type === 'DOWNLOAD_ONLY'
      ? { categoryId: String(metadata.categories.find((item) => item.slug === 'tai-lieu-giao-vien')?.id || current.categoryId), experienceUrl: '', embedUrl: '' }
      : {})
  }));
  const toggle = (key, id) => setForm((current) => ({ ...current, [key]: current[key].includes(id) ? current[key].filter((item) => item !== id) : [...current[key], id] }));
  const emptyGuide = () => ({ objective: '', before: [], during: [], after: [], reflectionQuestion: '' });
  const updateGuide = (key, value) => setForm((current) => ({
    ...current,
    learningGuide: { ...(current.learningGuide || emptyGuide()), [key]: value }
  }));
  const guideLines = (key) => (form.learningGuide?.[key] || []).join('\n');
  const toGuideLines = (value) => value.split('\n').map((item) => item.trim()).filter(Boolean);

  const generateAiDraft = async () => {
    setError('');
    setAiNotice('');
    const sourceUrl = form.deliveryType === 'EMBED' ? form.embedUrl : form.experienceUrl;
    if (!form.title.trim() || !form.categoryId || !form.subjectIds.length || !form.gradeIds.length || !sourceUrl) {
      setError('Để AI soạn đúng, hãy nhập tiêu đề, chọn Danh mục, ít nhất một Môn/Khối và dán link học liệu trước.');
      return;
    }
    setAiLoading(true);
    try {
      const payload = await apiRequest('/teacher/ai/product-draft', {
        method: 'POST',
        token,
        body: {
          titleHint: form.title,
          sourceUrl,
          sourceNotes: aiSourceNotes,
          categoryId: Number(form.categoryId),
          subjectIds: form.subjectIds,
          gradeIds: form.gradeIds,
          deliveryType: form.deliveryType
        }
      });
      const draft = payload.data;
      setForm((current) => ({
        ...current,
        title: draft.title,
        slug: slugify(draft.title),
        shortDescription: draft.shortDescription,
        contentDescription: draft.contentDescription,
        keywordsText: draft.keywords.join(', '),
        learningGuide: draft.learningGuide,
        aiAssisted: true,
        aiModel: draft.provenance.model,
        aiGeneratedAt: draft.provenance.generatedAt
      }));
      setAiNotice(payload.meta.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAiLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (teacherMode && (!form.subjectIds.length || !form.gradeIds.length)) {
      setError('Giáo viên phải chọn ít nhất một Môn học và một Khối lớp.');
      return;
    }
    setSubmitting(true);
    const requestedStatus = teacherMode ? 'DRAFT' : event.nativeEvent.submitter?.value || form.status || 'DRAFT';
    try {
      const { keywordsText, ...productFields } = form;
      const hasGuideContent = form.learningGuide && [
        form.learningGuide.objective,
        ...(form.learningGuide.before || []),
        ...(form.learningGuide.during || []),
        ...(form.learningGuide.after || []),
        form.learningGuide.reflectionQuestion
      ].some((item) => String(item || '').trim());
      const endpoint = teacherMode ? '/teacher/products' : editMode ? '/admin/products/' + id : '/admin/products';
      const payload = await apiRequest(endpoint, {
        method: editMode ? 'PATCH' : 'POST',
        token,
        body: {
          ...productFields,
          learningGuide: hasGuideContent ? form.learningGuide : null,
          status: requestedStatus,
          categoryId: Number(form.categoryId),
          experienceUrl: form.experienceUrl || null,
          embedUrl: form.embedUrl || null,
          keywords: keywordsText.split(',').map((item) => item.trim()).filter(Boolean)
        }
      });
      navigate(teacherMode ? '/giao-vien/hoc-lieu/' + payload.data.id + '/tai-nguyen' : editMode ? '/quan-tri/san-pham' : '/quan-tri/san-pham/' + payload.data.id + '/tai-nguyen');
    } catch (requestError) {
      const fieldError = Object.values(requestError.fields || {})[0];
      setError(fieldError || requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (formLoading) return <PageLoader label="Đang tải hồ sơ học liệu..." />;

  const workflowActions = form.status === 'DRAFT'
    ? [['DRAFT', 'Lưu bản nháp', 'secondary'], ['PUBLISHED', 'Duyệt và công bố', 'primary'], ['ARCHIVED', 'Lưu trữ', 'danger']]
    : form.status === 'PUBLISHED'
      ? [['PUBLISHED', 'Lưu thay đổi', 'primary'], ['HIDDEN', 'Ẩn khỏi thư viện', 'secondary'], ['ARCHIVED', 'Lưu trữ', 'danger']]
      : form.status === 'HIDDEN'
        ? [['HIDDEN', 'Lưu thay đổi', 'secondary'], ['PUBLISHED', 'Công bố lại', 'primary'], ['ARCHIVED', 'Lưu trữ', 'danger']]
        : [['ARCHIVED', 'Lưu nội dung lưu trữ', 'secondary']];

  const actionIcon = (status) => status === 'PUBLISHED'
    ? <CheckCircle2 size={18} />
    : status === 'HIDDEN'
      ? <EyeOff size={18} />
      : status === 'ARCHIVED'
        ? <Archive size={18} />
        : <Pencil size={18} />;

  return (
    <div className="page admin-page">
      <div className={'admin-title ' + (teacherMode ? 'teacher-title' : '')}>
        <div>
          <span className="section-kicker">{teacherMode ? 'Dành cho giáo viên' : editMode ? 'Kiểm duyệt nội dung' : 'Nội dung mới'}</span>
          <h1>{editMode ? 'Duyệt và chỉnh sửa học liệu' : 'Tạo học liệu'}</h1>
          <p>{teacherMode ? 'Tạo học liệu bằng liên kết hoặc bộ tệp Word/PowerPoint rồi gửi Admin kiểm duyệt.' : editMode ? 'Rà soát metadata, liên kết trải nghiệm và quyết định trạng thái phát hành.' : 'Nhập metadata, phân loại và cách trải nghiệm.'}</p>
        </div>
      </div>
      {teacherMode && <div className="teacher-workflow-note"><ShieldCheck size={20} /><div><strong>Học liệu sẽ chưa công bố ngay</strong><p>Sau khi gửi, nội dung có trạng thái “Chờ duyệt” và xuất hiện trong danh sách quản trị của Admin.</p></div></div>}
      {editMode && <div className="teacher-workflow-note review-workflow-note"><ShieldCheck size={20} /><div><strong>Trạng thái hiện tại: {form.status}</strong><p>Bản lưu trữ là trạng thái cuối để bảo toàn lịch sử. Mọi thay đổi dưới đây đều được ghi vào nhật ký quản trị.</p></div></div>}
      <form className="product-form" onSubmit={submit}>
        <section className="form-section">
          <div className="form-section-title"><span>01</span><div><h2>Thông tin cơ bản</h2><p>Thông tin hiển thị trên thẻ và trang chi tiết.</p></div></div>
          <div className="form-grid">
            <label className="field-full">Tiêu đề<input value={form.title} onChange={(event) => changeTitle(event.target.value)} required minLength={3} /></label>
            <label>Slug<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} required /></label>
            <label>Danh mục<select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} required><option value="">Chọn danh mục</option>{metadata.categories.map((item) => <option key={item.id} value={item.id} disabled={item.isActive === false}>{item.name}{item.isActive === false ? ' (ngừng sử dụng)' : ''}</option>)}</select></label>
            <label className="field-full">Mô tả ngắn<textarea value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} required minLength={10} rows={3} /></label>
            <label className="field-full">Nội dung chi tiết<textarea value={form.contentDescription} onChange={(event) => setForm({ ...form, contentDescription: event.target.value })} rows={5} /></label>
            <label className="field-full">Từ khóa tìm kiếm<input value={form.keywordsText} onChange={(event) => setForm({ ...form, keywordsText: event.target.value })} placeholder="Ví dụ: truyện dân gian, tương tác, Ngữ văn" /><small>Tối đa 20 từ khóa, phân tách bằng dấu phẩy.</small></label>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-title"><span>02</span><div><h2>Phân loại Môn/Khối</h2><p>{teacherMode ? 'Bắt buộc chọn ít nhất một Môn và một Khối.' : 'Chọn ít nhất một giá trị khi công bố.'}</p></div></div>
          <div className="taxonomy-columns">
            <fieldset><legend>Môn học</legend>{metadata.subjects.map((item) => <label className={'check-row ' + (item.isActive === false ? 'disabled' : '')} key={item.id}><input type="checkbox" checked={form.subjectIds.includes(item.id)} onChange={() => toggle('subjectIds', item.id)} disabled={item.isActive === false} /><span>{item.name}{item.isActive === false ? ' (ngừng sử dụng)' : ''}</span></label>)}</fieldset>
            <fieldset><legend>Khối lớp</legend>{metadata.grades.map((item) => <label className={'check-row ' + (item.isActive === false ? 'disabled' : '')} key={item.id}><input type="checkbox" checked={form.gradeIds.includes(item.id)} onChange={() => toggle('gradeIds', item.id)} disabled={item.isActive === false} /><span>{item.name}{item.isActive === false ? ' (ngừng sử dụng)' : ''}</span></label>)}</fieldset>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-title"><span>03</span><div><h2>Cách sử dụng học liệu</h2><p>{teacherMode ? 'Chọn chạy trên web, mở nguồn ngoài hoặc cung cấp tệp để giáo viên tải về.' : 'Chọn cách hệ thống mở nội dung.'}</p></div></div>
          <div className="delivery-options">
            {(teacherMode ? ['EMBED', 'EXTERNAL', 'DOWNLOAD_ONLY'] : ['EXTERNAL', 'EMBED', 'HTML_PACKAGE', 'DOWNLOAD_ONLY']).map((type) => <label key={type} className={form.deliveryType === type ? 'selected' : ''}><input type="radio" name="deliveryType" value={type} checked={form.deliveryType === type} onChange={() => selectDeliveryType(type)} /><FilePlus2 size={21} /><span>{deliveryTypeLabel(type)}</span></label>)}
          </div>
          {form.deliveryType === 'EXTERNAL' && <label>URL trải nghiệm<input type="url" value={form.experienceUrl} onChange={(event) => setForm({ ...form, experienceUrl: event.target.value })} placeholder="https://..." required /></label>}
          {form.deliveryType === 'EMBED' && <label>{teacherMode ? 'Link học liệu' : 'URL nhúng'}<input type="url" value={form.embedUrl} onChange={(event) => setForm({ ...form, embedUrl: event.target.value })} placeholder="https://..." required /><small>{teacherMode ? 'Hỗ trợ link nhúng và link trang Canva công khai. Hệ thống sẽ mở nội dung trong trình phát nội bộ.' : 'Dùng URL được nhà cung cấp cho phép nhúng.'}</small></label>}
          {form.deliveryType === 'DOWNLOAD_ONLY' && <div className="form-note"><strong>Bước 1/2:</strong> Lưu thông tin học liệu. Ở bước quản lý tài nguyên, bạn có thể tải nhiều tệp Word, PowerPoint và tài liệu bổ trợ cùng lúc.{teacherMode ? ' Chỉ khi có ít nhất một tệp thì hồ sơ mới sẵn sàng để Admin duyệt.' : ''}</div>}
          {form.deliveryType === 'HTML_PACKAGE' && !teacherMode && <div className="form-note">Tạo bản nháp trước, sau đó tải gói ZIP trong bước quản lý tài nguyên.</div>}
        </section>

        {teacherMode && form.deliveryType !== 'DOWNLOAD_ONLY' && (
          <section className="form-section ai-draft-section">
            <div className="form-section-title"><span><Sparkles size={17} /></span><div><h2>AI hỗ trợ soạn bản nháp</h2><p>AI chỉ viết hồ sơ và cách học từ thông tin bạn cung cấp; không tự tạo game, video hay công bố nội dung.</p></div></div>
            <div className="ai-draft-layout">
              <div className="ai-draft-copy">
                <span className="ai-chip"><Sparkles size={14} /> Trợ lý biên tập</span>
                <h3>Từ một liên kết thành hồ sơ dễ học</h3>
                <ol>
                  <li>Điền tiêu đề, Môn/Khối và link ở ba phần trên.</li>
                  <li>Thêm ghi chú về mục tiêu hoặc nội dung nếu có.</li>
                  <li>Để AI tạo mô tả, từ khóa và lộ trình; sau đó bạn đọc lại từng mục.</li>
                </ol>
              </div>
              <div className="ai-draft-action">
                <label>Ghi chú cho AI <textarea value={aiSourceNotes} onChange={(event) => setAiSourceNotes(event.target.value)} rows={4} maxLength={8000} placeholder="Ví dụ: Học sinh lớp 4 tìm hiểu cốt truyện, nhân vật và ý nghĩa của truyền thuyết..." /><small>Không nhập thông tin cá nhân của học sinh.</small></label>
                <button type="button" className="button button-primary ai-generate-button" onClick={generateAiDraft} disabled={aiLoading}>{aiLoading ? <LoaderCircle className="spin" size={18} /> : <Sparkles size={18} />} {aiLoading ? 'Đang soạn bản nháp...' : 'Tạo bản nháp bằng AI'}</button>
                {aiNotice && <div className="ai-inline-notice"><CheckCircle2 size={17} /><span>{aiNotice}<small>Bạn vẫn phải kiểm tra nội dung trước khi gửi Admin.</small></span></div>}
              </div>
            </div>
          </section>
        )}

        <section className="form-section learning-guide-editor">
          <div className="form-section-title"><span><ListChecks size={17} /></span><div><h2>Hướng dẫn cách học</h2><p>Định hướng người học theo đúng thứ tự Chuẩn bị → Trải nghiệm → Phản tư & hoàn thành.</p></div></div>
          <div className="guide-editor-intro">
            <label>Mục tiêu học tập<textarea rows={2} value={form.learningGuide?.objective || ''} onChange={(event) => updateGuide('objective', event.target.value)} placeholder="Sau hoạt động, người học có thể..." /></label>
            {form.aiAssisted && <span className="ai-reviewed-badge"><Sparkles size={14} /> AI hỗ trợ · cần người duyệt{form.aiModel ? ` · ${form.aiModel}` : ''}</span>}
          </div>
          <div className="guide-editor-grid">
            <label><strong>1. Chuẩn bị</strong><textarea rows={5} value={guideLines('before')} onChange={(event) => updateGuide('before', toGuideLines(event.target.value))} placeholder={'Mỗi hướng dẫn một dòng\nĐọc mục tiêu của bài học'} /><small>2–4 hành động, mỗi dòng một ý.</small></label>
            <label><strong>2. Trải nghiệm</strong><textarea rows={5} value={guideLines('during')} onChange={(event) => updateGuide('during', toGuideLines(event.target.value))} placeholder={'Thực hiện theo thứ tự\nGhi lại điểm đáng chú ý'} /><small>2–5 hành động, bám sát học liệu.</small></label>
            <label><strong>3. Phản tư</strong><textarea rows={5} value={guideLines('after')} onChange={(event) => updateGuide('after', toGuideLines(event.target.value))} placeholder={'Tóm tắt điều đã hiểu\nViết bình luận phản tư'} /><small>2–4 hành động trước khi hoàn thành.</small></label>
          </div>
          <label>Câu hỏi phản tư<textarea rows={2} value={form.learningGuide?.reflectionQuestion || ''} onChange={(event) => updateGuide('reflectionQuestion', event.target.value)} placeholder="Điều nào em hiểu rõ hơn và em còn muốn tìm hiểu gì?" /></label>
          <div className="form-note">Có thể để trống toàn bộ phần này. Nếu đã nhập, hãy hoàn thiện đủ mục tiêu, ba giai đoạn và câu hỏi phản tư.</div>
        </section>

        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button type="button" className="button button-secondary" onClick={() => navigate(teacherMode ? '/giao-vien/hoc-lieu' : '/quan-tri/san-pham')}>Hủy</button>
          {teacherMode ? (
            <button type="submit" value="DRAFT" className="button button-primary" disabled={submitting}>{submitting ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />} {form.deliveryType === 'DOWNLOAD_ONLY' ? 'Tiếp tục tải tệp' : 'Gửi Admin duyệt'}</button>
          ) : editMode ? (
            workflowActions.map(([status, label, tone]) => <button key={status} type="submit" value={status} className={'button button-' + tone} disabled={submitting}>{submitting ? <LoaderCircle className="spin" size={18} /> : actionIcon(status)} {label}</button>)
          ) : (
            <>
              <button type="submit" value="DRAFT" className="button button-secondary" disabled={submitting}>Lưu bản nháp</button>
              <button type="submit" value="PUBLISHED" className="button button-primary" disabled={submitting}>{submitting ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />} Công bố</button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

const purposeLabels = {
  DOWNLOAD: 'Tệp tải xuống',
  HTML_PACKAGE: 'Gói HTML tương tác',
  THUMBNAIL: 'Ảnh đại diện'
};

const assetType = (extension = '') => {
  const value = extension.toLowerCase();
  if (['doc', 'docx', 'rtf', 'odt'].includes(value)) return { label: 'Word', tone: 'word' };
  if (['ppt', 'pptx', 'odp'].includes(value)) return { label: 'PowerPoint', tone: 'powerpoint' };
  if (['xls', 'xlsx', 'ods', 'csv'].includes(value)) return { label: 'Bảng tính', tone: 'spreadsheet' };
  if (value === 'pdf') return { label: 'PDF', tone: 'pdf' };
  return { label: value.toUpperCase() || 'Tệp', tone: 'other' };
};

const displayFileName = (asset) => asset.originalName.replace(/\.[^.]+$/, '');

export function AdminAssetsPage({ teacherMode = false }) {
  const { id } = useParams();
  const { token } = useAuth();
  const [product, setProduct] = useState(null);
  const [purpose, setPurpose] = useState('DOWNLOAD');
  const [files, setFiles] = useState([]);
  const [inputKey, setInputKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [assetActionId, setAssetActionId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await apiRequest((teacherMode ? '/teacher/products/' : '/admin/products/') + id, { token });
      setProduct(payload.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id, teacherMode, token]);

  const accept = (teacherMode || product?.deliveryType === 'DOWNLOAD_ONLY')
    ? TEACHER_FILE_ACCEPT
    : purpose === 'HTML_PACKAGE'
    ? '.zip'
    : purpose === 'THUMBNAIL'
      ? '.jpg,.jpeg,.png,.webp'
      : product?.uploadPolicy?.allowedExtensions.map((item) => '.' + item).join(',');

  const uploadAsset = async (event) => {
    event.preventDefault();
    if (!files.length) return;
    setUploading(true);
    setError('');
    setNotice('');
    setUploadProgress({ done: 0, total: files.length });
    const failed = [];
    let succeeded = 0;
    try {
      for (const selectedFile of files) {
        const body = new FormData();
        body.append('purpose', purpose);
        body.append('file', selectedFile);
        try {
          await apiRequest((teacherMode ? '/teacher/products/' : '/admin/products/') + id + '/assets', { method: 'POST', token, body });
          succeeded += 1;
        } catch (requestError) {
          failed.push({ file: selectedFile, message: requestError.message });
        }
        setUploadProgress({ done: succeeded + failed.length, total: files.length });
      }
      setFiles(failed.map((item) => item.file));
      setInputKey((value) => value + 1);
      if (succeeded) setNotice(`Đã tải thành công ${succeeded}/${files.length} tệp.`);
      await load();
      if (failed.length) setError(`Không thể tải ${failed.length} tệp: ${failed.map((item) => item.file.name).join(', ')}.`);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const selectFiles = (event) => {
    const incoming = [...(event.target.files || [])];
    setInputKey((value) => value + 1);
    if (!incoming.length || !product) return;
    setError('');
    setNotice('');
    const allowed = new Set(product.uploadPolicy.allowedExtensions.map((item) => item.toLowerCase()));
    const maxBytes = (purpose === 'HTML_PACKAGE' ? product.uploadPolicy.htmlPackageMb : product.uploadPolicy.standardFileMb) * 1024 * 1024;
    const productMaxBytes = product.uploadPolicy.productFilesMb * 1024 * 1024;
    const knownNames = new Set([...product.assets.map((item) => item.originalName), ...files.map((item) => item.name)].map((item) => item.toLocaleLowerCase('vi')));
    let projectedBytes = Number(product.uploadPolicy.usedBytes || 0) + files.reduce((sum, item) => sum + item.size, 0);
    const accepted = [];
    const rejected = [];
    incoming.forEach((item) => {
      const extension = item.name.split('.').pop()?.toLowerCase() || '';
      const normalizedName = item.name.toLocaleLowerCase('vi');
      if (!allowed.has(extension) || (purpose === 'HTML_PACKAGE' && extension !== 'zip') || (purpose === 'THUMBNAIL' && !['jpg', 'jpeg', 'png', 'webp'].includes(extension))) {
        rejected.push(`${item.name}: sai định dạng`);
      } else if (item.size > maxBytes) {
        rejected.push(`${item.name}: vượt ${Math.round(maxBytes / 1024 / 1024)} MB`);
      } else if (knownNames.has(normalizedName)) {
        rejected.push(`${item.name}: trùng tên`);
      } else if (projectedBytes + item.size > productMaxBytes) {
        rejected.push(`${item.name}: vượt tổng dung lượng`);
      } else {
        accepted.push(item);
        knownNames.add(normalizedName);
        projectedBytes += item.size;
      }
    });
    if (accepted.length) setFiles((current) => [...current, ...accepted]);
    if (rejected.length) setError(`Đã bỏ qua ${rejected.length} tệp — ${rejected.join('; ')}.`);
  };

  const saveAssetName = async (asset) => {
    setAssetActionId(asset.id);
    setError('');
    setNotice('');
    try {
      await apiRequest((teacherMode ? '/teacher/products/' : '/admin/products/') + id + '/assets/' + asset.id, {
        method: 'PATCH', token, body: { displayName: editingName }
      });
      setEditingAssetId(null);
      setEditingName('');
      setNotice('Đã cập nhật tên hiển thị của tệp.');
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAssetActionId(null);
    }
  };

  const removeAsset = async (asset) => {
    setAssetActionId(asset.id);
    setError('');
    setNotice('');
    try {
      await apiRequest((teacherMode ? '/teacher/products/' : '/admin/products/') + id + '/assets/' + asset.id, { method: 'DELETE', token });
      setConfirmDeleteId(null);
      setNotice(`Đã gỡ “${displayFileName(asset)}” khỏi học liệu.`);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAssetActionId(null);
    }
  };

  const downloadAsset = async (asset) => {
    setError('');
    try {
      const response = await fetch(API_BASE + '/assets/' + asset.id + '/download', {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message || 'Không thể tải tệp.');
      }
      if (contentType.includes('application/json')) {
        const payload = await response.json();
        setNotice(payload.data.message || 'Tệp demo chưa có nội dung vật lý.');
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = asset.originalName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError.message);
    }
  };

  if (loading) return <PageLoader label="Đang tải tài nguyên học liệu..." />;
  if (error && !product) return <ErrorState message={error} onRetry={load} />;

  const policy = product.uploadPolicy;
  const downloadAssets = product.assets.filter((asset) => asset.purpose === 'DOWNLOAD');
  const hasWord = downloadAssets.some((asset) => ['doc', 'docx', 'rtf', 'odt'].includes(asset.extension.toLowerCase()));
  const hasPowerPoint = downloadAssets.some((asset) => ['ppt', 'pptx', 'odp'].includes(asset.extension.toLowerCase()));
  const isReady = product.deliveryType !== 'DOWNLOAD_ONLY' || downloadAssets.length > 0;
  const isWordPowerPointFlow = teacherMode || product.deliveryType === 'DOWNLOAD_ONLY';
  const usedPercent = Math.min(100, (policy.usedBytes / (policy.productFilesMb * 1024 * 1024)) * 100);
  const selectedLimit = purpose === 'HTML_PACKAGE' ? policy.htmlPackageMb : policy.standardFileMb;

  return (
    <div className="page admin-page">
      <Link className="back-link" to={teacherMode ? '/giao-vien/hoc-lieu' : '/quan-tri/san-pham'}><ArrowLeft size={17} /> Quay lại {teacherMode ? 'học liệu của tôi' : 'quản lý học liệu'}</Link>
      <div className={'admin-title ' + (teacherMode ? 'teacher-title' : '')}>
        <div>
          <span className="section-kicker">{teacherMode ? 'Tệp dành cho giáo viên' : 'Tài nguyên học liệu'}</span>
          <h1>{product.title}</h1>
          <p>{isWordPowerPointFlow ? 'Gắn giáo án Word, bài trình chiếu PowerPoint và tài liệu bổ trợ.' : 'Kiểm soát định dạng, dung lượng và quyền tải xuống.'}</p>
        </div>
        {product.status === 'PUBLISHED' && <Link className="button button-secondary" to={'/san-pham/' + product.slug}><Eye size={18} /> Xem học liệu</Link>}
      </div>

      {product.deliveryType === 'DOWNLOAD_ONLY' && (
        <section className={'asset-readiness ' + (isReady ? 'is-ready' : 'is-incomplete')} aria-live="polite">
          <div className="asset-readiness-state">{isReady ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}<div><span>Bước 2/2</span><strong>{isReady ? (teacherMode ? 'Học liệu đã sẵn sàng để Admin kiểm duyệt' : 'Đã có tệp Word / PowerPoint') : 'Cần ít nhất một tệp tải xuống'}</strong><small>{isReady ? 'Bạn vẫn có thể bổ sung, đổi tên hoặc thay thế tệp.' : 'Tải Word, PowerPoint hoặc một tài liệu hợp lệ để hoàn tất hồ sơ.'}</small></div></div>
          <div className="asset-readiness-checks">
            <span className="done"><FileCheck2 size={16} /> Metadata Môn/Khối</span>
            <span className={downloadAssets.length ? 'done' : ''}><Paperclip size={16} /> {downloadAssets.length || 0} tệp hợp lệ</span>
            <span className={hasWord ? 'done' : 'recommended'}>Word {hasWord ? '✓' : 'khuyến nghị'}</span>
            <span className={hasPowerPoint ? 'done' : 'recommended'}>PowerPoint {hasPowerPoint ? '✓' : 'khuyến nghị'}</span>
          </div>
        </section>
      )}

      <div className="asset-admin-grid">
        <section className="form-section upload-panel">
          <div className="form-section-title"><span><UploadCloud size={20} /></span><div><h2>Tải bộ tệp</h2><p>{isWordPowerPointFlow ? 'Chọn nhiều tệp Word, PowerPoint hoặc tài liệu bổ trợ.' : 'Chọn nhiều tệp; hệ thống kiểm tra từng tệp trước khi tải.'}</p></div></div>
          <form className="stack-form" onSubmit={uploadAsset}>
            {isWordPowerPointFlow ? <div className="upload-purpose-fixed"><Download size={18} /><div><strong>Tài liệu cho phép tải xuống</strong><small>Hiển thị thành nút tải rõ ràng trên trang chi tiết.</small></div></div> : <label>Mục đích tệp
              <select value={purpose} onChange={(event) => { setPurpose(event.target.value); setFiles([]); setInputKey((value) => value + 1); }}>
                <option value="DOWNLOAD">Tệp tải xuống</option>
                <option value="HTML_PACKAGE">Gói HTML tương tác</option>
                <option value="THUMBNAIL">Ảnh đại diện</option>
              </select>
            </label>}
            <label className="upload-drop">
              <UploadCloud size={28} />
              <strong>{files.length ? `Đã chọn ${files.length} tệp` : isWordPowerPointFlow ? 'Thả hoặc chọn nhiều tệp Word, PowerPoint' : 'Chọn tệp từ máy'}</strong>
              <small>{isWordPowerPointFlow ? 'Word, PowerPoint, PDF và các định dạng hỗ trợ khác' : `${purposeLabels[purpose]} · tối đa ${selectedLimit} MB/tệp · có thể chọn nhiều tệp`}</small>
              <input key={inputKey} type="file" accept={accept} multiple={isWordPowerPointFlow || purpose === 'DOWNLOAD'} onChange={selectFiles} />
            </label>
            {files.length > 0 && <div className="selected-file-list" aria-label="Tệp đang chờ tải lên">{files.map((selectedFile) => {
              const extension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
              const type = assetType(extension);
              return <div className="selected-file" key={selectedFile.name + selectedFile.lastModified}><span className={'asset-format-chip tone-' + type.tone}>{extension.toUpperCase()}</span><span>{selectedFile.name}</span><strong>{formatFileSize(selectedFile.size)}</strong><button type="button" onClick={() => setFiles((current) => current.filter((item) => item !== selectedFile))} aria-label={'Bỏ ' + selectedFile.name}><X size={15} /></button></div>;
            })}</div>}
            {uploadProgress && <div className="upload-batch-progress"><span style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }} /><small>Đang xử lý {uploadProgress.done}/{uploadProgress.total} tệp</small></div>}
            {error && <div className="form-error" role="alert">{error}</div>}
            {notice && <div className="inline-notice" role="status">{notice}</div>}
            <button className="button button-primary button-block" disabled={!files.length || uploading}>
              {uploading ? <LoaderCircle className="spin" size={18} /> : <UploadCloud size={18} />} {uploading ? 'Đang tải bộ tệp...' : `Tải lên${files.length ? ` ${files.length} tệp` : ''}`}
            </button>
          </form>
        </section>

        <section className="form-section storage-panel">
          <div className="form-section-title"><span><Paperclip size={20} /></span><div><h2>Dung lượng học liệu</h2><p>Tổng của tất cả tệp đang hoạt động.</p></div></div>
          <div className="storage-number"><strong>{formatFileSize(policy.usedBytes)}</strong><span>/ {policy.productFilesMb} MB</span></div>
          <div className="storage-track"><span style={{ width: usedPercent + '%' }} /></div>
          <dl className="policy-list">
            <div><dt>Tệp tiêu chuẩn</dt><dd>{policy.standardFileMb} MB/tệp</dd></div>
            {!teacherMode && <div><dt>HTML package</dt><dd>{policy.htmlPackageMb} MB/tệp</dd></div>}
            <div><dt>Định dạng</dt><dd>{policy.allowedExtensions.length} loại</dd></div>
          </dl>
          <small className="policy-formats">{policy.allowedExtensions.join(', ').toUpperCase()}</small>
        </section>
      </div>

      <section className="admin-table-card">
        <div className="panel-heading">
          <div><span className="section-kicker">Tệp đã tải lên</span><h2>{product.assets.length} tài nguyên</h2></div>
        </div>
        {product.assets.length ? (
          <div className="asset-list-admin">
            {product.assets.map((asset) => (
              <div className="managed-asset-row" key={asset.id}>
                <article>
                  <span className={'asset-format-chip tone-' + assetType(asset.extension).tone}>{asset.extension.toUpperCase()}</span>
                  {editingAssetId === asset.id
                    ? <label className="asset-name-editor"><span>Tên hiển thị</span><input value={editingName} maxLength={220} onChange={(event) => setEditingName(event.target.value)} autoFocus /></label>
                    : <div><strong>{displayFileName(asset)}</strong><small>{assetType(asset.extension).label} · {formatFileSize(asset.sizeBytes)} · Tệp đang hoạt động</small></div>}
                  <div className="asset-row-actions">
                    {editingAssetId === asset.id ? <>
                      <button type="button" className="icon-button" disabled={assetActionId === asset.id || editingName.trim().length < 3} onClick={() => saveAssetName(asset)} aria-label={'Lưu tên ' + asset.originalName}>{assetActionId === asset.id ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}</button>
                      <button type="button" className="icon-button" onClick={() => { setEditingAssetId(null); setEditingName(''); }} aria-label="Hủy đổi tên"><X size={17} /></button>
                    </> : <>
                      <button type="button" className="icon-button" onClick={() => { setEditingAssetId(asset.id); setEditingName(displayFileName(asset)); setConfirmDeleteId(null); }} aria-label={'Đổi tên ' + asset.originalName}><Pencil size={17} /></button>
                      <button type="button" className="icon-button" onClick={() => downloadAsset(asset)} aria-label={'Tải ' + asset.originalName}><Download size={17} /></button>
                      <button type="button" className="icon-button danger-icon-button" onClick={() => { setConfirmDeleteId(asset.id); setEditingAssetId(null); }} aria-label={'Gỡ ' + asset.originalName}><Trash2 size={17} /></button>
                    </>}
                  </div>
                </article>
                {confirmDeleteId === asset.id && <div className="asset-delete-confirm"><AlertCircle size={17} /><span><strong>Gỡ tệp này?</strong><small>Tệp sẽ biến mất khỏi trang tải xuống nhưng lịch sử vẫn được bảo toàn.</small></span><button type="button" className="button button-danger" disabled={assetActionId === asset.id} onClick={() => removeAsset(asset)}>{assetActionId === asset.id ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />} Gỡ tệp</button><button type="button" className="button button-secondary" onClick={() => setConfirmDeleteId(null)}>Giữ lại</button></div>}
              </div>
            ))}
          </div>
        ) : <div className="empty-assets"><Paperclip size={28} /><p>Chưa có tệp nào cho học liệu này.</p></div>}
      </section>
      {teacherMode && <div className="asset-finish-bar"><div><ShieldCheck size={19} /><span><strong>{isReady ? 'Bản nháp đã đủ điều kiện kỹ thuật' : 'Hồ sơ chưa đủ tệp'}</strong><small>{isReady ? 'Admin có thể kiểm tra nội dung và quyết định công bố.' : 'Hãy tải ít nhất một tệp trước khi rời bước này.'}</small></span></div>{isReady ? <Link className="button button-primary" to="/giao-vien/hoc-lieu"><CheckCircle2 size={17} /> Hoàn tất quản lý tệp</Link> : <button type="button" className="button button-secondary" disabled><AlertCircle size={17} /> Chưa thể hoàn tất</button>}</div>}
    </div>
  );
}
