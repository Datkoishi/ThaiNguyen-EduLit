import { useState } from 'react';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import SurveyForm from '../components/SurveyForm.jsx';

export default function SurveyPage() {
  const [success, setSuccess] = useState(false);

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

        <SurveyForm onSuccess={() => setSuccess(true)} />
      </div>
    </div>
  );
}
