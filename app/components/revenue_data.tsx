//통계용 파일 업로드에서 올릴 때 사용하는 양식입니다.
export type RevenueDataItem = {
  orderDate: Date; //구매일자
  seller: string; //판매처 (플랫폼)
  partnerName: string; //공급처 (파트너명)
  productName: string; //상품명
  option: string; //옵션명
  price: number; //판매가
  amount: number; //수량
  orderStatus: string; //주문상태
  cs: string; // C/S
  isDiscounted: boolean;
};

/**
 * 엑셀에서 읽어온 해당 수익통계 자료 아이템이 유효한 지를 확인합니다.
 * @param item : RevenueDataItem
 * @returns
 *  유효할 경우 true, 아닐 경우 문제가 있는 곳의 항목명
 */
export function checkRevenueDataItem(item: RevenueDataItem) {
  // Check if orderDate is defined and a non-empty string
  if (!(item.orderDate instanceof Date) || isNaN(item.orderDate.getTime())) {
    return {
      isValid: false,
      message: `주문일이 유효하지 않은 항목이 존재합니다. (${item.orderDate}) `,
    };
  }

  // Check if seller is defined and a non-empty string
  if (item.seller == undefined || item.seller.trim() === "") {
    return { isValid: false, message: "판매처가 누락된 항목이 존재합니다." };
  }

  // Check if partnerName is defined and a non-empty string
  if (item.partnerName == undefined || item.partnerName.trim() === "") {
    return { isValid: false, message: "공급처가 누락된 항목이 존재합니다." };
  }

  // Check if productName is defined and a non-empty string
  if (item.productName == undefined || item.productName.trim() === "") {
    return { isValid: false, message: "상품명이 누락된 항목이 존재합니다." };
  }

  // Check if price is defined, a number, and positive
  if (item.price == undefined || Number.isNaN(item.price)) {
    return { isValid: false, message: "판매가가 누락된 항목이 존재합니다." };
  }

  // Check if amount is defined, an integer, and positive
  if (item.amount == undefined || !Number.isInteger(item.amount)) {
    return { isValid: false, message: "주문수량이 누락된 항목이 존재합니다." };
  }

  // Check if orderStatus is defined and a non-empty string
  if (item.orderStatus == undefined || item.orderStatus.trim() === "") {
    return { isValid: false, message: "상태가 누락된 항목이 존재합니다." };
  }

  // Check if cs is defined and a non-empty string
  if (item.cs == undefined || item.cs.trim() === "") {
    return { isValid: false, message: "CS가 누락된 항목이 존재합니다." };
  }

  // If all checks passed, the item is valid
  return { isValid: true, message: "ok" };
}
