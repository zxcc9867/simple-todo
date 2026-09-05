const CATEGORY_KEYWORDS = {
  work: [
    '회의', '미팅', '보고서', '발표', '프로젝트', '업무', '이메일', '메일',
    '출장', '결재', '기획', '고객', '클라이언트', '계약', '문서', 'ppt',
  ],
  personal: [
    '장보기', '병원', '약속', '가족', '생일', '청소', '빨래', '운동',
    '헬스', '쇼핑', '여행', '은행', '택배', '요리', '부모님', '친구',
  ],
  study: [
    '공부', '시험', '과제', '강의', '독서', '영어', '단어', '코딩',
    '스터디', '학원', '자격증', '논문', '복습', '예습', '수업', '토익',
  ],
}

// Returns the first category whose keyword appears in the title, or null if none match.
export function guessCategory(title) {
  const text = title.trim().toLowerCase()
  if (!text) return null

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category
    }
  }
  return null
}
