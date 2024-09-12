import { Checkbox } from "@mantine/core";
import React, { useMemo } from "react";
import { useEffect, useState } from "react";
import { dateToDayStr } from "~/utils/date";
import { LofaSellers, NormalPriceStandardSellers } from "./seller";

//통계용 파일 업로드에서 올릴 때 사용하는 양식입니다.
//한 데이터는 한 거래를 나타냅니다.
export type RevenueData = {
  orderDate: Date; //구매일자
  seller: string; //판매처 (플랫폼)
  providerName: string; //공급처 (파트너명)
  orderNumber: string; //주문번호
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
  commonFeeRate?: number;
  platformFeeRate?: number;
  businessTaxStandard?: string;
};

//정산통계 DB에서 보여주는 항목 선택지용
export type RevenueDBShowingItems = {
  showingOrderDate: boolean;
  showingSeller: boolean;
  showingProviderName: boolean;
  showingOrderNumber: boolean;
  showingProductName: boolean;
  showingOption: boolean;
  showingIsDiscounted: boolean;
  showingPrice: boolean;
  showingDiscountedPrice: boolean;
  showingAmount: boolean;
  showingTotalSalesAmount: boolean;
  showingOrderStatus: boolean;
  showingCs: boolean;
  showingPartnerSettlement: boolean;
  showingPlatformFee: boolean;
  showingLofaDiscountLevy: boolean;
  showingProceeds: boolean;
  showingNetProfitAfterTax: boolean;
  showingReturnRate: boolean;
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
    maxWidth: "100%",
    height: "55%",
    minHeight: "55%",
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
  // Check if orderDate is defined and not a NaN Date
  if (!(item.orderDate instanceof Date) || isNaN(item.orderDate.getTime())) {
    //문자열로 들어왔을 가능성 확인
    const date = new Date(item.orderDate);
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return {
        isValid: false,
        message: `주문일이 유효하지 않은 항목이 존재합니다. (${item.orderDate}) `,
      };
    } else {
      item.orderDate = date;
    }
  }

  // Check if seller is defined and a non-empty string
  if (item.seller == undefined || item.seller.trim() === "") {
    return { isValid: false, message: "판매처가 누락된 항목이 존재합니다." };
  }

  // Check if providerName is defined and a non-empty string
  if (item.providerName == undefined || item.providerName.trim() === "") {
    return { isValid: false, message: "공급처가 누락된 항목이 존재합니다." };
  }

  // Check if productName is defined and a non-empty string
  if (item.productName == undefined || item.productName.trim() === "") {
    return { isValid: false, message: "상품명이 누락된 항목이 존재합니다." };
  }

  // Check if orderNumber is defined and a non-empty string
  if (item.orderNumber == undefined || item.orderNumber.trim() === "") {
    return { isValid: false, message: "주문번호 누락된 항목이 존재합니다." };
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

export function getDiscountedPrice(item: RevenueData) {
  return item.isDiscounted
    ? (item.price *
        (100 -
          item.lofaDiscountLevyRate! -
          item.partnerDiscountLevyRate! -
          item.platformDiscountLevyRate!)) /
        100
    : undefined;
}

//매출
export function getSalesAmount(item: RevenueData) {
  const isCsOk = item.cs == "정상";
  const isOrderStatusDeliver = item.orderStatus == "배송";
  const salesPrice = item.isDiscounted
    ? (item.price *
        (100 -
          item.lofaDiscountLevyRate! -
          item.partnerDiscountLevyRate! -
          item.platformDiscountLevyRate!)) /
      100
    : item.price;

  return isCsOk && isOrderStatusDeliver ? salesPrice * item.amount : 0;
}

export function getPartnerSettlement(item: RevenueData) {
  if (item.commonFeeRate == undefined) {
    return NaN;
  }
  return item.isDiscounted
    ? (item.price *
        item.amount *
        (100 -
          item.commonFeeRate -
          item.partnerDiscountLevyRate! +
          item.lofaAdjustmentFeeRate!)) /
        100
    : (item.price * item.amount * (100 - item.commonFeeRate)) / 100.0;
}

export function getPlatformFee(item: RevenueData) {
  if (item.platformFeeRate == undefined) {
    return NaN;
  }
  const isLofa = LofaSellers.includes(item.seller);
  const platformSettlementStandard = NormalPriceStandardSellers.includes(
    item.seller
  )
    ? "정상판매가"
    : "할인판매가";

  const platformSettlement = isLofa
    ? getSalesAmount(item)
    : item.isDiscounted
    ? platformSettlementStandard == "정상판매가"
      ? (item.price *
          item.amount *
          (100 -
            item.platformFeeRate -
            item.lofaDiscountLevyRate! -
            item.partnerDiscountLevyRate! +
            item.platformAdjustmentFeeRate!)) /
        100
      : (((item.price *
          item.amount *
          (100 - item.lofaDiscountLevyRate! - item.partnerDiscountLevyRate!)) /
          100) *
          (100 - item.platformFeeRate + item.platformAdjustmentFeeRate!)) /
        100
    : (getSalesAmount(item) * (100 - item.platformFeeRate)) / 100;

  return getSalesAmount(item) - platformSettlement;
}

export function getProceeds(item: RevenueData) {
  if (item.commonFeeRate == undefined || item.platformFeeRate == undefined) {
    return NaN;
  }
  const isCsOK = item.cs == "정상";
  const isOrderStatusDeliver = item.orderStatus == "배송";
  if (!isCsOK || !isOrderStatusDeliver) {
    return 0;
  }
  const isLofa = LofaSellers.includes(item.seller);
  const platformSettlementStandard = NormalPriceStandardSellers.includes(
    item.seller
  )
    ? "정상판매가"
    : "할인판매가";

  const platformSettlement = isLofa
    ? getSalesAmount(item)
    : item.isDiscounted
    ? platformSettlementStandard == "정상판매가"
      ? (item.price *
          item.amount *
          (100 -
            item.platformFeeRate -
            item.lofaDiscountLevyRate! -
            item.partnerDiscountLevyRate! +
            item.platformAdjustmentFeeRate!)) /
        100
      : (((item.price *
          item.amount *
          (100 - item.lofaDiscountLevyRate! - item.partnerDiscountLevyRate!)) /
          100) *
          (100 - item.platformFeeRate + item.platformAdjustmentFeeRate!)) /
        100
    : (getSalesAmount(item) * (100 - item.platformFeeRate)) / 100;

  const partnerSettlement = item.isDiscounted
    ? (item.price *
        item.amount *
        (100 -
          item.commonFeeRate -
          item.partnerDiscountLevyRate! +
          item.lofaAdjustmentFeeRate!)) /
      100
    : (item.price * item.amount * (100 - item.commonFeeRate)) / 100.0;

  return platformSettlement - partnerSettlement;
}

export function getNetProfitAfterTax(item: RevenueData) {
  if (!item.businessTaxStandard) {
    return NaN;
  }
  switch (item.businessTaxStandard) {
    case "일반":
      return getProceeds(item) * 0.9;
    case "간이":
    case "비사업자":
      return (
        (getSalesAmount(item) - getPlatformFee(item)) * 0.9 -
        getPartnerSettlement(item)
      );
    case "면세":
    default:
      return getProceeds(item);
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
  showingItems,
}: {
  item: RevenueData;
  index: number;
  check: boolean;
  onItemCheck: (index: number, isChecked: boolean) => void;
  checkboxRequired?: boolean;
  isDiscountPreview?: boolean;
  isDBTable?: boolean;
  showingItems: RevenueDBShowingItems;
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

  const isOrderStatusDeliver = useMemo(() => {
    return item.orderStatus == "배송";
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
  }, [item.isDiscounted]);

  const totalSalesAmount = useMemo(() => {
    return isCsOK && isOrderStatusDeliver
      ? (discountedPrice ?? item.price) * item.amount
      : 0;
  }, [item]);

  const normalPriceTotalSalesAmount = useMemo(() => {
    return isCsOK && isOrderStatusDeliver ? item.price * item.amount : 0;
  }, [item]);

  const businessTaxStandard = useMemo(() => {
    if (item.businessTaxStandard) {
      return item.businessTaxStandard;
    } else {
      return "일반";
    }
  }, [item]);

  const commonFeeRate = useMemo(() => {
    if (item.commonFeeRate != undefined) {
      return item.commonFeeRate;
    } else {
      return NaN;
    }
  }, [item]);

  const platformSettlementStandard = useMemo(() => {
    if (NormalPriceStandardSellers.includes(item.seller)) {
      return "정상판매가";
    } else {
      return "할인판매가";
    }
  }, [item]);

  const partnerSettlement = useMemo(() => {
    return item.isDiscounted
      ? (normalPriceTotalSalesAmount *
          (100 -
            commonFeeRate -
            item.partnerDiscountLevyRate! +
            item.lofaAdjustmentFeeRate!)) /
          100
      : (totalSalesAmount * (100 - commonFeeRate)) / 100.0;
  }, [item]);

  const platformFeeRate = useMemo(() => {
    if (item.platformFeeRate != undefined) {
      return item.platformFeeRate;
    } else {
      return NaN;
    }
  }, [item]);

  const platformSettlement = useMemo(() => {
    if (platformFeeRate != undefined) {
      return isLofa
        ? totalSalesAmount
        : item.isDiscounted
        ? platformSettlementStandard == "정상판매가"
          ? (normalPriceTotalSalesAmount *
              (100 -
                platformFeeRate -
                item.lofaDiscountLevyRate! -
                item.partnerDiscountLevyRate! +
                item.platformAdjustmentFeeRate!)) /
            100
          : (((normalPriceTotalSalesAmount *
              (100 -
                item.lofaDiscountLevyRate! -
                item.partnerDiscountLevyRate!)) /
              100) *
              (100 - platformFeeRate + item.platformAdjustmentFeeRate!)) /
            100
        : (totalSalesAmount * (100 - platformFeeRate)) / 100;
    } else {
      return 0;
    }
  }, [item]);

  const lofaDiscountLevy = useMemo(() => {
    if (item.isDiscounted) {
      return (normalPriceTotalSalesAmount * item.lofaDiscountLevyRate!) / 100;
    } else {
      return undefined;
    }
  }, [item]);

  const proceeds = useMemo(() => {
    return platformSettlement - partnerSettlement;
  }, [item]);

  const netProfitAfterTax = useMemo(() => {
    switch (businessTaxStandard) {
      case "일반":
        return proceeds * 0.9;
      case "간이":
      case "비사업자":
        return platformSettlement * 0.9 - partnerSettlement;
      case "면세":
      default:
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

      {showingItems.showingOrderDate ? (
        <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
          {dateToDayStr(item.orderDate)}
        </TextBox>
      ) : (
        <></>
      )}

      {showingItems.showingSeller ? (
        <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
          {item.seller}
        </TextBox>
      ) : (
        <></>
      )}

      {showingItems.showingProviderName ? (
        <TextBox styleOverrides={{ minWidth: "160px", width: "160px" }}>
          {item.providerName}
        </TextBox>
      ) : (
        <></>
      )}

      {showingItems.showingOrderNumber ? (
        <TextBox styleOverrides={{ minWidth: "160px", width: "160px" }}>
          {item.orderNumber ?? ""}
        </TextBox>
      ) : (
        <></>
      )}

      {showingItems.showingProductName ? (
        <TextBox styleOverrides={{ minWidth: "320px", width: "320px" }}>
          {item.productName}
        </TextBox>
      ) : (
        <></>
      )}

      {showingItems.showingOption ? (
        <TextBox styleOverrides={{ minWidth: "250px", width: "250px" }}>
          {item.optionName}
        </TextBox>
      ) : (
        <></>
      )}

      {isDBTable && showingItems.showingIsDiscounted ? (
        <TextBox styleOverrides={{ minWidth: "45px", width: "45px" }}>
          {item.isDiscounted ? "O" : "X"}
        </TextBox>
      ) : (
        <></>
      )}

      {isDBTable ? (
        showingItems.showingPrice ? (
          <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
            {item.price.toLocaleString()}
          </TextBox>
        ) : (
          <></>
        )
      ) : (
        <TextBox
          styleOverrides={{
            minWidth: "60px",
            width: "60px",
            color: isDiscountPreview && item.isDiscounted ? "red" : "inherit",
          }}
        >
          {(isDiscountPreview && item.isDiscounted
            ? discountedPrice
            : item.price
          )?.toLocaleString()}
        </TextBox>
      )}

      {isDBTable && showingItems.showingDiscountedPrice ? (
        <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
          {discountedPrice?.toLocaleString() ?? ""}
        </TextBox>
      ) : (
        <></>
      )}

      {showingItems.showingAmount ? (
        <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
          {item.amount}
        </TextBox>
      ) : (
        <></>
      )}

      {isDBTable && showingItems.showingTotalSalesAmount ? (
        <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
          {totalSalesAmount.toLocaleString()}
        </TextBox>
      ) : (
        <></>
      )}

      {showingItems.showingOrderStatus ? (
        <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
          {item.orderStatus}
        </TextBox>
      ) : (
        <></>
      )}

      {showingItems.showingCs ? (
        <TextBox styleOverrides={{ minWidth: "180px", width: "180px" }}>
          {item.cs}
        </TextBox>
      ) : (
        <></>
      )}

      {isDBTable && showingItems.showingPartnerSettlement ? (
        <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
          {partnerSettlement.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </TextBox>
      ) : (
        <></>
      )}

      {isDBTable && showingItems.showingPlatformFee ? (
        <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
          {(totalSalesAmount - platformSettlement).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </TextBox>
      ) : (
        <></>
      )}

      {isDBTable && showingItems.showingLofaDiscountLevy ? (
        <TextBox styleOverrides={{ minWidth: "75px", width: "75px" }}>
          {lofaDiscountLevy?.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }) ?? ""}
        </TextBox>
      ) : (
        <></>
      )}

      {isDBTable && showingItems.showingProceeds ? (
        <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
          {(platformSettlement - partnerSettlement).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </TextBox>
      ) : (
        <></>
      )}

      {isDBTable && showingItems.showingNetProfitAfterTax ? (
        <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
          {netProfitAfterTax.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </TextBox>
      ) : (
        <></>
      )}

      {isDBTable && showingItems.showingReturnRate ? (
        <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
          {totalSalesAmount != 0
            ? ((netProfitAfterTax / totalSalesAmount) * 100).toFixed(2)
            : 0}
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
  showingItems,
}: {
  items: RevenueData[];
  itemsChecked: boolean[];
  onItemCheck: (index: number, isChecked: boolean) => void;
  onCheckAll: (isChecked: boolean) => void;
  defaultAllCheck: boolean;
  checkboxRequired?: boolean;
  isDiscountPreview?: boolean;
  isDBTable?: boolean;
  showingItems?: RevenueDBShowingItems;
}) {
  const [allChecked, setAllChecked] = useState<boolean>(false);

  useEffect(() => {
    setAllChecked(defaultAllCheck);
  }, [items]);

  const showingItemsMemo = useMemo(() => {
    if (showingItems) {
      return showingItems;
    } else {
      return {
        showingOrderDate: true,
        showingSeller: true,
        showingProviderName: true,
        showingOrderNumber: true,
        showingProductName: true,
        showingOption: true,
        showingIsDiscounted: true,
        showingPrice: true,
        showingDiscountedPrice: true,
        showingAmount: true,
        showingTotalSalesAmount: true,
        showingOrderStatus: true,
        showingCs: true,
        showingPartnerSettlement: true,
        showingPlatformFee: true,
        showingLofaDiscountLevy: true,
        showingProceeds: true,
        showingNetProfitAfterTax: true,
        showingReturnRate: true,
      };
    }
  }, [showingItems]);

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

          {showingItemsMemo.showingOrderDate ? (
            <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
              주문일
            </TextBox>
          ) : (
            <></>
          )}

          {showingItemsMemo.showingSeller ? (
            <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
              판매처
            </TextBox>
          ) : (
            <></>
          )}

          {showingItemsMemo.showingProviderName ? (
            <TextBox
              styleOverrides={{
                minWidth: "160px",
                width: "160px",
              }}
            >
              공급처
            </TextBox>
          ) : (
            <></>
          )}

          {showingItemsMemo.showingOrderNumber ? (
            <TextBox
              styleOverrides={{
                minWidth: "160px",
                width: "160px",
              }}
            >
              주문번호
            </TextBox>
          ) : (
            <></>
          )}

          {showingItemsMemo.showingProductName ? (
            <TextBox
              styleOverrides={{
                minWidth: "320px",
                width: "320px",
              }}
            >
              상품명
            </TextBox>
          ) : (
            <></>
          )}

          {showingItemsMemo.showingOption ? (
            <TextBox
              styleOverrides={{
                minWidth: "250px",
                width: "250px",
              }}
            >
              옵션명
            </TextBox>
          ) : (
            <></>
          )}

          {showingItemsMemo.showingIsDiscounted && isDBTable ? (
            <TextBox styleOverrides={{ minWidth: "45px", width: "45px" }}>
              할인적용
            </TextBox>
          ) : (
            <></>
          )}

          {showingItemsMemo.showingPrice ? (
            isDBTable ? (
              <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
                정상판매가
              </TextBox>
            ) : (
              <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
                판매가
              </TextBox>
            )
          ) : (
            <></>
          )}

          {showingItemsMemo.showingDiscountedPrice && isDBTable ? (
            <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
              할인판매가
            </TextBox>
          ) : (
            <></>
          )}

          {showingItemsMemo.showingAmount ? (
            <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
              주문수량
            </TextBox>
          ) : (
            <></>
          )}

          {showingItemsMemo.showingTotalSalesAmount && isDBTable ? (
            <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
              총판매액
            </TextBox>
          ) : (
            <></>
          )}

          {showingItemsMemo.showingOrderStatus ? (
            <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
              상태
            </TextBox>
          ) : (
            <></>
          )}

          {showingItemsMemo.showingCs ? (
            <TextBox styleOverrides={{ minWidth: "180px", width: "180px" }}>
              CS
            </TextBox>
          ) : (
            <></>
          )}

          {showingItemsMemo.showingPartnerSettlement && isDBTable ? (
            <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
              업체정산금
            </TextBox>
          ) : (
            <></>
          )}

          {showingItemsMemo.showingPlatformFee && isDBTable ? (
            <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
              플랫폼수수료
            </TextBox>
          ) : (
            <></>
          )}

          {showingItemsMemo.showingLofaDiscountLevy && isDBTable ? (
            <TextBox styleOverrides={{ minWidth: "75px", width: "75px" }}>
              로파할인부담금
            </TextBox>
          ) : (
            <></>
          )}

          {showingItemsMemo.showingProceeds && isDBTable ? (
            <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
              수익금
            </TextBox>
          ) : (
            <></>
          )}

          {showingItemsMemo.showingNetProfitAfterTax && isDBTable ? (
            <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
              세후순수익
            </TextBox>
          ) : (
            <></>
          )}

          {showingItemsMemo.showingReturnRate && isDBTable ? (
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
                showingItems={showingItemsMemo}
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
