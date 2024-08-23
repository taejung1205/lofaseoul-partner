import { Checkbox } from "@mantine/core";
import React, { useMemo } from "react";
import { useEffect, useState } from "react";
import { dateToDayStr } from "~/utils/date";
import { PartnerProfile } from "./partner_profile";
import { LofaSellers } from "./seller";
import { SellerProfile } from "~/routes/admin/seller-manage";

//통계용 파일 업로드에서 올릴 때 사용하는 양식입니다.
//한 데이터는 한 거래를 나타냅니다.
export type RevenueData = {
  orderDate: Date; //구매일자
  seller: string; //판매처 (플랫폼)
  partnerName: string; //공급처 (파트너명)
  productName: string; //상품명
  optionName: string; //옵션명
  price: number; //판매가
  amount: number; //수량
  orderStatus: string; //주문상태
  cs: string; // C/S
  isDiscounted: boolean;
  lofaDiscountLevyRate?: number;
  partnerDiscountLevyRate?: number;
  platformDiscountLevyRate?: number;
  lofaAdjustmentFeeRate?: number;
  platformAdjustmentFeeRate?: number;
};

export const PossibleOrderStatus = ["발주", "접수", "송장", "배송"];

export const PossibleCS = [
  "정상",
  "배송전 부분 교환",
  "배송전 부분 취소",
  "배송전 전체 취소",
  "배송전 전체 교환",
  "배송후 부분 교환",
  "배송후 부분 취소",
  "배송후 전체 취소",
  "배송후 전체 교환",
  "보류",
  "맞교환",
  "배송후교환C",
];

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  styleOverrides?: React.CSSProperties;
}

function Box({ children, styleOverrides, ...props }: Props) {
  const orderBoxStyles: React.CSSProperties = {
    width: "inherit",
    height: "60%",
    minHeight: "60%",
    position: "relative",
    overflow: "scroll",
    ...styleOverrides,
  };

  return (
    <div style={orderBoxStyles} {...props}>
      {children}
    </div>
  );
}

function ItemsBox({ children, styleOverrides, ...props }: Props) {
  const orderItemsBoxStyles: React.CSSProperties = {
    maxHeight: "85%",
  };

  return (
    <div style={orderItemsBoxStyles} {...props}>
      {children}
    </div>
  );
}

function ItemBox({ children, styleOverrides, ...props }: Props) {
  const orderItemBoxStyles: React.CSSProperties = {
    width: "fit-content",
    display: "flex",
    alignItems: "center",
    padding: "10px 6px",
    ...styleOverrides,
  };

  return (
    <div style={orderItemBoxStyles} {...props}>
      {children}
    </div>
  );
}

function Header({ children, styleOverrides, ...props }: Props) {
  const orderHeaderStyles: React.CSSProperties = {
    backgroundColor: "#ebebeb",
    width: "fit-content",
    display: "flex",
    alignItems: "center",
    padding: "10px 6px",
    ...styleOverrides,
  };

  return (
    <div style={orderHeaderStyles} {...props}>
      {children}
    </div>
  );
}

function TextBox({ children, styleOverrides, ...props }: Props) {
  const textBoxStyles: React.CSSProperties = {
    marginLeft: "10px",
    fontWeight: 700,
    fontSize: "10px",
    lineHeight: "20px",
    textAlign: "center",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    overflow: "hidden",
    ...styleOverrides,
  };

  return (
    <div style={textBoxStyles} {...props}>
      {children}
    </div>
  );
}

/**
 * 엑셀에서 읽어온 해당 수익통계 자료 아이템이 유효한 지를 확인합니다.
 * 상태와 CS의 경우 가능한 항목으로 적혔는지 확인합니다.
 * @param item : RevenueDataItem
 * @returns
 *  유효할 경우 true, 아닐 경우 문제가 있는 곳의 항목명
 */
export function checkRevenueDataItem(item: RevenueData) {
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

  if (!PossibleOrderStatus.includes(item.orderStatus)) {
    return {
      isValid: false,
      message: `상태가 유효하지 않은 항목이 존재합니다. (${item.orderStatus})`,
    };
  }

  // Check if cs is defined and a non-empty string
  if (item.cs == undefined || item.cs.trim() === "") {
    return { isValid: false, message: "CS가 누락된 항목이 존재합니다." };
  }

  if (!PossibleCS.includes(item.cs)) {
    return {
      isValid: false,
      message: `CS가 유효하지 않은 항목이 존재합니다. (${item.cs})`,
    };
  }

  // If all checks passed, the item is valid
  return { isValid: true, message: "ok" };
}

export function getRevenueDataPeriod(items: RevenueData[]): {
  startDate: Date | undefined;
  endDate: Date | undefined;
} {
  if (items.length > 0) {
    let startDate = items[0].orderDate;
    let endDate = items[0].orderDate;
    for (let i = 1; i < items.length; i++) {
      const orderDate = items[i].orderDate;
      if (orderDate < startDate) {
        startDate = orderDate;
      }
      if (orderDate > endDate) {
        endDate = orderDate;
      }
    }
    return { startDate: startDate, endDate: endDate };
  } else {
    return { startDate: undefined, endDate: undefined };
  }
}

function RevenueDataItem({
  item,
  index,
  check,
  onItemCheck,
  checkboxRequired = true,
  isDiscountPreview = false,
  isDBTable = false,
  partnerProfile,
  platformFeeRate,
}: {
  item: RevenueData;
  index: number;
  check: boolean;
  onItemCheck: (index: number, isChecked: boolean) => void;
  checkboxRequired?: boolean;
  isDiscountPreview?: boolean;
  isDBTable?: boolean;
  partnerProfile?: PartnerProfile;
  platformFeeRate?: number;
}) {
  const [isChecked, setIsChecked] = useState<boolean>(check);

  useEffect(() => {
    setIsChecked(check);
  }, [check]);

  const isLofa = useMemo(() => {
    return LofaSellers.includes(item.seller);
  }, [item]);

  const isCsOK = useMemo(() => {
    return item.cs == "정상";
  }, [item]);

  const discountedPrice = useMemo(() => {
    return item.isDiscounted
      ? (item.price *
          (100 -
            item.lofaDiscountLevyRate! -
            item.partnerDiscountLevyRate! -
            item.platformDiscountLevyRate!)) /
          100
      : undefined;
  }, [item]);

  const totalSalesAmount = useMemo(() => {
    return (discountedPrice ?? item.price) * item.amount;
  }, [item]);

  const commonFeeRate = useMemo(() => {
    if (partnerProfile) {
      return isLofa ? partnerProfile.lofaFee : partnerProfile.otherFee;
    } else {
      return 0;
    }
  }, [item]);

  const platformSettlementStandard = useMemo(() => {
    if (item.seller == "29cm" || item.seller == "오늘의집") {
      return "정상판매가";
    } else {
      return "할인판매가";
    }
  }, [item]);

  const partnerSettlement = useMemo(() => {
    return item.isDiscounted
      ? (item.price *
          item.amount *
          (100 -
            commonFeeRate -
            item.partnerDiscountLevyRate! +
            item.lofaAdjustmentFeeRate!)) /
          100
      : (item.price * item.amount * (100 - commonFeeRate)) / 100.0;
  }, [item]);

  const platformSettlement = useMemo(() => {
    if (platformFeeRate != undefined) {
      return isLofa
        ? totalSalesAmount
        : item.isDiscounted
        ? platformSettlementStandard == "정상판매가"
          ? (item.price *
              item.amount *
              (100 -
                platformFeeRate -
                item.lofaDiscountLevyRate! -
                item.partnerDiscountLevyRate! +
                item.platformAdjustmentFeeRate!)) /
            100
          : (((item.price *
              item.amount *
              (100 -
                item.lofaDiscountLevyRate! -
                item.partnerDiscountLevyRate!)) /
              100) *
              (100 - platformFeeRate + item.platformAdjustmentFeeRate!)) /
            100
        : (item.price * item.amount * (100 - platformFeeRate)) / 100;
    } else {
      return 0;
    }
  }, [item]);

  const lofaDiscountLevy = useMemo(() => {
    if (item.isDiscounted) {
      return (item.price * item.amount * item.lofaDiscountLevyRate!) / 100;
    } else {
      return undefined;
    }
  }, [item]);

  const proceeds = useMemo(() => {
    return platformSettlement - partnerSettlement;
  }, [item]);

  const netProfitAfterTax = useMemo(() => {
    if (partnerProfile) {
      switch (partnerProfile.businessTaxStandard) {
        case "일반":
          return proceeds * 0.9;
        case "간이":
        case "비사업자":
          return platformSettlement * 0.9 - partnerSettlement;
        case "면세":
        default:
          return proceeds;
      }
    } else {
      return proceeds;
    }
  }, [item]);

  return (
    <ItemBox key={`RevenueDataItem-${index}`}>
      {checkboxRequired ? (
        <Checkbox
          color={"gray"}
          size={"sm"}
          checked={isChecked}
          onChange={(event) => {
            setIsChecked(event.currentTarget.checked);
            onItemCheck(index, event.currentTarget.checked);
          }}
        />
      ) : (
        <></>
      )}

      <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
        {dateToDayStr(item.orderDate)}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
        {item.seller}
      </TextBox>
      <TextBox
        styleOverrides={{ minWidth: "160px", fontSize: "12px", width: "160px" }}
      >
        {item.partnerName}
      </TextBox>
      <TextBox
        styleOverrides={{ minWidth: "320px", fontSize: "12px", width: "320px" }}
      >
        {item.productName}
      </TextBox>
      <TextBox
        styleOverrides={{ minWidth: "250px", fontSize: "12px", width: "250px" }}
      >
        {item.optionName}
      </TextBox>
      {isDBTable ? (
        <TextBox styleOverrides={{ minWidth: "45px", width: "45px" }}>
          {item.isDiscounted ? "O" : "X"}
        </TextBox>
      ) : (
        <></>
      )}

      {isDBTable ? (
        <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
          {item.price}
        </TextBox>
      ) : (
        <TextBox
          styleOverrides={{
            minWidth: "60px",
            width: "60px",
            color: isDiscountPreview && item.isDiscounted ? "red" : "inherit",
          }}
        >
          {isDiscountPreview && item.isDiscounted
            ? discountedPrice
            : item.price}
        </TextBox>
      )}
      {isDBTable ? (
        <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
          {discountedPrice ?? ""}
        </TextBox>
      ) : (
        <></>
      )}
      <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
        {item.amount}
      </TextBox>
      {isDBTable ? (
        <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
          {totalSalesAmount}
        </TextBox>
      ) : (
        <></>
      )}
      <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
        {item.orderStatus}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "180px", width: "180px" }}>
        {item.cs}
      </TextBox>
      {isDBTable ? (
        <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
          {partnerSettlement}
        </TextBox>
      ) : (
        <></>
      )}
      {isDBTable ? (
        <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
          {totalSalesAmount - platformSettlement}
        </TextBox>
      ) : (
        <></>
      )}
      {isDBTable ? (
        <TextBox styleOverrides={{ minWidth: "75px", width: "75px" }}>
          {lofaDiscountLevy ?? ""}
        </TextBox>
      ) : (
        <></>
      )}
      {isDBTable ? (
        <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
          {platformSettlement - partnerSettlement}
        </TextBox>
      ) : (
        <></>
      )}
      {isDBTable ? (
        <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
          {netProfitAfterTax}
        </TextBox>
      ) : (
        <></>
      )}
      {isDBTable ? (
        <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
          {(netProfitAfterTax / totalSalesAmount) * 100}
        </TextBox>
      ) : (
        <></>
      )}
    </ItemBox>
  );
}

export function RevenueDataTable({
  items,
  itemsChecked,
  onItemCheck,
  onCheckAll,
  defaultAllCheck = true,
  checkboxRequired = true,
  isDiscountPreview = false,
  isDBTable = false,
  partnerProfiles,
  sellerProfiles,
}: {
  items: RevenueData[];
  itemsChecked: boolean[];
  onItemCheck: (index: number, isChecked: boolean) => void;
  onCheckAll: (isChecked: boolean) => void;
  defaultAllCheck: boolean;
  checkboxRequired?: boolean;
  isDiscountPreview?: boolean;
  isDBTable?: boolean;
  partnerProfiles?: Map<string, PartnerProfile>;
  sellerProfiles?: Map<string, SellerProfile>;
}) {
  const [allChecked, setAllChecked] = useState<boolean>(false);

  useEffect(() => {
    setAllChecked(defaultAllCheck);
  }, [items]);

  return (
    <>
      <Box>
        <Header>
          {checkboxRequired ? (
            <Checkbox
              color={"gray"}
              size={"sm"}
              checked={allChecked}
              onChange={(event) => {
                const val = event.currentTarget.checked;
                onCheckAll(val);
                setAllChecked(val);
              }}
            />
          ) : (
            <></>
          )}

          <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
            주문일
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
            판매처
          </TextBox>
          <TextBox
            styleOverrides={{
              minWidth: "160px",
              fontSize: "12px",
              width: "160px",
            }}
          >
            공급처
          </TextBox>
          <TextBox
            styleOverrides={{
              minWidth: "320px",
              fontSize: "12px",
              width: "320px",
            }}
          >
            상품명
          </TextBox>
          <TextBox
            styleOverrides={{
              minWidth: "250px",
              fontSize: "12px",
              width: "250px",
            }}
          >
            옵션명
          </TextBox>
          {isDBTable ? (
            <TextBox styleOverrides={{ minWidth: "45px", width: "45px" }}>
              할인적용
            </TextBox>
          ) : (
            <></>
          )}
          {isDBTable ? (
            <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
              정상판매가
            </TextBox>
          ) : (
            <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
              판매가
            </TextBox>
          )}
          {isDBTable ? (
            <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
              할인판매가
            </TextBox>
          ) : (
            <></>
          )}
          <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
            주문수량
          </TextBox>
          {isDBTable ? (
            <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
              총판매액
            </TextBox>
          ) : (
            <></>
          )}
          <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
            상태
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "180px", width: "180px" }}>
            CS
          </TextBox>
          {isDBTable ? (
            <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
              업체정산금
            </TextBox>
          ) : (
            <></>
          )}
          {isDBTable ? (
            <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
              플랫폼수수료
            </TextBox>
          ) : (
            <></>
          )}
          {isDBTable ? (
            <TextBox styleOverrides={{ minWidth: "75px", width: "75px" }}>
              로파할인부담금
            </TextBox>
          ) : (
            <></>
          )}
          {isDBTable ? (
            <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
              수익금
            </TextBox>
          ) : (
            <></>
          )}
          {isDBTable ? (
            <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
              세후순수익
            </TextBox>
          ) : (
            <></>
          )}
          {isDBTable ? (
            <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
              수익률(%)
            </TextBox>
          ) : (
            <></>
          )}

          <div style={{ width: "16px" }} />
        </Header>
        <ItemsBox>
          {items.map((item, index) => {
            let partnerProfile;
            let platformFeeRate;
            if (partnerProfiles) {
              partnerProfile = partnerProfiles.get(item.partnerName);
            }
            if (sellerProfiles) {
              const sellerProfile = sellerProfiles.get(item.seller);
              if (sellerProfile) {
                platformFeeRate = sellerProfile.fee;
              } else {
                platformFeeRate = 0;
              }
            }

            return (
              <RevenueDataItem
                key={`RevenueDataItem-${index}`}
                index={index}
                item={item}
                check={itemsChecked[index] ?? false}
                onItemCheck={onItemCheck}
                checkboxRequired={checkboxRequired}
                isDiscountPreview={isDiscountPreview}
                isDBTable={isDBTable}
                partnerProfile={partnerProfile}
                platformFeeRate={platformFeeRate}
              />
            );
          })}
        </ItemsBox>
      </Box>
    </>
  );
}

export const RevenueDataTableMemo = React.memo(
  RevenueDataTable,
  (prev, next) => {
    return (
      prev.items == next.items &&
      prev.itemsChecked == next.itemsChecked &&
      prev.isDiscountPreview == next.isDiscountPreview
    );
  }
);
