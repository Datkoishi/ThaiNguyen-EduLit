import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, X } from 'lucide-react';
import SurveyForm from './SurveyForm.jsx';
import { apiRequest } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  SURVEY_COPY,
  surveyAudienceFromRole,
  surveysMePath
} from '../constants/surveyAudience.js';

export default function SurveyWidget() {
  const { user, token } = useAuth();
  const audience = useMemo(() => surveyAudienceFromRole(user?.role), [user?.role]);
  const copy = SURVEY_COPY[audience];

  const [isOpen, setIsOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!user || !token || (user.role !== 'STUDENT' && user.role !== 'TEACHER')) {
        if (!cancelled) {
          setAlreadyDone(true);
          setChecking(false);
        }
        return;
      }
      setChecking(true);
      try {
        const res = await apiRequest(surveysMePath(audience), { token });
        if (!cancelled) setAlreadyDone(Boolean(res.data));
      } catch {
        if (!cancelled) setAlreadyDone(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [user, token, audience]);

  if (checking || alreadyDone || !user || (user.role !== 'STUDENT' && user.role !== 'TEACHER')) {
    return null;
  }

  const handleSuccess = () => {
    setAlreadyDone(true);
    setIsOpen(false);
  };

  return (
    <>
      <div className="survey-toolbox" onClick={() => setIsOpen(true)}>
        <div className="toolbox-icon">
          <ClipboardList size={28} />
        </div>
        <div className="toolbox-content">
          <strong>{copy.widgetTitle}</strong>
          <span>{copy.widgetSubtitle}</span>
        </div>
        <button className="toolbox-button" type="button">Bắt đầu</button>
      </div>

      {isOpen && (
        <div className="survey-modal-overlay">
          <div className="survey-modal-content">
            <button
              className="survey-modal-close"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng khảo sát"
              type="button"
            >
              <X size={24} />
            </button>
            <div className="survey-header">
              <div className="survey-kicker"><ClipboardList size={20} /> {copy.kicker}</div>
              <h1>{copy.title}</h1>
              <p>{copy.subtitle}</p>
            </div>
            <SurveyForm onSuccess={handleSuccess} />
          </div>
        </div>
      )}
    </>
  );
}
