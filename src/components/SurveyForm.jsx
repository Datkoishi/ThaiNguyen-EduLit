import { useEffect, useState } from 'react';
import { LoaderCircle, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { apiRequest } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageLoader } from './Common.jsx';

const productEvaluations = [
  { id: 'prod_video', text: 'Video tương tác' },
  { id: 'prod_comic', text: 'Truyện tranh số / Sách tương tác' },
  { id: 'prod_game', text: 'Trò chơi tương tác' },
  { id: 'prod_simulation', text: 'Sơ đồ / Mô phỏng' },
];

export default function SurveyForm({ onSuccess }) {
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
  const [currentStep, setCurrentStep] = useState(0);
  const [surveyQuestions, setSurveyQuestions] = useState([]);
  const [initLoading, setInitLoading] = useState(true);
  const [initError, setInitError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadQuestions = async () => {
      setInitLoading(true);
      setInitError('');
      try {
        const res = await apiRequest('/survey-questions', { token });
        if (!cancelled) setSurveyQuestions(res.data || []);
      } catch (err) {
        if (!cancelled) setInitError(err.message || 'Không tải được câu hỏi khảo sát.');
      } finally {
        if (!cancelled) setInitLoading(false);
      }
    };
    if (token) loadQuestions();
    return () => { cancelled = true; };
  }, [token]);

  const sections = [];
  surveyQuestions.forEach(q => {
    let section = sections.find(s => s.title === q.section);
    if (!section) {
      section = { title: q.section, questions: [] };
      sections.push(section);
    }
    section.questions.push(q);
  });

  const steps = [
    { type: 'info', title: 'Thông tin chung' },
    ...sections.map(s => ({ type: 'questions', title: s.title, data: s })),
    { type: 'products', title: 'VII. Đánh giá từng sản phẩm' },
    { type: 'feedback', title: 'VIII. Ý kiến đóng góp' }
  ];

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

  const isAnswered = (q, value) => {
    if (q.type === 'TEXT_SHORT') return typeof value === 'string' && value.trim().length > 0;
    if (q.type === 'SINGLE_CHOICE') return Boolean(value);
    return value >= 1 && value <= 5;
  };

  const validateStep = () => {
    const step = steps[currentStep];
    if (step.type === 'info') {
      if (!form.schoolClass || !form.gender) {
        setError('Vui lòng điền đầy đủ Lớp và Giới tính.');
        return false;
      }
    } else if (step.type === 'questions') {
      for (const q of step.data.questions) {
        if (!isAnswered(q, form.ratings[q.id])) {
          setError('Vui lòng đánh giá tất cả các tiêu chí.');
          return false;
        }
      }
    } else if (step.type === 'products') {
      for (const p of productEvaluations) {
        if (!form.productRatings[p.id]) {
          setError('Vui lòng đánh giá mức độ hữu ích của tất cả sản phẩm.');
          return false;
        }
      }
    }
    setError('');
    return true;
  };

  const nextStep = () => {
    if (validateStep()) setCurrentStep(s => s + 1);
  };

  const prevStep = () => {
    setCurrentStep(s => s - 1);
    setError('');
  };

  const submitSurvey = async () => {
    if (!validateStep()) return;

    setLoading(true);
    try {
      await apiRequest('/surveys', {
        method: 'POST',
        token,
        body: form
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.code === 'SURVEY_ALREADY_SUBMITTED') {
        setError('Bạn đã gửi phiếu khảo sát rồi.');
        if (onSuccess) onSuccess();
      } else {
        setError(err.message || 'Đã có lỗi xảy ra khi gửi khảo sát.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) return <PageLoader label="Đang tải câu hỏi khảo sát..." />;
  if (initError) return <div className="form-error survey-error">{initError}</div>;
  if (!surveyQuestions.length) {
    return <div className="form-error survey-error">Hiện chưa có câu hỏi khảo sát. Vui lòng thử lại sau.</div>;
  }

  const currentStepData = steps[currentStep];

  return (
    <div className="survey-wizard-container">
      <div className="wizard-progress-bar">
        <div
          className="wizard-progress-fill"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
      <div className="wizard-progress-text">Bước {currentStep + 1} / {steps.length}: {currentStepData.title}</div>

      {error && <div className="form-error survey-error">{error}</div>}

      <div className="wizard-step-content animation-fade-in" key={currentStep}>
        {currentStepData.type === 'info' && (
          <div className="wizard-section">
            <div className="survey-instructions">
              <strong>Hướng dẫn:</strong> Các em hãy đánh giá trung thực mức độ phù hợp nhất.
              <div className="rating-legend">
                <div className="legend-item"><span>1</span> Hoàn toàn không đồng ý</div>
                <div className="legend-item"><span>2</span> Không đồng ý</div>
                <div className="legend-item"><span>3</span> Phân vân</div>
                <div className="legend-item"><span>4</span> Đồng ý</div>
                <div className="legend-item"><span>5</span> Hoàn toàn đồng ý</div>
              </div>
            </div>

            <div className="general-info-grid">
              <label className="wizard-input-group">
                Lớp học của em:
                <input
                  type="text"
                  value={form.schoolClass}
                  onChange={e => setForm({ ...form, schoolClass: e.target.value })}
                  placeholder="VD: 6A1"
                  maxLength={20}
                />
              </label>
              <div className="wizard-input-group">
                <span>Giới tính:</span>
                <div className="gender-options-wizard">
                  <label className={form.gender === 'Nam' ? 'active' : ''}>
                    <input type="radio" name="gender" value="Nam" onChange={e => setForm({ ...form, gender: e.target.value })} checked={form.gender === 'Nam'} />
                    Nam
                  </label>
                  <label className={form.gender === 'Nữ' ? 'active' : ''}>
                    <input type="radio" name="gender" value="Nữ" onChange={e => setForm({ ...form, gender: e.target.value })} checked={form.gender === 'Nữ'} />
                    Nữ
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStepData.type === 'questions' && (
          <div className="wizard-section">
            <div className="wizard-questions-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {currentStepData.data.questions.map((q) => (
                <div key={q.id} className="survey-question-card" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div className="question-text" style={{ fontWeight: 600, marginBottom: '12px' }}>
                    <span className="q-content">{q.text}</span>
                  </div>

                  {q.type === 'RATING_1_5' && (
                    <div className="question-ratings" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {[1, 2, 3, 4, 5].map(val => (
                        <label key={val} className="rating-radio" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name={q.id}
                            value={val}
                            checked={form.ratings[q.id] === val}
                            onChange={() => handleRatingChange(q.id, val)}
                          />
                          Mức {val}
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'SINGLE_CHOICE' && q.options && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {q.options.map((opt, idx) => (
                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name={q.id}
                            value={opt}
                            checked={form.ratings[q.id] === opt}
                            onChange={() => handleRatingChange(q.id, opt)}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'TEXT_SHORT' && (
                    <input
                      type="text"
                      value={form.ratings[q.id] || ''}
                      onChange={e => handleRatingChange(q.id, e.target.value)}
                      placeholder="Nhập câu trả lời của em..."
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStepData.type === 'products' && (
          <div className="wizard-section survey-products">
            <p className="section-desc">Đánh giá mức độ hữu ích của từng loại học liệu.</p>
            <div className="wizard-table-header products-header">
              <div className="th-content">Loại học liệu</div>
              <div className="th-ratings products-ratings-labels">
                <span>Rất không hữu ích</span>
                <span>Không hữu ích</span>
                <span>Bình thường</span>
                <span>Hữu ích</span>
                <span>Rất hữu ích</span>
              </div>
            </div>
            <div className="wizard-questions-list">
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
                        />
                        <span className="radio-custom"></span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStepData.type === 'feedback' && (
          <div className="wizard-section">
            <label className="open-question">
              <strong>Theo em, bộ học liệu cần bổ sung hoặc cải thiện điều gì?</strong>
              <textarea
                value={form.feedback}
                onChange={e => setForm({ ...form, feedback: e.target.value })}
                rows={5}
                placeholder="Nhập ý kiến đóng góp của em (không bắt buộc)..."
              />
            </label>
          </div>
        )}
      </div>

      <div className="wizard-footer">
        <div className="wizard-footer-left">
          {currentStep > 0 && (
            <button type="button" className="button button-outline" onClick={prevStep}>
              <ChevronLeft size={20} /> Quay lại
            </button>
          )}
        </div>
        <div className="wizard-footer-right">
          {currentStep < steps.length - 1 ? (
            <button type="button" className="button button-primary" onClick={nextStep}>
              Tiếp tục <ChevronRight size={20} />
            </button>
          ) : (
            <button type="button" className="button button-primary button-large pulse-btn" onClick={submitSurvey} disabled={loading}>
              {loading ? <LoaderCircle className="spin" size={20} /> : <Sparkles size={20} />}
              Hoàn tất & Gửi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
