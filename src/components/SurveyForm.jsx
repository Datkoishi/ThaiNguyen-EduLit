import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { apiRequest } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageLoader } from './Common.jsx';
import {
  EMOJI_RATINGS,
  SURVEY_COPY,
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
    feedback: ''
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
        const res = await apiRequest('/survey-questions?audience=' + audience, { token });
        const filtered = filterQuestionsByAudience(res.data || [], audience);
        if (!cancelled) setSurveyQuestions(filtered);
      } catch {
        try {
          const res = await apiRequest('/survey-questions', { token });
          const filtered = filterQuestionsByAudience(res.data || [], audience);
          if (!cancelled) setSurveyQuestions(filtered);
        } catch (err) {
          if (!cancelled) setInitError(err.message || 'Không tải được câu hỏi khảo sát.');
        }
      } finally {
        if (!cancelled) setInitLoading(false);
      }
    };
    if (token) loadQuestions();
    return () => { cancelled = true; };
  }, [token, audience]);

  const sections = useMemo(() => {
    const list = [];
    surveyQuestions.forEach((q) => {
      let section = list.find((s) => s.title === q.section);
      if (!section) {
        section = { title: q.section || 'Câu hỏi', questions: [] };
        list.push(section);
      }
      section.questions.push(q);
    });
    return list;
  }, [surveyQuestions]);

  const steps = useMemo(() => [
    { type: 'info', title: 'Giới thiệu & thông tin' },
    ...sections.map((s) => ({ type: 'questions', title: s.title, data: s }))
  ], [sections]);

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
          ratings: form.ratings,
          productRatings: {},
          feedback: form.feedback || ''
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
  if (!surveyQuestions.length) {
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
