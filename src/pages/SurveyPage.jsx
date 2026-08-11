import { useState } from 'react';
import { ClipboardList, CheckCircle2, LoaderCircle, Sparkles } from 'lucide-react';
import { apiRequest } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';

const surveyQuestions = [
  { id: 'q1', text: 'Nội dung học liệu chính xác và dễ hiểu.', section: 'I. CHẤT LƯỢNG NỘI DUNG CỦA HỌC LIỆU SỐ' },
  { id: 'q2', text: 'Nội dung phù hợp với bài học trong tài liệu GDĐP lớp 6.', section: 'I. CHẤT LƯỢNG NỘI DUNG CỦA HỌC LIỆU SỐ' },
  { id: 'q3', text: 'Kiến thức được trình bày logic, khoa học.', section: 'I. CHẤT LƯỢNG NỘI DUNG CỦA HỌC LIỆU SỐ' },
  { id: 'q4', text: 'Học liệu giúp em hiểu rõ hơn về văn học dân gian Thái Nguyên.', section: 'I. CHẤT LƯỢNG NỘI DUNG CỦA HỌC LIỆU SỐ' },
  { id: 'q5', text: 'Nội dung học liệu phù hợp với khả năng của em.', section: 'I. CHẤT LƯỢNG NỘI DUNG CỦA HỌC LIỆU SỐ' },

  { id: 'q6', text: 'Các hoạt động học tập được sắp xếp hợp lí.', section: 'II. THIẾT KẾ SƯ PHẠM' },
  { id: 'q7', text: 'Em dễ dàng theo dõi tiến trình bài học.', section: 'II. THIẾT KẾ SƯ PHẠM' },
  { id: 'q8', text: 'Các nhiệm vụ học tập rõ ràng.', section: 'II. THIẾT KẾ SƯ PHẠM' },
  { id: 'q9', text: 'Học liệu tạo điều kiện để em chủ động học tập.', section: 'II. THIẾT KẾ SƯ PHẠM' },

  { id: 'q11', text: 'Giao diện học liệu đẹp và hấp dẫn.', section: 'III. GIAO DIỆN VÀ KHẢ NĂNG SỬ DỤNG' },
  { id: 'q12', text: 'Các chức năng dễ sử dụng.', section: 'III. GIAO DIỆN VÀ KHẢ NĂNG SỬ DỤNG' },
  { id: 'q13', text: 'Em dễ dàng tìm được nội dung cần học.', section: 'III. GIAO DIỆN VÀ KHẢ NĂNG SỬ DỤNG' },
  { id: 'q14', text: 'Học liệu hoạt động ổn định khi sử dụng.', section: 'III. GIAO DIỆN VÀ KHẢ NĂNG SỬ DỤNG' },
  { id: 'q15', text: 'Em có thể sử dụng học liệu trên nhiều thiết bị.', section: 'III. GIAO DIỆN VÀ KHẢ NĂNG SỬ DỤNG' },

  { id: 'q21', text: 'Em được tham gia nhiều hoạt động học tập.', section: 'IV. TÍNH TƯƠNG TÁC' },
  { id: 'q22', text: 'Trò chơi giúp em ôn luyện kiến thức hiệu quả.', section: 'IV. TÍNH TƯƠNG TÁC' },
  { id: 'q23', text: 'Chatbot AI hỗ trợ em khi gặp khó khăn.', section: 'IV. TÍNH TƯƠNG TÁC' },
  { id: 'q24', text: 'Em nhận được phản hồi sau khi làm bài tập.', section: 'IV. TÍNH TƯƠNG TÁC' },

  { id: 'q26', text: 'Học liệu giúp em ghi nhớ kiến thức lâu hơn.', section: 'V. HIỆU QUẢ HỌC TẬP' },
  { id: 'q27', text: 'Em hiểu rõ hơn nội dung các truyện dân gian.', section: 'V. HIỆU QUẢ HỌC TẬP' },
  { id: 'q28', text: 'Em biết thêm nhiều kiến thức về văn hóa Thái Nguyên.', section: 'V. HIỆU QUẢ HỌC TẬP' },
  { id: 'q29', text: 'Em dễ dàng hoàn thành các bài tập sau bài học.', section: 'V. HIỆU QUẢ HỌC TẬP' },
  { id: 'q30', text: 'Kết quả học tập của em được cải thiện khi sử dụng học liệu.', section: 'V. HIỆU QUẢ HỌC TẬP' },

  { id: 'q36', text: 'Em cảm thấy hứng thú khi học bằng học liệu số.', section: 'VI. MỨC ĐỘ HỨNG THÚ' },
  { id: 'q37', text: 'Em mong muốn tiếp tục học bằng các học liệu số.', section: 'VI. MỨC ĐỘ HỨNG THÚ' },
  { id: 'q38', text: 'Học liệu giúp việc học văn học dân gian trở nên thú vị hơn.', section: 'VI. MỨC ĐỘ HỨNG THÚ' },
];

const productEvaluations = [
  { id: 'prod_video', text: 'Video tương tác' },
  { id: 'prod_comic', text: 'Truyện tranh số / Sách tương tác' },
  { id: 'prod_game', text: 'Trò chơi tương tác' },
  { id: 'prod_map', text: 'Sơ đồ' },
];

export default function SurveyPage() {
  const { token } = useAuth();
  
  const [form, setForm] = useState({
    schoolClass: '',
    gender: '',
    ratings: {},
    productRatings: {},
    feedback: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Group questions by section
  const sections = [];
  surveyQuestions.forEach(q => {
    let section = sections.find(s => s.title === q.section);
    if (!section) {
      section = { title: q.section, questions: [] };
      sections.push(section);
    }
    section.questions.push(q);
  });

  const handleRatingChange = (qId, value) => {
    setForm(prev => ({
      ...prev,
      ratings: { ...prev.ratings, [qId]: value }
    }));
  };

  const handleProductRatingChange = (pId, value) => {
    setForm(prev => ({
      ...prev,
      productRatings: { ...prev.productRatings, [pId]: value }
    }));
  };

  const submitSurvey = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!form.schoolClass || !form.gender) {
      setError('Vui lòng điền đầy đủ thông tin chung (Lớp và Giới tính).');
      window.scrollTo(0, 0);
      return;
    }
    
    // Check if all questions are answered
    for (const q of surveyQuestions) {
      if (!form.ratings[q.id]) {
        setError('Vui lòng đánh giá tất cả các tiêu chí từ 1 đến 5.');
        return;
      }
    }
    for (const p of productEvaluations) {
      if (!form.productRatings[p.id]) {
        setError('Vui lòng đánh giá mức độ hữu ích của tất cả sản phẩm.');
        return;
      }
    }

    setLoading(true);
    try {
      await apiRequest('/surveys', {
        method: 'POST',
        token,
        body: form
      });
      setSuccess(true);
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra khi gửi khảo sát.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page standalone-state">
        <span className="success-orb"><CheckCircle2 size={48} color="#29765c" /></span>
        <h1>Cảm ơn em!</h1>
        <p>Phiếu khảo sát của em đã được gửi thành công. Những ý kiến đóng góp này rất quan trọng để chúng tôi tiếp tục cải thiện hệ thống học liệu.</p>
        <Link className="button button-primary" to="/">Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="page survey-page">
      <div className="survey-container">
        <div className="survey-header">
          <div className="survey-kicker"><ClipboardList size={20} /> PHIẾU KHẢO SÁT HỌC SINH</div>
          <h1>Đánh giá chất lượng bộ học liệu số ứng dụng AI</h1>
          <p>Dành cho học sinh lớp 6 sau khi học Chủ đề 02: Văn học dân gian Thái Nguyên</p>
        </div>

        {error && <div className="form-error survey-error">{error}</div>}

        <form onSubmit={submitSurvey} className="survey-form">
          
          <div className="survey-instructions">
            <strong>Hướng dẫn:</strong> Các em hãy đánh dấu vào một mức độ phù hợp nhất.
            <div className="rating-legend">
              <div className="legend-item"><span>1</span> Hoàn toàn không đồng ý</div>
              <div className="legend-item"><span>2</span> Không đồng ý</div>
              <div className="legend-item"><span>3</span> Phân vân</div>
              <div className="legend-item"><span>4</span> Đồng ý</div>
              <div className="legend-item"><span>5</span> Hoàn toàn đồng ý</div>
            </div>
          </div>

          <section className="survey-section">
            <h2>I. Thông tin chung</h2>
            <div className="general-info-grid">
              <label>
                Lớp:
                <input 
                  type="text" 
                  value={form.schoolClass} 
                  onChange={e => setForm({...form, schoolClass: e.target.value})} 
                  placeholder="VD: 6A1" 
                  maxLength={20}
                  required
                />
              </label>
              <div className="gender-select">
                <span>Giới tính:</span>
                <div className="gender-options">
                  <label><input type="radio" name="gender" value="Nam" onChange={e => setForm({...form, gender: e.target.value})} required /> Nam</label>
                  <label><input type="radio" name="gender" value="Nữ" onChange={e => setForm({...form, gender: e.target.value})} required /> Nữ</label>
                </div>
              </div>
            </div>
          </section>

          <div className="survey-questions-wrap">
            <div className="survey-table-header">
              <div className="th-content">Nội dung đánh giá</div>
              <div className="th-ratings">
                <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
              </div>
            </div>
            
            {sections.map((section, sIndex) => (
              <section key={sIndex} className="survey-section-group">
                <h3>{section.title}</h3>
                {section.questions.map((q) => (
                  <div key={q.id} className="survey-question-row">
                    <div className="question-text">
                      <span className="q-num">{q.id.replace('q', '')}</span>
                      <span className="q-content">{q.text}</span>
                    </div>
                    <div className="question-ratings">
                      {[1, 2, 3, 4, 5].map(val => (
                        <label key={val} className="rating-radio" title={'Mức ' + val}>
                          <input 
                            type="radio" 
                            name={q.id} 
                            value={val} 
                            checked={form.ratings[q.id] === val}
                            onChange={() => handleRatingChange(q.id, val)}
                            required
                          />
                          <span className="radio-custom"></span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>

          <section className="survey-section survey-products">
            <h2>VII. Đánh giá từng sản phẩm</h2>
            <p className="section-desc">Đánh giá mức độ hữu ích của từng học liệu.</p>
            
            <div className="survey-table-header products-header">
              <div className="th-content">Sản phẩm</div>
              <div className="th-ratings products-ratings-labels">
                <span>Rất không hữu ích</span>
                <span>Không hữu ích</span>
                <span>Bình thường</span>
                <span>Hữu ích</span>
                <span>Rất hữu ích</span>
              </div>
            </div>
            
            {productEvaluations.map((p) => (
              <div key={p.id} className="survey-question-row">
                <div className="question-text">
                  <span className="q-content">{p.text}</span>
                </div>
                <div className="question-ratings">
                  {[1, 2, 3, 4, 5].map(val => (
                    <label key={val} className="rating-radio" title={'Mức ' + val}>
                      <input 
                        type="radio" 
                        name={p.id} 
                        value={val} 
                        checked={form.productRatings[p.id] === val}
                        onChange={() => handleProductRatingChange(p.id, val)}
                        required
                      />
                      <span className="radio-custom"></span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="survey-section">
            <label className="open-question">
              <strong>Câu 1. Theo em, bộ học liệu cần bổ sung hoặc cải thiện điều gì?</strong>
              <textarea 
                value={form.feedback} 
                onChange={e => setForm({...form, feedback: e.target.value})} 
                rows={4}
                placeholder="Nhập ý kiến của em..."
              />
            </label>
          </section>

          <div className="survey-footer">
            <button type="submit" className="button button-primary button-large" disabled={loading}>
              {loading ? <LoaderCircle className="spin" size={20} /> : <Sparkles size={20} />} 
              Gửi phiếu đánh giá
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
