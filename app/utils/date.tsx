//해당 문자열이 YYYY-MM-DD 형식의 날짜를 나타내는 문자인지 확인합니다.
export function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  // 정규식에 맞는지 확인
  if (!regex.test(dateString)) {
    return false;
  }

  // 날짜 유효성을 확인하기 위해 Date 객체로 변환 시도
  const date = new Date(dateString);

  // Date 객체로 변환된 값이 유효한 날짜인지 확인
  if (isNaN(date.getTime())) {
    return false;
  }

  // 원래 문자열과 변환된 날짜 문자열이 같은지 확인 (예: 2024-02-30 같은 유효하지 않은 날짜 방지)
  return date.toISOString().startsWith(dateString);
}
