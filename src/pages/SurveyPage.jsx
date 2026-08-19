import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import SurveyForm from '../components/SurveyForm.jsx';
import { PageLoader } from '../components/Common.jsx';
import { apiRequest } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  SURVEY_COPY,
  surveyAudienceFromRole,
  surveysMePath
} from '../constants/surveyAudience.js';

export default function SurveyPage() {
  const { token, user } = useAuth();
  const audience = useMemo(() => surveyAudienceFromRole(user?.role), [user?.role]);
  const copy = SURVEY_COPY[audience];

  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!token) {
        if (!cancelled) setChecking(false);
        return;
      }
      try {
        const res = await apiRequest(surveysMePath(audience), { token });
        if (!cancelled && res.data) setSuccess(true);
      } catch {
        try {
          const res = await apiRequest('/surveys/me', { token });
          if (!cancelled && res.data) setSuccess(true);
        } catch {
          // vẫn cho điền form
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [token, audience]);

  if (checking) return <PageLoader label="Đang kiểm tra phiếu khảo sát..." />;

  if (success) {
    return (
      <div className="page standalone-state">
        <span className="success-orb"><CheckCircle2 size={48} color="#29765c" /></span>
        <h1>{copy.thankYouTitle}</h1>
        <p>{copy.thankYouBody}</p>
        <Link className="button button-primary" to="/">Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="page survey-page">
      <div className="survey-container">
        <div className="survey-header">
          <div className="survey-kicker"><ClipboardList size={20} /> {copy.kicker}</div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>

        <SurveyForm onSuccess={() => setSuccess(true)} />
      </div>
    </div>
  );
}
