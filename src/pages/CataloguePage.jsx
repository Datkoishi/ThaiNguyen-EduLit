import { useEffect, useMemo, useState } from 'react';
import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../api.js';
import { EmptyState, ErrorState, PageLoader, ProductCard } from '../components/Common.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const splitIds = (value) => value ? value.split(',').map(Number).filter(Boolean) : [];

export default function CataloguePage({ teacherOnly = false }) {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = useAuth();
  const [metadata, setMetadata] = useState({ categories: [], subjects: [], grades: [] });
  const [result, setResult] = useState({ data: [], meta: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileFilters, setMobileFilters] = useState(false);
  const query = searchParams.get('q') || '';
  const subjectIds = splitIds(searchParams.get('subjectIds'));
  const gradeIds = splitIds(searchParams.get('gradeIds'));
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);
  const activeCategory = teacherOnly ? 'tai-lieu-giao-vien' : categorySlug || searchParams.get('category') || '';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || (Array.isArray(value) && !value.length)) next.delete(key);
    else next.set(key, Array.isArray(value) ? value.join(',') : value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const toggleId = (key, values, id) => {
    updateParam(key, values.includes(id) ? values.filter((item) => item !== id) : [...values, id]);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (activeCategory) params.set('category', activeCategory);
      if (query) params.set('q', query);
      if (subjectIds.length) params.set('subjectIds', subjectIds.join(','));
      if (gradeIds.length) params.set('gradeIds', gradeIds.join(','));
      params.set('sort', sort);
      params.set('page', String(page));
      params.set('pageSize', '12');
      const [categories, subjects, grades, products] = await Promise.all([
        apiRequest('/categories', { token }),
        apiRequest('/subjects', { token }),
        apiRequest('/grades', { token }),
        apiRequest('/products?' + params.toString(), { token })
      ]);
      setMetadata({ categories: categories.data, subjects: subjects.data, grades: grades.data });
      setResult(products);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token, activeCategory, searchParams.toString()]);

  const heading = useMemo(() => {
    if (teacherOnly) return 'Tài liệu dành cho giáo viên';
    if (categorySlug) return metadata.categories.find((item) => item.slug === categorySlug)?.name || 'Kho học liệu';
    return query ? 'Kết quả cho “' + query + '”' : 'Khám phá học liệu';
  }, [teacherOnly, categorySlug, metadata.categories, query]);

  const activeCount = subjectIds.length + gradeIds.length + (sort !== 'newest' ? 1 : 0);
  const clearFilters = () => {
    const next = new URLSearchParams();
    if (query) next.set('q', query);
    setSearchParams(next);
  };

  return (
    <div className="page catalogue-page">
      <div className="catalogue-heading">
        <div>
          <span className="section-kicker">{teacherOnly ? 'Không gian chuyên môn' : 'Thư viện tương tác'}</span>
          <h1>{heading}</h1>
          <p>{teacherOnly ? 'Giáo án, bài trình chiếu và tài liệu hỗ trợ đã được tuyển chọn.' : 'Lọc theo môn học và khối lớp để tìm đúng nội dung bạn cần.'}</p>
        </div>
        <button className="button button-secondary mobile-filter-trigger" onClick={() => setMobileFilters(true)}>
          <SlidersHorizontal size={18} /> Bộ lọc {activeCount ? '(' + activeCount + ')' : ''}
        </button>
      </div>

      <div className="catalogue-layout">
        {mobileFilters && <button className="filter-backdrop" onClick={() => setMobileFilters(false)} aria-label="Đóng bộ lọc" />}
        <aside className={'filter-panel ' + (mobileFilters ? 'is-open' : '')}>
          <div className="filter-header"><span><Filter size={18} /> Bộ lọc</span><button className="icon-button mobile-filter-close" onClick={() => setMobileFilters(false)}><X size={19} /></button></div>

          {!categorySlug && !teacherOnly && (
            <details className="filter-group">
              <summary>Loại học liệu</summary>
              <div className="filter-group-content">
                {metadata.categories.filter((item) => item.audience === 'ALL').map((item) => (
                  <label className="radio-row" key={item.id}>
                    <input type="radio" name="category" checked={activeCategory === item.slug} onChange={() => updateParam('category', item.slug)} />
                    <span>{item.name}</span><small>{item.count}</small>
                  </label>
                ))}
              </div>
            </details>
          )}

          <details className="filter-group">
            <summary>Môn học</summary>
            <div className="filter-group-content">
              {metadata.subjects.map((item) => (
                <label className="check-row" key={item.id}>
                  <input type="checkbox" checked={subjectIds.includes(item.id)} onChange={() => toggleId('subjectIds', subjectIds, item.id)} />
                  <span>{item.name}</span>
                </label>
              ))}
            </div>
          </details>

          <details className="filter-group">
            <summary>Khối lớp</summary>
            <div className="filter-group-content">
              {metadata.grades.map((item) => (
                <label className="check-row" key={item.id}>
                  <input type="checkbox" checked={gradeIds.includes(item.id)} onChange={() => toggleId('gradeIds', gradeIds, item.id)} />
                  <span>{item.name}</span>
                </label>
              ))}
            </div>
          </details>

          {activeCount > 0 && <button className="clear-filter" onClick={clearFilters}><X size={15} /> Xóa bộ lọc</button>}
        </aside>

        <section className="catalogue-content">
          <div className="catalogue-toolbar">
            <span>{loading ? 'Đang tìm...' : (result.meta?.total || 0) + ' học liệu'}</span>
            <label>Sắp xếp
              <select value={sort} onChange={(event) => updateParam('sort', event.target.value)}>
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="title_asc">Tên A–Z</option>
              </select>
            </label>
          </div>

          {loading ? <PageLoader label="Đang tìm học liệu phù hợp..." /> : error ? <ErrorState message={error} onRetry={load} /> : result.data.length ? (
            <>
              <div className="product-grid catalogue-grid">{result.data.map((product) => <ProductCard key={product.id} product={product} />)}</div>
              {result.meta?.totalPages > 1 && (
                <nav className="pagination" aria-label="Phân trang">
                  <button disabled={page <= 1} onClick={() => updateParam('page', String(page - 1))}>Trang trước</button>
                  <span>Trang {page} / {result.meta.totalPages}</span>
                  <button disabled={page >= result.meta.totalPages} onClick={() => updateParam('page', String(page + 1))}>Trang sau</button>
                </nav>
              )}
            </>
          ) : (
            <EmptyState action={<button className="button button-secondary" onClick={clearFilters}>Xóa bộ lọc</button>} />
          )}
        </section>
      </div>
    </div>
  );
}
