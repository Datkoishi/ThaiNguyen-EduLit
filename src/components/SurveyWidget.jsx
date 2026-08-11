import { useState, useEffect } from 'react';
import { ClipboardList, X } from 'lucide-react';
import SurveyForm from './SurveyForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function SurveyWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  if (!user || (user.role !== 'STUDENT' && user.role !== 'TEACHER')) return null;

  const isDone = localStorage.getItem(`survey_done_${user.id}`);
  if (isDone) return null;

  const handleSuccess = () => {
    localStorage.setItem(`survey_done_${user.id}`, 'true');
    setIsOpen(false);
    setForceUpdate(v => v + 1); // trigger re-render to hide
  };

  return (
    <>
      <button 
        className="survey-fab" 
        onClick={() => setIsOpen(true)}
        aria-label="Làm khảo sát"
        title="Làm khảo sát đánh giá học liệu"
      >
        <span className="survey-fab-icon"><ClipboardList size={24} /></span>
        <span className="survey-fab-text">Đánh giá học liệu</span>
      </button>

      {isOpen && (
        <div className="survey-modal-overlay">
          <div className="survey-modal-content">
            <button 
              className="survey-modal-close" 
              onClick={() => setIsOpen(false)}
              aria-label="Đóng khảo sát"
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
