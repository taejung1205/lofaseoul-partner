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

export function getTimezoneDate(date: Date) {
  const timezoneOffset = date.getTimezoneOffset() / 60;
  return new Date(date.getTime() + (timezoneOffset + 9) * 3600 * 1000);
}

export function dateToKoreanMonth(date: Date) {
  const newDate = getTimezoneDate(date);
  const year = newDate.getFullYear().toString().substring(2);
  const month = (newDate.getMonth() + 1).toString().padStart(2, "0");
  return `${year}년 ${month}월`;
}

export function dateToNumeralMonth(date: Date) {
  const newDate = getTimezoneDate(date);
  const year = newDate.getFullYear().toString().substring(2);
  const month = (newDate.getMonth() + 1).toString().padStart(2, "0");
  return `${year}${month}`;
}

export function numeralMonthToKorean(numeral: string) {
  const year = numeral.substring(0, 2);
  const month = numeral.substring(2);
  return `${year}년 ${month}월`;
}

export function koreanMonthToNumeral(monthStr: string) {
  const year = monthStr.substring(0, 2);
  const month = monthStr.substring(4, 6);
  return `${year}${month}`;
}

export function koreanMonthToDate(monthStr: string) {
  const year = monthStr.substring(0, 2);
  const month = monthStr.substring(4, 6);
  return new Date(2000 + Number(year), Number(month) - 1);
}

export function dateToDayStr(date: Date) {
  const newDate = getTimezoneDate(date);
  const year = newDate.getFullYear();
  const month = (newDate.getMonth() + 1).toString().padStart(2, "0");
  const day = newDate.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dayStrToDate(dayStr: string) {
  const year = dayStr.substring(0, 4);
  const month = dayStr.substring(5, 7);
  const day = dayStr.substring(8, 10);
  return new Date(Number(year), Number(month) - 1, Number(day));
}