import { useEffect, useState } from "react";
import { PossibleSellers } from "./seller";

/**
 * 모든 판매처의 정산금액을 합친 금액을 계산합니다.
 *  @param item : getSettlementSum()으로 가져온 json
 * @return 모든 판매처 정산금액의 합 ({settlement: number, shippingFee: number})
 */
export function getAllSellerSettlementSum(sums: any) {
    let settlement = 0;
    let shippingFee = 0;
    PossibleSellers.forEach((seller) => {
      settlement += sums[`settlement_${seller}`];
      shippingFee += sums[`shipping_${seller}`];
    });
    return { settlement: settlement, shippingFee: shippingFee };
  }

export function SettlementSumBar({
    seller,
    settlement,
    shippingFee,
  }: {
    seller: string;
    settlement: number;
    shippingFee: number;
  }) {
    const [sellerStr, setSellerStr] = useState<string>("");
  
    useEffect(() => {
      if (seller == "all") {
        setSellerStr("전체 판매처 합계");
      } else if (seller == "etc") {
        setSellerStr("기타 판매처 합계");
      } else if (seller == "etc") {
        setSellerStr("로파 홈페이지 합계");
      } else {
        setSellerStr(`${seller} 합계`);
      }
    }, [seller]);
    return (
      <div
        style={{
          backgroundColor: "#D9D9D999",
          width: "inherit",
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          padding: "20px",
        }}
      >
        <div
          style={{
            fontSize: "20px",
            fontWeight: "700",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {sellerStr}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "20px",
            fontWeight: "700",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          정산 금액
          <div style={{ width: "15px" }} />
          <div style={{ color: "#1859FF" }}> {`${settlement}원`}</div>
          <div style={{ width: "25px" }} />
          배송비 별도 정산
          <div style={{ width: "15px" }} />
          <div style={{ color: "#1859FF" }}> {`${shippingFee}원`}</div>
          <div style={{ width: "25px" }} />
          정산 총계 (정산 금액 + 배송비)
          <div style={{ width: "15px" }} />
          <div style={{ color: "#1859FF" }}>
            {`${settlement + shippingFee}원`}
          </div>
        </div>
      </div>
    );
  }