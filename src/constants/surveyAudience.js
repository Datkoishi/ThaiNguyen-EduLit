export const SURVEY_AUDIENCE = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER'
};

export const SURVEY_KIND = {
  GROUP: 'GROUP',
  QUESTION: 'QUESTION'
};

export function surveyAudienceFromRole(role) {
  return role === 'TEACHER' ? SURVEY_AUDIENCE.TEACHER : SURVEY_AUDIENCE.STUDENT;
}

export const EMOJI_RATINGS = [
  { value: 1, emoji: '😡', label: 'Rất không hài lòng' },
  { value: 2, emoji: '🙁', label: 'Không hài lòng' },
  { value: 3, emoji: '😐', label: 'Bình thường' },
  { value: 4, emoji: '🙂', label: 'Hài lòng' },
  { value: 5, emoji: '😍', label: 'Rất hài lòng' }
];

export const SURVEY_COPY = {
  [SURVEY_AUDIENCE.STUDENT]: {
    kicker: 'PHIẾU KHẢO SÁT HỌC SINH',
    title: 'Đánh giá bộ học liệu số Văn học dân gian Thái Nguyên',
    subtitle: 'Dành cho học sinh sau khi trải nghiệm học liệu',
    intro:
      'Bộ học liệu số AI về Văn học dân gian Thái Nguyên là sản phẩm tâm huyết nhằm đưa văn hóa quê hương đến gần hơn với các em. Vì đang trong giai đoạn hoàn thiện, chúng em rất mong nhận được góp ý thẳng thắn, dù nhỏ nhất.',
    reassurance: 'Không có câu trả lời đúng hay sai — mọi ý kiến chê hay khen đều quý giá như nhau.',
    thankYouTitle: 'Cảm ơn em!',
    thankYouBody:
      'Phiếu khảo sát của em đã được gửi thành công. Những ý kiến đóng góp này rất quan trọng để chúng em tiếp tục cải thiện bộ học liệu.',
    widgetTitle: 'Đánh giá học liệu',
    widgetSubtitle: 'Dành 1 phút góp ý nhé!',
    classLabel: 'Lớp học của em',
    classPlaceholder: 'VD: 6A1',
    showGender: true
  },
  [SURVEY_AUDIENCE.TEACHER]: {
    kicker: 'PHIẾU KHẢO SÁT GIÁO VIÊN',
    title: 'Đánh giá chuyên môn bộ học liệu số',
    subtitle: 'Dành cho giáo viên đã trải nghiệm và sử dụng trên lớp',
    intro:
      'Bộ học liệu số AI về Văn học dân gian Thái Nguyên đang được hoàn thiện dựa trên góp ý thực tế của thầy cô. Chúng em rất trân trọng những nhận xét chuyên môn thẳng thắn để sản phẩm ngày càng phù hợp với lớp học.',
    reassurance: 'Không có câu trả lời đúng hay sai — mọi góp ý chuyên môn đều được ghi nhận nghiêm túc.',
    thankYouTitle: 'Cảm ơn thầy/cô!',
    thankYouBody:
      'Phiếu khảo sát đã được gửi thành công. Góp ý của thầy/cô sẽ giúp đội ngũ biên soạn cải thiện học liệu tốt hơn.',
    widgetTitle: 'Góp ý học liệu',
    widgetSubtitle: 'Chia sẻ trải nghiệm chuyên môn của thầy/cô',
    classLabel: 'Trường / Cơ sở dạy',
    classPlaceholder: 'VD: THCS Hoàng Văn Thụ',
    showGender: false
  }
};

export const PRODUCT_EVALUATIONS = [
  { id: 'prod_video', text: 'Video tương tác' },
  { id: 'prod_comic', text: 'Truyện tranh số / Sách tương tác' },
  { id: 'prod_game', text: 'Trò chơi tương tác' },
  { id: 'prod_simulation', text: 'Sơ đồ / Mô phỏng' }
];

export function normalizeSurveyQuestion(question = {}) {
  const inferredKind = question.kind
    || (question.type == null && Array.isArray(question.children) && question.children.length
      ? SURVEY_KIND.GROUP
      : SURVEY_KIND.QUESTION);

  return {
    ...question,
    kind: inferredKind,
    parentId: question.parentId ?? question.parent_id ?? null,
    targetAudience: question.targetAudience || question.target_audience || null,
    ratingStyle: question.ratingStyle || question.rating_style || 'NUMBER',
    isActive: question.isActive ?? question.is_active ?? true,
    required: question.required !== false,
    children: Array.isArray(question.children)
      ? question.children.map(normalizeSurveyQuestion)
      : []
  };
}

export function isSurveyGroup(question) {
  return question?.kind === SURVEY_KIND.GROUP;
}

export function isSurveyQuestion(question) {
  return !question?.kind || question.kind === SURVEY_KIND.QUESTION;
}

/** Flatten nested tree to answerable QUESTION nodes only (for submit + stats). */
export function flattenAnswerableQuestions(nodes = []) {
  const out = [];
  const walk = (list) => {
    (list || []).forEach((raw) => {
      const node = normalizeSurveyQuestion(raw);
      if (isSurveyGroup(node)) {
        walk(node.children);
        return;
      }
      if (isSurveyQuestion(node)) out.push(node);
    });
  };
  walk(nodes);
  return out;
}

export function filterQuestionsByAudience(questions, audience) {
  return (questions || [])
    .map(normalizeSurveyQuestion)
    .filter((q) => q.isActive !== false)
    .filter((q) => !q.targetAudience || q.targetAudience === audience)
    .map((q) => ({
      ...q,
      children: (q.children || [])
        .map(normalizeSurveyQuestion)
        .filter((child) => child.isActive !== false)
        .filter((child) => !child.targetAudience || child.targetAudience === audience)
    }));
}

/** Build wizard question steps: GROUP → one step; standalone QUESTION → bucket by section, preserve order. */
export function buildQuestionWizardSteps(nodes = []) {
  const steps = [];
  let pending = null;

  const flushPending = () => {
    if (pending?.questions.length) {
      steps.push({ type: 'questions', title: pending.title, data: pending });
    }
    pending = null;
  };

  (nodes || []).map(normalizeSurveyQuestion).forEach((node) => {
    if (node.isActive === false) return;

    if (isSurveyGroup(node)) {
      flushPending();
      const children = (node.children || []).filter((child) => isSurveyQuestion(child) && child.isActive !== false);
      if (children.length) {
        steps.push({
          type: 'questions',
          title: node.text || 'Nhóm câu hỏi',
          data: { title: node.text || 'Nhóm câu hỏi', questions: children, groupId: node.id }
        });
      }
      return;
    }

    if (!isSurveyQuestion(node)) return;
    const title = node.section || 'Câu hỏi';
    if (!pending || pending.title !== title) {
      flushPending();
      pending = { title, questions: [] };
    }
    pending.questions.push(node);
  });

  flushPending();
  return steps;
}

export function surveysMePath(audience) {
  return '/surveys/me?audience=' + encodeURIComponent(audience);
}

export function buildSurveyRatings(questions, ratings = {}) {
  const payload = {};
  flattenAnswerableQuestions(questions).forEach((q) => {
    const value = ratings[q.id];
    if (q.type === 'TEXT_SHORT') {
      if (typeof value === 'string' && value.trim()) payload[q.id] = value.trim();
      return;
    }
    if (Array.isArray(value)) {
      if (value.length) payload[q.id] = value;
      return;
    }
    if (value !== undefined && value !== null && value !== '') payload[q.id] = value;
  });
  return payload;
}
