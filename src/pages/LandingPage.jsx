import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Video, Gamepad2, FileText, Sparkles, Search, MonitorPlay,
  ArrowRight, ShieldCheck, Zap, Globe, MessageSquare, User, BrainCircuit, Play, ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  // Cuộn mượt đến section
  const scrollToSection = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Hiệu ứng Reveal khi cuộn
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.1 }
    );

    const revealElements = document.querySelectorAll('.lp-reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="landing-page">
      {/* 1. Thanh điều hướng */}
      <nav className="lp-navbar">
        <div className="lp-container lp-nav-inner">
          <Link to="/" className="lp-brand">
            <img src="/logo.png" alt="Logo" className="lp-logo" onError={(e) => e.target.style.display = 'none'} />
          </Link>
          <div className="lp-menu">
            <a href="#" onClick={(e) => scrollToSection(e, 'hero')}>Trang chủ</a>
            <a href="#danh-muc" onClick={(e) => scrollToSection(e, 'danh-muc')}>Sách tương tác</a>
            <a href="#danh-muc" onClick={(e) => scrollToSection(e, 'danh-muc')}>Video tương tác</a>
            <a href="#danh-muc" onClick={(e) => scrollToSection(e, 'danh-muc')}>Trò chơi tương tác</a>
            <a href="#danh-muc" onClick={(e) => scrollToSection(e, 'danh-muc')}>Tài liệu giáo viên</a>
            <a href="#gioi-thieu" onClick={(e) => scrollToSection(e, 'gioi-thieu')}>Giới thiệu</a>
            <Link to="/dang-nhap" className="lp-login-link">Đăng nhập</Link>
          </div>
          <Link to="/dang-nhap" className="button button-primary lp-nav-cta">Khám phá học liệu</Link>
        </div>
      </nav>

      {/* 2. Phần mở đầu – Hero Section */}
      <section id="hero" className="lp-hero">
        <div className="lp-container lp-hero-content">
          <div className="lp-hero-text lp-reveal lp-fade-right">
            <div className="lp-eyebrow">
              <Sparkles size={16} /> Kho học liệu số ứng dụng trí tuệ nhân tạo
            </div>
            <h1>Khám phá văn học dân gian Thái Nguyên qua kho học liệu số AI</h1>
            <p>
              Hành trình tìm hiểu truyện kể, truyền thuyết, dân ca, phong tục và những giá trị văn hóa đặc sắc của Thái Nguyên thông qua sách tương tác, video, trò chơi và các hoạt động học tập trực tuyến.
            </p>
            <p className="lp-hero-sub">
              Học sinh có thể chủ động khám phá kiến thức, trải nghiệm nội dung sinh động và nhận sự hỗ trợ từ AI trong quá trình học tập.
            </p>
            <div className="lp-hero-actions">
              <Link to="/dang-nhap" className="button button-primary lp-btn-large">
                Bắt đầu khám phá <ArrowRight size={18} />
              </Link>
              <a href="#noi-bat" onClick={(e) => scrollToSection(e, 'noi-bat')} className="button button-secondary lp-btn-large">
                Xem học liệu nổi bật
              </a>
            </div>
            <div className="lp-hero-note">
              <ShieldCheck size={16} /> Học mọi lúc, trải nghiệm mọi nơi, kết nối văn học với công nghệ.
            </div>
          </div>
          <div className="lp-hero-visual lp-reveal lp-fade-left">
            <div className="lp-hero-card">
              <div className="lp-hero-card-icon"><MonitorPlay size={48} /></div>
              <div className="lp-hero-card-content">
                <strong>Trải nghiệm đa phương tiện</strong>
                <span>Khám phá tri thức trực quan</span>
              </div>
            </div>
            <div className="lp-hero-orbit orbit-1"></div>
            <div className="lp-hero-orbit orbit-2"></div>
          </div>
        </div>
      </section>

      {/* 3. Giới thiệu hệ thống */}
      <section id="gioi-thieu" className="lp-intro">
        <div className="lp-container">
          <div className="lp-section-header lp-reveal lp-fade-up">
            <span className="lp-kicker">Nơi văn học truyền thống gặp gỡ công nghệ hiện đại</span>
            <h2>Giới thiệu hệ thống</h2>
          </div>
          <div className="lp-intro-grid">
            <div className="lp-intro-item lp-reveal lp-fade-up" style={{ transitionDelay: '100ms' }}>
              <div className="lp-intro-icon"><BookOpen size={32} /></div>
              <p>Học liệu số Văn học Thái Nguyên là không gian học tập trực tuyến được xây dựng nhằm lưu giữ, giới thiệu và lan tỏa những giá trị đặc sắc của văn học dân gian địa phương.</p>
            </div>
            <div className="lp-intro-item lp-reveal lp-fade-up" style={{ transitionDelay: '200ms' }}>
              <div className="lp-intro-icon"><Gamepad2 size={32} /></div>
              <p>Thay vì chỉ tiếp cận kiến thức qua văn bản, người học có thể khám phá nội dung bằng nhiều hình thức như sách tương tác, video, hình ảnh, âm thanh, trò chơi và câu hỏi trải nghiệm.</p>
            </div>
            <div className="lp-intro-item lp-reveal lp-fade-up" style={{ transitionDelay: '300ms' }}>
              <div className="lp-intro-icon"><BrainCircuit size={32} /></div>
              <p>Công nghệ AI được sử dụng để hỗ trợ tìm kiếm học liệu, giải thích nội dung, gợi ý chủ đề và giúp người học tiếp cận tác phẩm một cách trực quan, thuận tiện hơn.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Các giá trị nổi bật */}
      <section className="lp-features">
        <div className="lp-container">
          <div className="lp-section-header center lp-reveal lp-fade-up">
            <span className="lp-kicker">Một không gian học tập trực quan, linh hoạt và giàu trải nghiệm</span>
            <h2>Các giá trị nổi bật</h2>
          </div>
          <div className="lp-features-grid">
            <div className="lp-feature-card lp-reveal lp-fade-up" style={{ transitionDelay: '100ms' }}>
              <Video size={28} className="lp-feature-icon" />
              <h3>Học liệu đa phương tiện</h3>
              <p>Kết hợp văn bản, hình ảnh, âm thanh, video và hoạt động tương tác trong cùng một hệ thống.</p>
            </div>
            <div className="lp-feature-card lp-reveal lp-fade-up" style={{ transitionDelay: '200ms' }}>
              <Sparkles size={28} className="lp-feature-icon" />
              <h3>Cá nhân hóa với AI</h3>
              <p>AI hỗ trợ tìm kiếm, giải thích khái niệm, tóm tắt nội dung và gợi ý học liệu phù hợp với nhu cầu của người học.</p>
            </div>
            <div className="lp-feature-card lp-reveal lp-fade-up" style={{ transitionDelay: '300ms' }}>
              <Zap size={28} className="lp-feature-icon" />
              <h3>Trải nghiệm chủ động</h3>
              <p>Học sinh không chỉ đọc mà còn được xem, nghe, tương tác, trả lời câu hỏi và tham gia trò chơi.</p>
            </div>
            <div className="lp-feature-card lp-reveal lp-fade-up" style={{ transitionDelay: '400ms' }}>
              <FileText size={28} className="lp-feature-icon" />
              <h3>Hỗ trợ giáo viên</h3>
              <p>Cung cấp giáo án, PowerPoint và tài liệu tham khảo phục vụ quá trình thiết kế bài giảng.</p>
            </div>
            <div className="lp-feature-card lp-reveal lp-fade-up" style={{ transitionDelay: '500ms' }}>
              <Globe size={28} className="lp-feature-icon" />
              <h3>Bảo tồn giá trị địa phương</h3>
              <p>Góp phần đưa văn học dân gian và bản sắc văn hóa Thái Nguyên đến gần hơn với thế hệ trẻ.</p>
            </div>
            <div className="lp-feature-card lp-reveal lp-fade-up" style={{ transitionDelay: '600ms' }}>
              <MonitorPlay size={28} className="lp-feature-icon" />
              <h3>Học tập mọi lúc, mọi nơi</h3>
              <p>Giao diện thân thiện, có thể sử dụng thuận tiện trên máy tính, máy tính bảng và điện thoại.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Danh mục học liệu */}
      <section id="danh-muc" className="lp-categories">
        <div className="lp-container">
          <div className="lp-section-header lp-reveal lp-fade-up">
            <span className="lp-kicker">Khám phá kho học liệu số</span>
            <h2>Mỗi loại học liệu mang đến một cách tiếp cận khác nhau, giúp người học hiểu sâu và ghi nhớ tự nhiên.</h2>
          </div>
          <div className="lp-category-list">
            <div className="lp-cat-box cat-book lp-reveal lp-fade-up" style={{ transitionDelay: '100ms' }}>
              <div className="lp-cat-icon"><BookOpen size={40} /></div>
              <h3>Sách tương tác</h3>
              <p>Khám phá tác phẩm qua hình ảnh, âm thanh, hiệu ứng lật trang và các nội dung minh họa trực quan.</p>
              <Link to="/dang-nhap" className="lp-cat-btn">Xem sách tương tác <ChevronRight size={16} /></Link>
            </div>
            <div className="lp-cat-box cat-video lp-reveal lp-fade-up" style={{ transitionDelay: '200ms' }}>
              <div className="lp-cat-icon"><Video size={40} /></div>
              <h3>Video tương tác</h3>
              <p>Theo dõi video, trả lời câu hỏi trong quá trình xem và tự kiểm tra mức độ hiểu bài.</p>
              <Link to="/dang-nhap" className="lp-cat-btn">Xem video <ChevronRight size={16} /></Link>
            </div>
            <div className="lp-cat-box cat-game lp-reveal lp-fade-up" style={{ transitionDelay: '300ms' }}>
              <div className="lp-cat-icon"><Gamepad2 size={40} /></div>
              <h3>Trò chơi tương tác</h3>
              <p>Ôn luyện kiến thức thông qua câu đố, thử thách, hoạt động ghép nối và trò chơi giáo dục.</p>
              <Link to="/dang-nhap" className="lp-cat-btn">Trải nghiệm ngay <ChevronRight size={16} /></Link>
            </div>
            <div className="lp-cat-box cat-doc lp-reveal lp-fade-up" style={{ transitionDelay: '400ms' }}>
              <div className="lp-cat-icon"><FileText size={40} /></div>
              <h3>Tài liệu dành cho giáo viên</h3>
              <p>Tổng hợp giáo án, PowerPoint và các tài liệu hỗ trợ tổ chức hoạt động dạy học.</p>
              <Link to="/dang-nhap" className="lp-cat-btn">Xem tài liệu <ChevronRight size={16} /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Phần giới thiệu AI */}
      <section className="lp-ai-intro">
        <div className="lp-container lp-ai-inner">
          <div className="lp-ai-text lp-reveal lp-fade-right">
            <span className="lp-kicker"><Sparkles size={16} /> Trợ lý AI đồng hành cùng người học</span>
            <h2>Không biết bắt đầu từ đâu?</h2>
            <p>Hãy đặt câu hỏi cho trợ lý AI để được hỗ trợ trong quá trình tìm hiểu văn học dân gian Thái Nguyên.</p>
            <ul className="lp-ai-list">
              <li><CheckIcon /> Tìm kiếm học liệu theo từ khóa hoặc chủ đề.</li>
              <li><CheckIcon /> Giải thích từ ngữ, hình ảnh và chi tiết văn hóa.</li>
              <li><CheckIcon /> Tóm tắt nội dung học liệu.</li>
              <li><CheckIcon /> Đề xuất sách, video hoặc trò chơi liên quan.</li>
              <li><CheckIcon /> Gợi ý câu hỏi ôn tập sau mỗi nội dung.</li>
              <li><CheckIcon /> Hỗ trợ giáo viên xây dựng hoạt động học tập.</li>
            </ul>
            <div className="lp-ai-note">
              <strong>Ghi chú:</strong> Nội dung do AI cung cấp mang tính hỗ trợ học tập. Người dùng nên đối chiếu với học liệu và tài liệu chuyên môn trên hệ thống.
            </div>
            <Link to="/dang-nhap" className="button button-primary lp-btn-large">
              Trò chuyện với trợ lý AI <MessageSquare size={18} style={{ marginLeft: 8 }} />
            </Link>
          </div>
          <div className="lp-ai-visual lp-reveal lp-fade-left">
            <div className="lp-ai-mockup">
              <div className="lp-ai-msg user">Kể cho tôi nghe về truyền thuyết núi Cốc?</div>
              <div className="lp-ai-msg bot" style={{ transitionDelay: '500ms' }}>Truyền thuyết núi Cốc là câu chuyện tình cảm động giữa chàng Cốc và nàng Công... Dưới đây là học liệu liên quan bạn có thể xem.</div>
              <div className="lp-ai-msg user" style={{ transitionDelay: '1000ms' }}>Có trò chơi nào về chủ đề này không?</div>
              <div className="lp-ai-msg bot" style={{ transitionDelay: '1500ms' }}>Có! Bạn hãy thử trải nghiệm "Trò chơi ô chữ: Huyền thoại Hồ Núi Cốc" nhé.</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Học liệu nổi bật */}
      <section id="noi-bat" className="lp-featured">
        <div className="lp-container">
          <div className="lp-section-header center lp-reveal lp-fade-up">
            <span className="lp-kicker">Học liệu được đề xuất</span>
            <h2>Khám phá những nội dung tiêu biểu đang được giới thiệu trên hệ thống.</h2>
          </div>
          <div className="lp-featured-grid">
            <div className="lp-product-card lp-reveal lp-fade-up" style={{ transitionDelay: '100ms' }}>
              <div className="lp-pc-type"><BookOpen size={14} /> Sách tương tác</div>
              <h3>Khám phá một truyện dân gian Thái Nguyên</h3>
              <p>Tìm hiểu nội dung, nhân vật và những giá trị văn hóa được thể hiện trong truyện.</p>
              <Link to="/dang-nhap" className="lp-pc-btn">Khám phá <ArrowRight size={16} /></Link>
            </div>
            <div className="lp-product-card lp-reveal lp-fade-up" style={{ transitionDelay: '200ms' }}>
              <div className="lp-pc-type"><Video size={14} /> Video tương tác</div>
              <h3>Văn hóa Thái Nguyên qua lời kể dân gian</h3>
              <p>Theo dõi nội dung trực quan và trả lời câu hỏi trong quá trình xem.</p>
              <Link to="/dang-nhap" className="lp-pc-btn">Xem video <ArrowRight size={16} /></Link>
            </div>
            <div className="lp-product-card lp-reveal lp-fade-up" style={{ transitionDelay: '300ms' }}>
              <div className="lp-pc-type"><Gamepad2 size={14} /> Trò chơi tương tác</div>
              <h3>Thử tài hiểu biết văn học dân gian</h3>
              <p>Vượt qua các câu hỏi và thử thách để củng cố kiến thức đã học.</p>
              <Link to="/dang-nhap" className="lp-pc-btn">Chơi ngay <ArrowRight size={16} /></Link>
            </div>
            <div className="lp-product-card lp-reveal lp-fade-up" style={{ transitionDelay: '400ms' }}>
              <div className="lp-pc-type"><FileText size={14} /> Tài liệu giáo viên</div>
              <h3>Tài liệu tổ chức hoạt động trải nghiệm</h3>
              <p>Gợi ý cách khai thác học liệu số trong quá trình tổ chức bài học.</p>
              <Link to="/dang-nhap" className="lp-pc-btn">Xem tài liệu <ArrowRight size={16} /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Cách sử dụng */}
      <section className="lp-how-to">
        <div className="lp-container">
          <div className="lp-section-header center lp-reveal lp-fade-up">
            <h2>Bắt đầu hành trình khám phá chỉ với ba bước</h2>
          </div>
          <div className="lp-steps">
            <div className="lp-step lp-reveal lp-fade-up" style={{ transitionDelay: '100ms' }}>
              <div className="lp-step-num">01</div>
              <h3>Đăng nhập hệ thống</h3>
              <p>Sử dụng tài khoản học sinh hoặc giáo viên để truy cập đầy đủ các nội dung phù hợp.</p>
            </div>
            <div className="lp-step lp-reveal lp-fade-up" style={{ transitionDelay: '200ms' }}>
              <div className="lp-step-num">02</div>
              <h3>Lựa chọn học liệu</h3>
              <p>Tìm kiếm và lựa chọn sách, video, trò chơi hoặc tài liệu theo nhu cầu.</p>
            </div>
            <div className="lp-step lp-reveal lp-fade-up" style={{ transitionDelay: '300ms' }}>
              <div className="lp-step-num">03</div>
              <h3>Học tập và phản hồi</h3>
              <p>Trải nghiệm nội dung, đặt câu hỏi, để lại bình luận và chia sẻ cảm nhận sau khi học.</p>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '40px' }} className="lp-reveal lp-fade-up">
            <Link to="/dang-nhap" className="button button-primary lp-btn-large">Bắt đầu ngay <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>

      {/* 9. Đối tượng sử dụng */}
      <section className="lp-audience">
        <div className="lp-container">
          <div className="lp-section-header center lp-reveal lp-fade-up">
            <span className="lp-kicker">Kho học liệu dành cho ai?</span>
            <h2>Đối tượng sử dụng</h2>
          </div>
          <div className="lp-audience-grid">
            <div className="lp-audience-card lp-reveal lp-fade-up" style={{ transitionDelay: '100ms' }}>
              <div className="lp-audience-icon"><User size={32} /></div>
              <h3>Học sinh</h3>
              <p>Chủ động tìm hiểu văn học dân gian qua các hình thức trực quan, sinh động và dễ tiếp cận.</p>
            </div>
            <div className="lp-audience-card lp-reveal lp-fade-up" style={{ transitionDelay: '200ms' }}>
              <div className="lp-audience-icon"><FileText size={32} /></div>
              <h3>Giáo viên</h3>
              <p>Khai thác học liệu số, giáo án và tài liệu tham khảo để hỗ trợ thiết kế bài giảng.</p>
            </div>
            <div className="lp-audience-card lp-reveal lp-fade-up" style={{ transitionDelay: '300ms' }}>
              <div className="lp-audience-icon"><Globe size={32} /></div>
              <h3>Người yêu văn hóa địa phương</h3>
              <p>Khám phá thêm những câu chuyện, giá trị văn học và nét đẹp văn hóa của Thái Nguyên.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Phần bình luận và kết nối */}
      <section className="lp-community">
        <div className="lp-container lp-community-inner">
          <div className="lp-community-text lp-reveal lp-fade-right">
            <h2>Chia sẻ cảm nhận sau mỗi trải nghiệm</h2>
            <p>
              Mỗi học liệu đều có khu vực bình luận và đặt câu hỏi. Học sinh và giáo viên có thể trao đổi, phản hồi hoặc chia sẻ góc nhìn của mình về nội dung vừa khám phá.
            </p>
            <p>
              Thông qua những cuộc trao đổi này, việc học văn không chỉ dừng lại ở tiếp nhận kiến thức mà còn trở thành quá trình kết nối, suy ngẫm và sáng tạo.
            </p>
          </div>
          <div className="lp-community-visual lp-reveal lp-fade-left">
            <div className="lp-chat-bubble">
              <strong>Học sinh A</strong>
              <span>Trò chơi này giúp em nhớ tên các nhân vật trong truyền thuyết rất dễ dàng!</span>
            </div>
            <div className="lp-chat-bubble right">
              <strong>Giáo viên B</strong>
              <span>Rất tuyệt vời, cô cũng sẽ dùng trò chơi này cho tiết ôn tập tuần tới.</span>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Lời kêu gọi cuối trang */}
      <section className="lp-cta lp-reveal lp-fade-up">
        <div className="lp-container lp-cta-inner">
          <h2>Sẵn sàng khám phá văn học dân gian Thái Nguyên theo một cách mới?</h2>
          <p>
            Bắt đầu hành trình tìm hiểu những giá trị văn học và văn hóa địa phương qua kho học liệu số sinh động, trực quan và được hỗ trợ bởi AI.
          </p>
          <div className="lp-cta-actions">
            <Link to="/dang-nhap" className="button button-primary lp-btn-large">Khám phá kho học liệu</Link>
            <Link to="/dang-nhap" className="button button-secondary lp-btn-large lp-btn-outline">Đăng nhập hệ thống</Link>
          </div>
        </div>
      </section>

      {/* 12. Nội dung chân trang */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-footer-brand">
            <strong>Học liệu số Văn học Thái Nguyên</strong>
            <p>Không gian học tập và trải nghiệm văn học dân gian địa phương trên nền tảng số.</p>
            <span className="lp-slogan">Giữ gìn giá trị truyền thống – Khơi mở trải nghiệm số.</span>
          </div>
          <div className="lp-footer-links">
            <div>
              <h4>Liên kết nhanh</h4>
              <a href="#" onClick={(e) => scrollToSection(e, 'hero')}>Trang chủ</a>
              <a href="#gioi-thieu" onClick={(e) => scrollToSection(e, 'gioi-thieu')}>Giới thiệu</a>
              <a href="#danh-muc" onClick={(e) => scrollToSection(e, 'danh-muc')}>Kho học liệu</a>
              <Link to="/dang-nhap">Tài liệu giáo viên</Link>
              <Link to="/dang-nhap">Hướng dẫn sử dụng</Link>
              <Link to="/dang-nhap">Liên hệ</Link>
            </div>
            <div>
              <h4>Chính sách</h4>
              <Link to="/dang-nhap">Điều khoản sử dụng</Link>
              <Link to="/dang-nhap">Chính sách bảo mật</Link>
              <Link to="/dang-nhap">Quy định bình luận</Link>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <div className="lp-container">
            © 2026 Học liệu số Văn học Thái Nguyên. Nội dung được xây dựng phục vụ mục đích giáo dục và nghiên cứu.
          </div>
        </div>
      </footer>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--success)', marginRight: '8px', flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
