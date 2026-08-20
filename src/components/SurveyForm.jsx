import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { apiRequest } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageLoader } from './Common.jsx';
import {
  EMOJI_RATINGS,
  PRODUCT_EVALUATIONS,
  SURVEY_AUDIENCE,
  SURVEY_COPY,
  buildQuestionWizardSteps,
  buildSurveyRatings,
  filterQuestionsByAudience,
  surveyAudienceFromRole
} from '../constants/surveyAudience.js';

export default function SurveyForm({ onSuccess, onAudienceResolved }) {
  const { token, user } = useAuth();
  const audience = surveyAudienceFromRole(user?.role);
  const copy = SURVEY_COPY[audience];

  const [form, setForm] = useState({
    schoolClass: '',
    gender: '',
    ratings: {},
    productRatings: {}
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [surveyQuestions, setSurveyQuestions] = useState([]);
  const [initLoading, setInitLoading] = useState(true);
  const [initError, setInitError] = useState('');

  useEffect(() => {
    if (onAudienceResolved) onAudienceResolved(audience);
  }, [audience, onAudienceResolved]);

  useEffect(() => {
    let cancelled = false;
    const loadQuestions = async () => {
      setInitLoading(true);
      setInitError('');
      try {
        const res = await apiRequest('/survey-questions?audience=' + encodeURIComponent(audience), { token });
        if (!cancelled) setSurveyQuestions(filterQuestionsByAudience(res.data || [], audience));
      } catch (err) {
        if (!cancelled) setInitError(err.message || 'Không tải được câu hỏi khảo sát.');
      } finally {
        if (!cancelled) setInitLoading(false);
      }
    };
    if (token) loadQuestions();
    return () => { cancelled = true; };
  }, [token, audience]);

  const questionSteps = useMemo(
    () => buildQuestionWizardSteps(surveyQuestions),
    [surveyQuestions]
  );

  const steps = useMemo(() => [
    { type: 'info', title: 'Giới thiệu & thông tin' },
    ...questionSteps,
    ...(audience === SURVEY_AUDIENCE.STUDENT
      ? [{ type: 'products', title: 'Đánh giá từng sản phẩm' }]
      : [])
  ], [questionSteps, audience]);

  const handleProductRatingChange = (pId, value) => {
    setForm((prev) => ({
      ...prev,
      productRatings: { ...prev.productRatings, [pId]: value }
    }));
  };

  const handleRatingChange = (qId, value) => {
    setForm((prev) => ({
      ...prev,
      ratings: { ...prev.ratings, [qId]: value }
    }));
  };

  const toggleMultiChoice = (qId, option) => {
    setForm((prev) => {
      const current = Array.isArray(prev.ratings[qId]) ? prev.ratings[qId] : [];
      const next = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option];
      return { ...prev, ratings: { ...prev.ratings, [qId]: next } };
    });
  };

  const isRequired = (q) => q.required !== false;

  const isAnswered = (q, value) => {
    if (!isRequired(q)) return true;
    if (q.type === 'TEXT_SHORT') {
      return typeof value === 'string' && value.trim().length > 0;
    }
    if (q.type === 'SINGLE_CHOICE') return Boolean(value);
    if (q.type === 'MULTI_CHOICE') {
      return Array.isArray(value) && value.length > 0;
    }
    return Number(value) >= 1 && Number(value) <= 5;
  };

  const validateStep = () => {
    const step = steps[currentStep];
    if (step.type === 'info') {
      if (!form.schoolClass.trim()) {
        setError('Vui lòng điền ' + copy.classLabel.toLowerCase() + '.');
        return false;
      }
      if (copy.showGender && !form.gender) {
        setError('Vui lòng chọn giới tính.');
        return false;
      }
    } else if (step.type === 'questions') {
      for (const q of step.data.questions) {
        if (!isAnswered(q, form.ratings[q.id])) {
          setError('Vui lòng trả lời đầy đủ các câu bắt buộc.');
          return false;
        }
      }
    } else if (step.type === 'products') {
      for (const p of PRODUCT_EVALUATIONS) {
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
    if (validateStep()) setCurrentStep((s) => s + 1);
  };

  const prevStep = () => {
    setCurrentStep((s) => s - 1);
    setError('');
  };

  const submitSurvey = async () => {
    if (!validateStep()) return;

    setLoading(true);
    try {
      await apiRequest('/surveys', {
        method: 'POST',
        token,
        body: {
          targetAudience: audience,
          schoolClass: form.schoolClass.trim(),
          gender: copy.showGender ? form.gender : undefined,
          ratings: buildSurveyRatings(surveyQuestions, form.ratings),
          productRatings: audience === SURVEY_AUDIENCE.STUDENT ? form.productRatings : {}
        }
      });
      if (onSuccess) onSuccess(audience);
    } catch (err) {
      if (err.code === 'SURVEY_ALREADY_SUBMITTED') {
        setError(audience === 'TEACHER'
          ? 'Thầy/cô đã gửi phiếu khảo sát rồi.'
          : 'Bạn đã gửi phiếu khảo sát rồi.');
        if (onSuccess) onSuccess(audience);
      } else {
        setError(err.message || 'Đã có lỗi xảy ra khi gửi khảo sát.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) return <PageLoader label="Đang tải câu hỏi khảo sát..." />;
  if (initError) return <div className="form-error survey-error">{initError}</div>;
  if (!questionSteps.length) {
    return <div className="form-error survey-error">Hiện chưa có câu hỏi khảo sát cho nhóm này. Vui lòng thử lại sau.</div>;
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
            <div className="survey-intro-block">
              {copy.introLabel && <strong className="survey-intro-label">{copy.introLabel}</strong>}
              <p>{copy.intro}</p>
              <p className="survey-intro-reassurance"><strong>{copy.reassurance}</strong></p>
            </div>

            <div className="general-info-grid">
              <label className="wizard-input-group">
                {copy.classLabel}:
                <input
                  type="text"
                  value={form.schoolClass}
                  onChange={(e) => setForm({ ...form, schoolClass: e.target.value })}
                  placeholder={copy.classPlaceholder}
                  maxLength={40}
                />
              </label>
              {copy.showGender && (
                <div className="wizard-input-group">
                  <span>Giới tính:</span>
                  <div className="gender-options-wizard">
                    <label className={form.gender === 'Nam' ? 'active' : ''}>
                      <input type="radio" name="gender" value="Nam" onChange={(e) => setForm({ ...form, gender: e.target.value })} checked={form.gender === 'Nam'} />
                      Nam
                    </label>
                    <label className={form.gender === 'Nữ' ? 'active' : ''}>
                      <input type="radio" name="gender" value="Nữ" onChange={(e) => setForm({ ...form, gender: e.target.value })} checked={form.gender === 'Nữ'} />
                      Nữ
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStepData.type === 'questions' && (
          <div className="wizard-section">
            <div className="wizard-questions-list survey-question-stack">
              {currentStepData.data.questions.map((q) => (
                <div key={q.id} className="survey-question-card">
                  <div className="question-text">
                    <span className="q-content">{q.text}</span>
                    {!isRequired(q) && <small className="survey-optional-tag">Không bắt buộc</small>}
                  </div>

                  {q.type === 'RATING_1_5' && q.ratingStyle === 'EMOJI' && (
                    <div className="survey-emoji-ratings">
                      {EMOJI_RATINGS.map(({ value, emoji, label }) => (
                        <label
                          key={value}
                          className={'survey-emoji-option' + (form.ratings[q.id] === value ? ' is-selected' : '')}
                          title={label}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={value}
                            checked={form.ratings[q.id] === value}
                            onChange={() => handleRatingChange(q.id, value)}
                          />
                          <span className="survey-emoji-icon">{emoji}</span>
                          <span className="survey-emoji-label">{label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'RATING_1_5' && q.ratingStyle !== 'EMOJI' && (
                    <div className="question-ratings survey-number-ratings">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <label key={val} className="rating-radio">
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
                    <div className="survey-choice-list">
                      {q.options.map((opt, idx) => (
                        <label key={idx} className="survey-choice-row">
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

                  {q.type === 'MULTI_CHOICE' && q.options && (
                    <div className="survey-choice-list">
                      {q.options.map((opt, idx) => {
                        const selected = Array.isArray(form.ratings[q.id]) && form.ratings[q.id].includes(opt);
                        return (
                          <label key={idx} className={'survey-choice-row' + (selected ? ' is-selected' : '')}>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleMultiChoice(q.id, opt)}
                            />
                            {opt}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'TEXT_SHORT' && (
                    <textarea
                      value={form.ratings[q.id] || ''}
                      onChange={(e) => handleRatingChange(q.id, e.target.value)}
                      placeholder="Nhập câu trả lời của bạn..."
                      rows={3}
                      className="survey-text-answer"
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
              {PRODUCT_EVALUATIONS.map((p) => (
                <div key={p.id} className="survey-question-row">
                  <div className="question-text">
                    <span className="q-content">{p.text}</span>
                  </div>
                  <div className="question-ratings">
                    {[1, 2, 3, 4, 5].map((val) => (
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
              Gửi phiếu khảo sát
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
