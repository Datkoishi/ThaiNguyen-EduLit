import { useEffect, useMemo, useState } from 'react';
import {
  BookMarked,
  CheckCircle2,
  CircleOff,
  FolderTree,
  GraduationCap,
  Layers3,
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  Search,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  X
} from 'lucide-react';
import { apiRequest } from '../api.js';
import { ErrorState, PageLoader } from '../components/Common.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const sections = {
  categories: {
    label: 'Danh mục',
    singular: 'danh mục',
    path: 'categories',
    icon: FolderTree,
    description: 'Nhóm học liệu theo loại trải nghiệm và phạm vi người xem.'
  },
  subjects: {
    label: 'Môn học',
    singular: 'môn học',
    path: 'subjects',
    icon: BookMarked,
    description: 'Metadata bắt buộc để tìm kiếm và cá nhân hóa học liệu.'
  },
  grades: {
    label: 'Khối lớp',
    singular: 'khối lớp',
    path: 'grades',
    icon: GraduationCap,
    description: 'Xác định độ tuổi và cấp học phù hợp cho từng nội dung.'
  }
};

const slugify = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const emptyForm = (kind, sortOrder = 0) => ({
  name: '',
  slug: '',
  sortOrder,
  isActive: true,
  ...(kind === 'categories' ? { description: '', audience: 'ALL' } : {})
});

function MetadataForm({ kind, value, saving, onChange, onSubmit, submitLabel, onCancel }) {
  const changeName = (nextName) => {
    const previousAutoSlug = slugify(value.name);
    onChange({
      ...value,
      name: nextName,
      slug: !value.slug || value.slug === previousAutoSlug ? slugify(nextName) : value.slug
    });
  };

  return (
    <form className="metadata-form" onSubmit={onSubmit}>
      <div className="metadata-form-grid">
        <label>Tên hiển thị<input value={value.name} onChange={(event) => changeName(event.target.value)} required maxLength={100} placeholder={kind === 'categories' ? 'Ví dụ: Bài giảng tương tác' : kind === 'subjects' ? 'Ví dụ: Tin học' : 'Ví dụ: Khối 12'} /></label>
        <label>Slug hệ thống<input value={value.slug} onChange={(event) => onChange({ ...value, slug: event.target.value.toLowerCase() })} required maxLength={120} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="ten-khong-dau" /></label>
        <label>Thứ tự<input type="number" min="0" max="32767" value={value.sortOrder} onChange={(event) => onChange({ ...value, sortOrder: Number(event.target.value) })} required /></label>
        {kind === 'categories' && <label>Phạm vi<select value={value.audience} onChange={(event) => onChange({ ...value, audience: event.target.value })}><option value="ALL">Mọi người dùng</option><option value="TEACHER_ONLY">Giáo viên & Admin</option></select></label>}
        {kind === 'categories' && <label className="metadata-description">Mô tả<textarea rows="3" maxLength={300} value={value.description} onChange={(event) => onChange({ ...value, description: event.target.value })} placeholder="Mô tả ngắn mục đích của danh mục..." /></label>}
        <label className="metadata-active-field">
          <input type="checkbox" checked={value.isActive} onChange={(event) => onChange({ ...value, isActive: event.target.checked })} />
          <span>{value.isActive ? <ToggleRight size={25} /> : <ToggleLeft size={25} />}<strong>{value.isActive ? 'Đang sử dụng' : 'Ngừng sử dụng'}</strong><small>Metadata ngừng sử dụng không xuất hiện trong bộ lọc hoặc biểu mẫu mới.</small></span>
        </label>
      </div>
      <div className="metadata-form-actions">
        {onCancel && <button type="button" className="button button-secondary" onClick={onCancel}><X size={17} /> Hủy</button>}
        <button className="button button-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />} {submitLabel}</button>
      </div>
    </form>
  );
}

export default function AdminMetadataPage() {
  const { token } = useAuth();
  const [metadata, setMetadata] = useState({ categories: [], subjects: [], grades: [] });
  const [activeSection, setActiveSection] = useState('categories');
  const [createForm, setCreateForm] = useState(emptyForm('categories'));
  const [editForm, setEditForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async ({ keepLoading = false } = {}) => {
    if (!keepLoading) setLoading(true);
    setError('');
    try {
      const payload = await apiRequest('/admin/metadata', { token });
      setMetadata(payload.data);
      return payload.data;
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const chooseSection = (key) => {
    setActiveSection(key);
    setCreateForm(emptyForm(key, metadata[key].length ? Math.max(...metadata[key].map((item) => item.sortOrder)) + 10 : 0));
    setEditingId(null);
    setEditForm(null);
    setQuery('');
    setError('');
    setNotice('');
  };

  const filteredItems = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('vi');
    return metadata[activeSection].filter((item) => !term || [item.name, item.slug, item.description || ''].join(' ').toLocaleLowerCase('vi').includes(term));
  }, [metadata, activeSection, query]);

  const submitCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await apiRequest('/admin/' + sections[activeSection].path, { method: 'POST', token, body: createForm });
      setNotice(`Đã tạo ${sections[activeSection].singular} mới và ghi vào nhật ký quản trị.`);
      const nextMetadata = await load({ keepLoading: true });
      const nextItems = nextMetadata?.[activeSection] || [];
      const nextOrder = nextItems.length ? Math.max(...nextItems.map((item) => item.sortOrder)) + 10 : 0;
      setCreateForm(emptyForm(activeSection, nextOrder));
    } catch (requestError) {
      setError(Object.values(requestError.fields || {})[0] || requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      slug: item.slug,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
      ...(activeSection === 'categories' ? { description: item.description || '', audience: item.audience } : {})
    });
    setError('');
    setNotice('');
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await apiRequest('/admin/' + sections[activeSection].path + '/' + editingId, { method: 'PATCH', token, body: editForm });
      setNotice(`Đã cập nhật ${sections[activeSection].singular}.`);
      setEditingId(null);
      setEditForm(null);
      await load({ keepLoading: true });
    } catch (requestError) {
      setError(Object.values(requestError.fields || {})[0] || requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item) => {
    if (item.isActive && item.usageCount > 0 && !window.confirm(`${item.name} đang được dùng bởi ${item.usageCount} học liệu. Vô hiệu hóa sẽ ẩn lựa chọn này khỏi biểu mẫu mới${activeSection === 'categories' ? ' và ẩn học liệu thuộc danh mục khỏi thư viện công khai' : ''}. Bạn vẫn muốn tiếp tục?`)) return;
    setBusyId(item.id);
    setError('');
    setNotice('');
    try {
      const body = {
        name: item.name,
        slug: item.slug,
        sortOrder: item.sortOrder,
        isActive: !item.isActive,
        ...(activeSection === 'categories' ? { description: item.description || '', audience: item.audience } : {})
      };
      await apiRequest('/admin/' + sections[activeSection].path + '/' + item.id, { method: 'PATCH', token, body });
      setNotice(`${item.name} đã ${item.isActive ? 'ngừng sử dụng' : 'được kích hoạt lại'}.`);
      await load({ keepLoading: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <PageLoader label="Đang tải hệ thống phân loại..." />;
  if (error && !Object.values(metadata).some((items) => items.length)) return <ErrorState message={error} onRetry={load} />;

  const SectionIcon = sections[activeSection].icon;
  const totalItems = Object.values(metadata).reduce((sum, items) => sum + items.length, 0);

  return (
    <div className="page admin-page metadata-page">
      <div className="admin-title">
        <div><span className="section-kicker">Kiến trúc nội dung</span><h1>Danh mục, Môn & Khối</h1><p>Quản trị metadata dùng xuyên suốt tìm kiếm, bộ lọc, kiểm duyệt và cá nhân hóa học liệu.</p></div>
        <span className="admin-title-stat"><Layers3 size={20} /><strong>{totalItems}</strong> giá trị</span>
      </div>

      <div className="metadata-summary-grid">
        {Object.entries(sections).map(([key, section]) => {
          const Icon = section.icon;
          const activeCount = metadata[key].filter((item) => item.isActive).length;
          return <button key={key} className={'metadata-summary-card ' + (activeSection === key ? 'active' : '')} onClick={() => chooseSection(key)}><span><Icon size={21} /></span><div><strong>{section.label}</strong><small>{activeCount}/{metadata[key].length} đang dùng</small></div></button>;
        })}
      </div>

      <section className="form-section metadata-create-panel">
        <div className="form-section-title"><span><Plus size={19} /></span><div><h2>Thêm {sections[activeSection].singular}</h2><p>{sections[activeSection].description}</p></div></div>
        <MetadataForm kind={activeSection} value={createForm} saving={saving} onChange={setCreateForm} onSubmit={submitCreate} submitLabel="Tạo mới" />
      </section>

      {notice && <div className="inline-notice"><span><CheckCircle2 size={17} /> {notice}</span></div>}
      {error && <div className="form-error">{error}</div>}

      <section className="admin-table-card metadata-list-panel">
        <div className="metadata-list-heading">
          <div><span className="metadata-heading-icon"><SectionIcon size={20} /></span><div><span className="section-kicker">Dữ liệu hiện có</span><h2>{sections[activeSection].label}</h2></div></div>
          <label className="table-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={'Tìm ' + sections[activeSection].singular + '...'} /></label>
        </div>
        <div className="metadata-items">
          {filteredItems.map((item) => (
            <article className={'metadata-item ' + (!item.isActive ? 'inactive' : '')} key={item.id}>
              <span className="metadata-order">{item.sortOrder}</span>
              <div className="metadata-item-copy"><div><strong>{item.name}</strong><span className={'metadata-state ' + (item.isActive ? 'is-active' : 'is-inactive')}>{item.isActive ? 'Đang dùng' : 'Đã tắt'}</span>{activeSection === 'categories' && <span className="metadata-audience">{item.audience === 'ALL' ? 'Mọi người' : 'Giáo viên'}</span>}</div><code>/{item.slug}</code>{item.description && <p>{item.description}</p>}</div>
              <div className="metadata-usage"><strong>{item.usageCount}</strong><small>học liệu</small></div>
              <div className="metadata-item-actions">
                <button className="icon-button" onClick={() => beginEdit(item)} aria-label={'Sửa ' + item.name}><Pencil size={17} /></button>
                <button className={'icon-button metadata-toggle ' + (item.isActive ? 'turn-off' : 'turn-on')} onClick={() => toggleStatus(item)} disabled={busyId === item.id} aria-label={(item.isActive ? 'Ngừng sử dụng ' : 'Kích hoạt ') + item.name}>{busyId === item.id ? <LoaderCircle className="spin" size={17} /> : item.isActive ? <CircleOff size={17} /> : <CheckCircle2 size={17} />}</button>
              </div>
            </article>
          ))}
          {!filteredItems.length && <div className="empty-assets"><Search size={28} /><p>Không có dữ liệu phù hợp từ khóa.</p></div>}
        </div>
      </section>

      {editingId && editForm && <section className="operation-drawer metadata-edit-drawer">
        <div className="panel-heading"><div><span className="section-kicker">Chỉnh sửa {sections[activeSection].singular}</span><h2>{editForm.name}</h2></div><button className="text-button" onClick={() => { setEditingId(null); setEditForm(null); }}>Đóng</button></div>
        {!editForm.isActive && <div className="metadata-warning"><ShieldAlert size={18} /><span>Dữ liệu đang ngừng sử dụng. Kích hoạt lại để xuất hiện trong bộ lọc và biểu mẫu tạo học liệu.</span></div>}
        <MetadataForm kind={activeSection} value={editForm} saving={saving} onChange={setEditForm} onSubmit={submitEdit} submitLabel="Lưu thay đổi" onCancel={() => { setEditingId(null); setEditForm(null); }} />
      </section>}
    </div>
  );
}
