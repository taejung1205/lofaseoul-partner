import { Select } from "@mantine/core";
import { SettlementItem } from "./settlement_table";
import { OrderItem } from "./order";
import { RevenueData } from "./revenue_data";
import { DiscountData } from "./discount";

export const PossibleSellers = [
  "29cm",
  "EQL",
  "로파공홈",
  "용산쇼룸",
  "예약거래",
  "오늘의집",
  "카카오",
  "무신사",
  "광주비엔날레"
];

export const LofaSellers = ["로파공홈", "용산쇼룸", "예약거래"];

export const NormalPriceStandardSellers = [
  "29cm",
  "오늘의집",
  "무신사",
  "로파공홈",
  "용산쇼룸",
  "예약거래",
  "광주비엔날레"
];

/**
 * 판매처 유사명을 수정합니다
 * 만약 판매처가 '카페24'일 경우 '로파공홈'으로 수정합니다.
 * @param item : SettlementItem (must be valid)
 * @returns
 *  유효할 경우 true, 아닐 경우 false
 */
export function adjustSellerName(
  item: OrderItem | SettlementItem | RevenueData | DiscountData
) {
  if (PossibleSellers.includes(item.seller)) {
    return true;
  } else if (item.seller === "카페24") {
    item.seller = "로파공홈";
    return true;
  } else if (item.seller === "29CM") {
    item.seller = "29cm";
    return true;
  } else if (item.seller === "eql") {
    item.seller = "EQL";
    return true;
  } else {
    return false;
  }
}

export function SellerSelect({
  seller,
  setSeller,
}: {
  seller: string;
  setSeller: (value: string) => void;
}) {
  return (
    <Select
      value={seller}
      onChange={setSeller}
      data={[
        { value: "all", label: "전체 판매처" },
        { value: "29cm", label: "29cm" },
        { value: "EQL", label: "EQL" },
        { value: "로파공홈", label: "로파 홈페이지" },
        { value: "용산쇼룸", label: "용산쇼룸" },
        { value: "오늘의집", label: "오늘의집" },
        { value: "카카오", label: "카카오" },
        { value: "무신사", label: "무신사" },
        { value: "예약거래", label: "예약거래" },
        { value: "광주비엔날레", label: "광주비엔날레" },
        { value: "etc", label: "기타" },
      ]}
      styles={{
        input: {
          fontSize: "20px",
          fontWeight: "bold",
          borderRadius: 0,
          border: "3px solid black !important",
          height: "40px",
          width: "200px",
        },
        item: {
          "&[data-selected]": {
            backgroundColor: "grey",
          },
        },
      }}
    />
  );
}
