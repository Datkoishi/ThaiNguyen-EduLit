import { useEffect, useState } from 'react';
import { ClipboardList, X } from 'lucide-react';
import SurveyForm from './SurveyForm.jsx';
import { apiRequest } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function SurveyWidget() {
  const { user, token } = useAuth();
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
        const res = await apiRequest('/surveys/me', { token });
        if (!cancelled) setAlreadyDone(Boolean(res.data));
      } catch {
        // Fallback: nếu API lỗi, vẫn cho hiện widget (user có thể bị 409 khi submit)
        if (!cancelled) setAlreadyDone(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [user, token]);

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
          <strong>Đánh giá học liệu</strong>
          <span>Dành 1 phút góp ý để nhận quà nhé!</span>
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
              <div className="survey-kicker"><ClipboardList size={20} /> PHIẾU KHẢO SÁT HỌC SINH</div>
              <h1>Đánh giá chất lượng bộ học liệu số</h1>
            </div>
            <SurveyForm onSuccess={handleSuccess} />
          </div>
        </div>
      )}
    </>
  );
}
