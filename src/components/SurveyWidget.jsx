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
      <div className="survey-toolbox" onClick={() => setIsOpen(true)}>
        <div className="toolbox-icon">
          <ClipboardList size={28} />
        </div>
        <div className="toolbox-content">
          <strong>Đánh giá học liệu</strong>
          <span>Dành 1 phút góp ý để nhận quà nhé!</span>
        </div>
        <button className="toolbox-button">Bắt đầu</button>
      </div>

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
