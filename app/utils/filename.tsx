export function sanitizeFileName(fileName: string) {
  const result = fileName
    .normalize("NFD") // 유니코드 정규화 (NFD)
    .replace(/[\u0300-\u036f]/g, ""); // 악센트 제거
  return result;
}
