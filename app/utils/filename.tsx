export function sanitizeFileName(fileName: string) {
  const result = fileName
    .normalize("NFD") // 유니코드 정규화 (NFD)
    .replace(/[\u0300-\u036f]/g, ""); // 악센트 제거
  // 파일 이름을 정규화하는 함수
  console.log(fileName.length);
  return result;
}
