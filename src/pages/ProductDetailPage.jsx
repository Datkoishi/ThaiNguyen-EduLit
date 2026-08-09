import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, BookOpen, CheckCircle2, Circle, Clock3, Download, ExternalLink, FileArchive, FileDown, FileSpreadsheet, FileText, Lightbulb, ListChecks, LoaderCircle, Maximize2, MessageCircle, Minimize2, Play, Presentation, RotateCcw, Send, ShieldCheck, Sparkles, Target, TimerReset } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_BASE, apiRequest, formatFileSize, formatLearningDuration } from '../api.js';
import { ErrorState, PageLoader, ProductArtwork } from '../components/Common.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const dateLabel = (value) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value));

const fileTypeMeta = (extension = '') => {
  const value = extension.toLowerCase();
  if (['doc', 'docx', 'rtf', 'odt'].includes(value)) return { label: 'Word', tone: 'word', Icon: FileText };
  if (['ppt', 'pptx', 'odp'].includes(value)) return { label: 'PowerPoint', tone: 'powerpoint', Icon: Presentation };
  if (['xls', 'xlsx', 'ods', 'csv'].includes(value)) return { label: 'Bảng tính', tone: 'spreadsheet', Icon: FileSpreadsheet };
  if (value === 'pdf') return { label: 'PDF', tone: 'pdf', Icon: FileText };
  if (value === 'zip') return { label: 'Tệp ZIP', tone: 'archive', Icon: FileArchive };
  return { label: value ? value.toUpperCase() : 'Tài liệu', tone: 'generic', Icon: FileDown };
};

const displayAssetName = (asset) => asset.originalName.replace(/\.[^.]+$/, '').replaceAll('-', ' ').replaceAll('_', ' ');

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { user, token } = useAuth();
  const [product, setProduct] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [experience, setExperience] = useState(null);
  const [experienceLoading, setExperienceLoading] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [playerFullscreen, setPlayerFullscreen] = useState(false);
  const [progress, setProgress] = useState(null);
  const [progressSaving, setProgressSaving] = useState(false);
  const [learningSessionId, setLearningSessionId] = useState(null);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const playerRef = useRef(null);
  const pendingSecondsRef = useRef(0);
  const heartbeatBusyRef = useRef(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const productPayload = await apiRequest('/products/' + slug, { token });
      setProduct(productPayload.data);
      const [commentPayload, progressPayload] = await Promise.all([
        apiRequest('/products/' + productPayload.data.id + '/comments', { token }),
        apiRequest('/products/' + productPayload.data.id + '/progress', { token })
      ]);
      setComments(commentPayload.data);
      setProgress(progressPayload.data);
      setLiveSeconds(progressPayload.data.activeSeconds || 0);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [slug, token]);

  useEffect(() => {
    if (!product) return undefined;
    const socket = io('/', { auth: { token }, transports: ['websocket', 'polling'] });
    socket.on('connect', () => socket.emit('subscribe:product', { productId: product.id }));
    socket.on('comment:created', (comment) => {
      setComments((current) => current.some((item) => item.id === comment.id) ? current : [...current, { ...comment, replies: comment.replies || [] }]);
    });
    socket.on('comment:replied', (reply) => {
      setComments((current) => current.map((comment) => comment.id === reply.parentCommentId
        ? { ...comment, replies: [...(comment.replies || []).filter((item) => item.id !== reply.id), reply] }
        : comment));
    });
    socket.on('comment:updated', (updated) => {
      setComments((current) => updated.status === 'HIDDEN'
        ? current.filter((comment) => comment.id !== updated.id)
        : current.map((comment) => comment.id === updated.id ? { ...comment, ...updated } : comment));
    });
    return () => socket.disconnect();
  }, [product?.id, token]);

  useEffect(() => {
    const syncFullscreenState = () => setPlayerFullscreen(document.fullscreenElement === playerRef.current);
    document.addEventListener('fullscreenchange', syncFullscreenState);
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState);
  }, []);

  useEffect(() => {
    if (!learningSessionId) return undefined;
    pendingSecondsRef.current = 0;
    const tick = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      pendingSecondsRef.current += 1;
      setLiveSeconds((current) => current + 1);
    }, 1000);
    const heartbeat = window.setInterval(async () => {
      const activeSeconds = pendingSecondsRef.current;
      if (!activeSeconds || heartbeatBusyRef.current) return;
      heartbeatBusyRef.current = true;
      try {
        const payload = await apiRequest('/learning-sessions/' + learningSessionId + '/heartbeat', {
          method: 'PATCH',
          token,
          body: { activeSeconds: Math.min(60, activeSeconds) }
        });
        pendingSecondsRef.current = Math.max(0, pendingSecondsRef.current - activeSeconds);
        setProgress(payload.data.progress);
        setLiveSeconds((current) => Math.max(current, payload.data.progress.activeSeconds + pendingSecondsRef.current));
      } catch (requestError) {
        setNotice(requestError.message);
      } finally {
        heartbeatBusyRef.current = false;
      }
    }, 30000);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(heartbeat);
      const activeSeconds = Math.min(60, pendingSecondsRef.current);
      pendingSecondsRef.current = 0;
      fetch(API_BASE + '/learning-sessions/' + learningSessionId + '/end', {
        method: 'POST',
        credentials: 'include',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        body: JSON.stringify({ activeSeconds })
      }).catch(() => {});
    };
  }, [learningSessionId, token]);

  const subjects = useMemo(() => product?.subjects?.map((item) => item.name).join(', ') || 'Tất cả môn', [product]);
  const grades = useMemo(() => product?.grades?.map((item) => item.name).join(', ') || 'Tất cả khối', [product]);
  const learningGuide = useMemo(() => product ? (product.learningGuide || {
    objective: `Sau hoạt động, em có thể nêu nội dung chính của “${product.title}” và một điều em học được.`,
    before: [
      'Đọc mục tiêu và phần giới thiệu để biết mình cần chú ý điều gì.',
      'Chuẩn bị thiết bị, âm thanh và đường truyền phù hợp.'
    ],
    during: [
      'Thực hiện lần lượt các thao tác theo hướng dẫn của học liệu.',
      'Ghi lại một chi tiết mới, một kết quả đáng chú ý hoặc điều còn chưa rõ.',
      'Nếu trình phát gặp lỗi, dùng nút Mở nguồn rồi quay lại trang này.'
    ],
    after: [
      'Tóm tắt điều quan trọng nhất bằng lời của em.',
      'Trả lời câu hỏi phản tư hoặc đặt câu hỏi trong phần bình luận.',
      'Đánh dấu hoàn thành sau khi đã trải nghiệm và phản tư.'
    ],
    reflectionQuestion: `Sau khi trải nghiệm “${product.title}”, điều nào em hiểu rõ hơn và em còn muốn tìm hiểu gì?`
  }) : null, [product]);
  const progressStatus = progress?.status || 'NOT_STARTED';
  const downloadableAssets = product?.assets?.filter((asset) => asset.purpose === 'DOWNLOAD') || [];
  const isDownloadOnly = product?.deliveryType === 'DOWNLOAD_ONLY';
  // Curated media providers need normal storage/referrer behavior to initialize their players.
  const isTrustedEmbedSource = useMemo(() => {
    try {
      const hostname = new URL(product?.embedUrl || '').hostname;
      return hostname === 'giaoviendoimoi.com' || hostname === 'www.youtube-nocookie.com';
    } catch {
      return false;
    }
  }, [product?.embedUrl]);

  const startExperience = async () => {
    setExperienceLoading(true);
    setNotice('');
    try {
      const payload = await apiRequest('/products/' + product.id + '/experience-open', { method: 'POST', token });
      setExperience(payload.data);
      const sessionPayload = await apiRequest('/products/' + product.id + '/learning-sessions', { method: 'POST', token });
      setProgress(sessionPayload.data.progress);
      setLiveSeconds(sessionPayload.data.progress.activeSeconds || 0);
      setLearningSessionId(sessionPayload.data.sessionId);
    } catch (requestError) {
      setNotice(requestError.message);
    } finally {
      setExperienceLoading(false);
    }
  };

  const restartExperience = () => {
    setExperience(null);
    setLearningSessionId(null);
    setNotice('');
  };

  const togglePlayerFullscreen = async () => {
    setNotice('');
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (playerRef.current?.requestFullscreen) {
        await playerRef.current.requestFullscreen();
      } else {
        setNotice('Trình duyệt hiện tại không hỗ trợ chế độ toàn màn hình.');
      }
    } catch {
      setNotice('Không thể chuyển sang toàn màn hình. Vui lòng kiểm tra quyền của trình duyệt.');
    }
  };

  const logExternalExperience = () => {
    setNotice('Học liệu đang được mở trong tab mới.');
    apiRequest('/products/' + product.id + '/experience-open', { method: 'POST', token })
      .then(() => apiRequest('/products/' + product.id + '/learning-sessions', { method: 'POST', token }))
      .then((sessionPayload) => {
        setProgress(sessionPayload.data.progress);
        setLiveSeconds(sessionPayload.data.progress.activeSeconds || 0);
        setLearningSessionId(sessionPayload.data.sessionId);
      })
      .catch((requestError) => setNotice(requestError.message));
  };

  const toggleCompleted = async () => {
    setProgressSaving(true);
    setNotice('');
    try {
      const payload = await apiRequest('/products/' + product.id + '/progress', {
        method: 'PATCH',
        token,
        body: { completed: progress?.status !== 'COMPLETED' }
      });
      setProgress(payload.data);
      setLiveSeconds((current) => Math.max(current, payload.data.activeSeconds || 0));
      setNotice(payload.data.status === 'COMPLETED' ? 'Đã ghi nhận hoàn thành học liệu.' : 'Đã chuyển học liệu về trạng thái đang học.');
    } catch (requestError) {
      setNotice(requestError.message);
    } finally {
      setProgressSaving(false);
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (!commentBody.trim()) return;
    setCommentLoading(true);
    setNotice('');
    try {
      const payload = await apiRequest('/products/' + product.id + '/comments', {
        method: 'POST',
        token,
        body: { body: commentBody.trim() }
      });
      setComments((current) => current.some((item) => item.id === payload.data.id) ? current : [...current, { ...payload.data, replies: [] }]);
      setCommentBody('');
    } catch (requestError) {
      setNotice(requestError.message);
    } finally {
      setCommentLoading(false);
    }
  };

  const downloadAsset = async (asset) => {
    setNotice('');
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
      setNotice(`Đang tải “${asset.originalName}”.`);
    } catch (downloadError) {
      setNotice(downloadError.message);
    }
  };

  if (loading) return <PageLoader label="Đang mở học liệu..." />;
  if (error || !product) return <ErrorState message={error || 'Không tìm thấy học liệu.'} onRetry={load} />;

  return (
    <div className="page detail-page">
      <Link className="back-link" to={'/hoc-lieu/' + product.category.slug}><ArrowLeft size={17} /> Quay lại {product.category.name}</Link>

      <header className="detail-header">
        <div className="detail-copy">
          <span className="eyebrow">{product.category.name}</span>
          <h1>{product.title}</h1>
          <p>{product.shortDescription}</p>
          <div className="detail-chips">
            {product.subjects.map((item) => <span key={item.id}>{item.name}</span>)}
            {product.grades.map((item) => <span key={item.id}>{item.name}</span>)}
          </div>
        </div>
        <div className="detail-art"><ProductArtwork product={product} /></div>
      </header>

      {downloadableAssets.length > 0 && (
        <section className="teacher-download-card" id="teacher-downloads" aria-labelledby="teacher-download-title">
          <div className="teacher-download-heading">
            <span className="teacher-download-mark"><Download size={24} /></span>
            <div><span className="section-kicker">Tài liệu có thể tải về</span><h2 id="teacher-download-title">Chọn đúng định dạng bạn cần</h2><p>Word để chỉnh sửa kế hoạch bài dạy; PowerPoint để trình chiếu trực tiếp trên lớp.</p></div>
            <span className="teacher-download-count">{downloadableAssets.length} tệp</span>
          </div>
          <div className="teacher-download-grid">
            {downloadableAssets.map((asset) => {
              const { label, tone, Icon } = fileTypeMeta(asset.extension);
              return (
                <article key={asset.id} className={'download-resource-card file-tone-' + tone}>
                  <span className="download-resource-icon"><Icon size={27} /></span>
                  <div className="download-resource-copy"><span>{label} · {asset.extension.toUpperCase()}</span><h3>{displayAssetName(asset)}</h3><small>{formatFileSize(asset.sizeBytes)} · Tệp đã được kiểm duyệt</small></div>
                  <button type="button" className="download-resource-button" disabled={!asset.canDownload} onClick={() => downloadAsset(asset)}><Download size={17} /> {asset.canDownload ? `Tải ${label}` : 'Không có quyền tải'}</button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="learning-roadmap" aria-labelledby="learning-roadmap-title">
        <div className="learning-roadmap-heading">
          <span className="roadmap-icon"><ListChecks size={24} /></span>
          <div><span className="section-kicker">Cách học đề xuất</span><h2 id="learning-roadmap-title">Học theo 3 bước, không bỏ sót phần quan trọng</h2><p>{learningGuide.objective}</p></div>
          <span className="learning-guide-source">{product.aiAssisted ? <><Sparkles size={14} /> AI hỗ trợ · Admin đã duyệt</> : <><ShieldCheck size={14} /> Hướng dẫn hệ thống</>}</span>
        </div>
        <div className="roadmap-steps">
          <article className={'roadmap-step ' + (progressStatus !== 'NOT_STARTED' ? 'is-complete' : 'is-active')}>
            <div className="roadmap-step-top"><span className="roadmap-number">01</span><Target size={20} /><strong>Chuẩn bị</strong>{progressStatus !== 'NOT_STARTED' && <CheckCircle2 size={18} />}</div>
            <ul>{learningGuide.before.map((item, index) => <li key={index}>{item}</li>)}</ul>
          </article>
          <article className={'roadmap-step ' + (progressStatus === 'COMPLETED' ? 'is-complete' : progressStatus === 'IN_PROGRESS' ? 'is-active' : '')}>
            <div className="roadmap-step-top"><span className="roadmap-number">02</span><Play size={20} /><strong>Trải nghiệm</strong>{progressStatus === 'COMPLETED' && <CheckCircle2 size={18} />}</div>
            <ul>{learningGuide.during.map((item, index) => <li key={index}>{item}</li>)}</ul>
            <button type="button" className="roadmap-link" onClick={() => document.getElementById(isDownloadOnly ? 'teacher-downloads' : 'learning-experience')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{isDownloadOnly ? 'Đi đến tài liệu tải xuống' : 'Đi đến trình phát'} <ArrowUpRight size={15} /></button>
          </article>
          <article className={'roadmap-step ' + (progressStatus === 'COMPLETED' ? 'is-complete' : progressStatus === 'IN_PROGRESS' ? 'is-active' : '')}>
            <div className="roadmap-step-top"><span className="roadmap-number">03</span><Lightbulb size={20} /><strong>Phản tư & hoàn thành</strong>{progressStatus === 'COMPLETED' && <CheckCircle2 size={18} />}</div>
            <ul>{learningGuide.after.map((item, index) => <li key={index}>{item}</li>)}</ul>
            <button type="button" className="roadmap-link" onClick={() => document.getElementById('learning-reflection')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Viết phản tư <MessageCircle size={15} /></button>
          </article>
        </div>
      </section>

      <section className={'learning-progress-strip progress-' + (progress?.status || 'NOT_STARTED').toLowerCase()}>
        <div className="learning-progress-icon">{progress?.status === 'COMPLETED' ? <CheckCircle2 size={24} /> : progress?.status === 'IN_PROGRESS' ? <TimerReset size={24} /> : <Circle size={24} />}</div>
        <div className="learning-progress-copy">
          <span className="section-kicker">Hành trình của bạn</span>
          <div><h2>{progress?.status === 'COMPLETED' ? 'Đã hoàn thành' : progress?.status === 'IN_PROGRESS' ? 'Đang học' : 'Chưa bắt đầu'}</h2><span>{progress?.status === 'COMPLETED' ? 'Bạn vẫn có thể mở lại để ôn tập.' : 'Thời gian chỉ được ghi khi trải nghiệm đang hoạt động.'}</span></div>
          <div className="learning-state-track" aria-label={'Trạng thái: ' + (progress?.status || 'NOT_STARTED')}><i /><i /><i /></div>
        </div>
        <dl className="learning-progress-stats">
          <div><dt>Thời gian học</dt><dd>{formatLearningDuration(liveSeconds)}</dd></div>
          <div><dt>Lượt bắt đầu</dt><dd>{progress?.openCount || 0}</dd></div>
        </dl>
        <button className={'button ' + (progress?.status === 'COMPLETED' ? 'button-secondary' : 'button-primary')} onClick={toggleCompleted} disabled={progressSaving}>{progressSaving ? <LoaderCircle className="spin" size={18} /> : <CheckCircle2 size={18} />}{progress?.status === 'COMPLETED' ? 'Chuyển về đang học' : 'Đánh dấu hoàn thành'}</button>
      </section>

      {!isDownloadOnly && <section className="experience-card" id="learning-experience">
        <div className="experience-heading">
          <div><span className="section-kicker">Không gian trải nghiệm</span><h2>Bắt đầu học liệu</h2></div>
          <div className="experience-heading-actions">{learningSessionId && <span className="active-learning-timer"><Clock3 size={15} /> {formatLearningDuration(liveSeconds, true)}</span>}<span className="delivery-badge">{product.deliveryType.replaceAll('_', ' ')}</span></div>
        </div>
        {experience?.url ? (
          <div className={'iframe-wrap' + (product.category.slug === 'tro-choi-tuong-tac' ? ' iframe-wrap--game' : '')} ref={playerRef}>
            <iframe
              src={experience.url}
              title={'Trải nghiệm ' + product.title}
              sandbox={isTrustedEmbedSource ? undefined : (experience.sandbox || 'allow-forms allow-popups allow-scripts')}
              allow="autoplay; encrypted-media; fullscreen; microphone; camera; picture-in-picture"
              referrerPolicy={isTrustedEmbedSource ? 'strict-origin-when-cross-origin' : 'no-referrer'}
            />
            <div className="iframe-toolbar">
              <span><span className="live-dot" /> Đang chạy trong hệ thống</span>
              <div>
                <button type="button" onClick={restartExperience}><RotateCcw size={15} /> Chơi lại</button>
                <button type="button" onClick={togglePlayerFullscreen}>
                  {playerFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                  {playerFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
                </button>
                <a href={product.experienceUrl || product.embedUrl || experience.url} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Mở nguồn</a>
              </div>
            </div>
          </div>
        ) : (
          <div className="experience-placeholder">
            <span className="play-orb"><Play size={30} fill="currentColor" /></span>
            <h3>Sẵn sàng khám phá?</h3>
            <p>Hệ thống sẽ kiểm tra quyền và mở nội dung theo phương thức phù hợp.</p>
            {product.deliveryType === 'EXTERNAL' && product.experienceUrl ? (
              <a className="button button-primary" href={product.experienceUrl} target="_blank" rel="noreferrer" onClick={logExternalExperience}>
                <ArrowUpRight size={18} /> Bắt đầu trải nghiệm
              </a>
            ) : (
              <button className="button button-primary" onClick={startExperience} disabled={experienceLoading}>
                {experienceLoading ? <LoaderCircle className="spin" size={18} /> : <ArrowUpRight size={18} />} Bắt đầu trải nghiệm
              </button>
            )}
          </div>
        )}
      </section>}

      {notice && <div className="inline-notice">{notice}</div>}

      <div className="detail-columns">
        <section className="content-card">
          <span className="section-kicker">Giới thiệu học liệu</span>
          <h2>Nội dung và mục tiêu</h2>
          <p>{product.contentDescription || product.shortDescription}</p>
          <div className="quality-list">
            <span><CheckCircle2 size={18} /> Nội dung được Admin kiểm duyệt</span>
            <span><ShieldCheck size={18} /> Truy cập phù hợp theo vai trò</span>
            <span><BookOpen size={18} /> Tương thích máy tính và điện thoại</span>
          </div>
        </section>

        <aside className="metadata-card">
          <h3>Thông tin học liệu</h3>
          <dl>
            <div><dt>Loại</dt><dd>{product.category.name}</dd></div>
            <div><dt>Môn học</dt><dd>{subjects}</dd></div>
            <div><dt>Khối lớp</dt><dd>{grades}</dd></div>
            <div><dt>Cập nhật</dt><dd>{dateLabel(product.updatedAt)}</dd></div>
          </dl>
        </aside>
      </div>

      <section className="comments-card" id="learning-reflection">
        <div className="comments-heading">
          <div><span className="section-kicker">Trao đổi và hỗ trợ</span><h2>Bình luận & câu hỏi</h2></div>
          <span className="comment-count"><MessageCircle size={17} /> {comments.length}</span>
        </div>

        <div className="reflection-prompt"><Lightbulb size={19} /><div><strong>Câu hỏi phản tư</strong><p>{learningGuide.reflectionQuestion}</p></div></div>

        {user ? (
          <form className="comment-form" onSubmit={submitComment}>
            <div className="avatar">{user.fullName.slice(0, 1).toUpperCase()}</div>
            <label>
              <span className="sr-only">Nội dung bình luận</span>
              <textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} maxLength={2000} placeholder="Đặt câu hỏi hoặc chia sẻ cảm nhận của bạn..." />
              <small>{commentBody.length}/2000</small>
            </label>
            <button className="button button-primary" type="submit" disabled={commentLoading || !commentBody.trim()}>
              {commentLoading ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />} Gửi
            </button>
          </form>
        ) : (
          <div className="comment-login"><MessageCircle size={24} /><p>Đăng nhập để đặt câu hỏi và trao đổi về học liệu.</p><Link className="button button-secondary" to="/dang-nhap">Đăng nhập</Link></div>
        )}

        <div className="comment-list">
          {comments.length ? comments.map((comment) => (
            <article className="comment-item" key={comment.id}>
              <div className="avatar">{comment.author?.fullName?.slice(0, 1).toUpperCase() || '?'}</div>
              <div>
                <div className="comment-meta"><strong>{comment.author?.fullName}</strong><span>{comment.author?.role === 'ADMIN' ? 'Quản trị viên' : comment.author?.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}</span><time>{dateLabel(comment.createdAt)}</time></div>
                <p>{comment.body}</p>
                {comment.replies?.map((reply) => (
                  <div className="admin-reply" key={reply.id}>
                    <div className="reply-label"><ShieldCheck size={16} /> Phản hồi từ quản trị viên</div>
                    <p>{reply.body}</p>
                  </div>
                ))}
              </div>
            </article>
          )) : <div className="no-comments">Chưa có bình luận. Hãy là người đầu tiên đặt câu hỏi.</div>}
        </div>
      </section>
    </div>
  );
}
