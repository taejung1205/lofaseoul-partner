import { Checkbox } from "@mantine/core";
import React, { useMemo } from "react";
import { useEffect, useState } from "react";
import { PartnerProfile } from "./partner_profile";
import { LofaSellers, PossibleSellers } from "./seller";
import { useViewportSize } from "@mantine/hooks";
import { isMobile } from "~/utils/mobile";
import { isValidDateString } from "~/utils/date";

export type SettlementItem = {
  orderDate?: string;
  seller: string;
  orderNumber: string;
  productName: string;
  optionName: string;
  price: number;
  amount: number;
  orderer: string;
  receiver: string;
  partnerName: string;
  fee: number;
  shippingFee: number;
  orderTag: string;
  sale: number;
};

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  isMobile: boolean;
  styleOverrides?: React.CSSProperties;
}

interface MarqueeOnHoverProps extends React.HTMLAttributes<HTMLDivElement> {
  isMobile: boolean;
  containerStyleOverrides?: React.CSSProperties;
  textStyleOverrides?: React.CSSProperties;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function SettlementBox({ isMobile, children, ...props }: Props) {
  const boxStyles: React.CSSProperties = {
    width: "inherit",
    height: "60%",
    minHeight: "60%",
    position: "relative",
    overflow: isMobile ? "scroll" : "hidden",
    border: "1px solid #ebebeb",
    borderBottom: "20px solid #ebebeb",
  };

  return (
    <div style={boxStyles} {...props}>
      {children}
    </div>
  );
}

export function SettlementItemsBox({ isMobile, children, ...props }: Props) {
  const itemsBoxStyles: React.CSSProperties = {
    maxHeight: "calc(100% - 42px)",
    overflowY: isMobile ? "visible" : "scroll",
  };

  return (
    <div style={itemsBoxStyles} {...props}>
      {children}
    </div>
  );
}

export function SettlementItemBox({ isMobile, children, ...props }: Props) {
  const itemBoxStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    padding: "10px 6px",
    width: isMobile ? "fit-content" : "auto",
  };

  return (
    <div style={itemBoxStyles} {...props}>
      {children}
    </div>
  );
}

export function SettlementHeader({ isMobile, children, ...props }: Props) {
  const itemBoxStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    padding: "10px 6px",
    width: isMobile ? "fit-content" : "auto",
    backgroundColor: "#ebebeb",
  };

  return (
    <div style={itemBoxStyles} {...props}>
      {children}
    </div>
  );
}

export function TextBox({
  isMobile,
  styleOverrides,
  children,
  ...props
}: Props) {
  const textBoxStyles: React.CSSProperties = {
    marginLeft: "10px",
    fontWeight: 700,
    fontSize: "10px",
    lineHeight: "20px",
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: isMobile ? "visible" : "hidden",
    ...styleOverrides,
  };

  return (
    <div style={textBoxStyles} {...props}>
      {children}
    </div>
  );
}

export function MarqueeOnHoverTextBox({
  isMobile,
  containerStyleOverrides,
  textStyleOverrides,
  isHovered,
  children,
  onMouseEnter,
  onMouseLeave,
  ...props
}: MarqueeOnHoverProps) {
  const containerStyles: React.CSSProperties = {
    marginLeft: "10px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    ...containerStyleOverrides,
  };
  const textStyles: React.CSSProperties = {
    fontWeight: 700,
    fontSize: "10px",
    lineHeight: "20px",
    textAlign: "center",
    left: isHovered ? "0" : "100%", // 마우스가 올려졌을 때와 아닐 때의 초기 위치
    transform: isHovered ? "translateX(-100%)" : "translateX(0)", // 마우스가 올려졌을 때와 아닐 때의 변환 위치
    transition: isHovered ? "transform 5s linear" : "",
  };

  return (
    <div
      style={containerStyles}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      <div style={textStyles}>{children}</div>
    </div>
  );
}

/**
 * 엑셀에서 읽어온 해당 정산아이템이 유효한 지를 확인합니다.
 * 파트너명, 옵션명을 제외하고 비어있는 값이 있으면 유효하지 않은 값으로 간주합니다.
 * @param item : SettlementItem
 * @returns
 *  유효할 경우 "ok", 아닐 경우 어디가 문제인지 나타내는 string
 */
export function isSettlementItemValid(item: SettlementItem) {
  if (item.orderDate == undefined || item.orderDate == "") {
    return "주문일이 누락되었습니다.";
  }

  if (!isValidDateString(item.orderDate)) {
    return "주문일 형식이 올바르지 않습니다. (YYYY-MM-DD)";
  }

  if (item.seller == undefined || item.seller == "") {
    return "판매처가 누락되었습니다.";
  }

  if (item.orderNumber == undefined || item.orderNumber == "") {
    return "주문번호가 누락되었습니다.";
  }

  if (item.productName == undefined || item.productName == "") {
    return "상품명이 누락되었습니다.";
  }

  if (item.price == undefined) {
    return "판매단가가 누락되었습니다";
  }

  if (item.amount == undefined) {
    return "수량이 누락되었습니다.";
  }
  return "ok";
}

/**
 * 판매처 유사명을 수정합니다
 * 만약 판매처가 '카페24'일 경우 '로파공홈'으로 수정합니다.
 * @param item : SettlementItem (must be valid)
 * @returns
 *  유효할 경우 true, 아닐 경우 false
 */
export function adjustSellerName(item: SettlementItem) {
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

/**
 * 상품명을 바탕으로 파트너명을 도출해 해당 정산아이템 정보에 넣습니다.
 * @param item : SettlementItem (must be valid)
 * @return
 *  파트너명을 유효하게 찾았을 경우 true,
 *  실패했을 경우 false
 */
export function setSettlementPartnerName(item: SettlementItem) {
  const regExp = /\[(.*?)\]/;
  let match = item.productName.match(regExp);
  if (match) {
    item.partnerName = match[1];
    return true;
  } else {
    return false;
  }
}

/**
 * 파트너 정보와 판매처를 바탕으로 수수료와 배송비를 기입합니다.
 * @param item : SettlementItem (must be valid) partnerProfile :  PartnerProfile
 * @return
 */
export function setSettlementFee(
  item: SettlementItem,
  partnerProfile: PartnerProfile
) {
  if (isShippingFeeApplied(item)) {
    item.shippingFee = partnerProfile.shippingFee;
  } else {
    item.shippingFee = 0;
  }
  if (LofaSellers.includes(item.seller)) {
    item.fee = partnerProfile.lofaFee;
  } else {
    item.fee = partnerProfile.otherFee;
  }
}

//주문태그를 바탕으로 배송비가 적용될 지, 되지 않을 지를 판단합니다.
//  직접출고 -> 배송비 정산 x
// 직접 추가출고 -> 배송비 정산 x
// 3PL출고(별이무역) -> 배송비 정산 x
// 외부출고 -> 배송비 정산 O
// 외부 추가출고 -> 배송비 정산 O
function isShippingFeeApplied(item: SettlementItem) {
  if (item.orderTag == "외부출고" || item.orderTag == "외부 추가출고") {
    return true;
  } else {
    return false;
  }
}

function SettlementItem({
  item,
  index,
  check,
  onItemCheck,
}: {
  item: SettlementItem;
  index: number;
  check: boolean;
  onItemCheck: (index: number, isChecked: boolean) => void;
}) {
  const viewportSize = useViewportSize();
  const [isNameHovered, setIsNameHovered] = useState<boolean>(false);
  const [isOptionHovered, setIsOptionHovered] = useState<boolean>(false);

  const isMobileMemo: boolean = useMemo(() => {
    return isMobile(viewportSize.width);
  }, [viewportSize]);

  useEffect(() => {
    setIsChecked(check);
  }, [check]);
  const [isChecked, setIsChecked] = useState<boolean>(check);
  let saleString = "";
  if (item.sale == undefined) {
    saleString = "0";
  } else if (item.sale > 0 && item.sale <= 1) {
    saleString = item.sale * 100 + "%";
  } else {
    saleString = item.sale + "";
  }
  return (
    <SettlementItemBox isMobile={isMobileMemo} key={`SettlementItem-${index}`}>
      <Checkbox
        color={"gray"}
        size={"sm"}
        checked={isChecked}
        onChange={(event) => {
          setIsChecked(event.currentTarget.checked);
          onItemCheck(index, event.currentTarget.checked);
        }}
      />
      <TextBox
        isMobile={isMobileMemo}
        styleOverrides={{ width: "90px", minWidth: "90px" }}
      >
        {item.orderDate ?? ""}
      </TextBox>
      <TextBox
        isMobile={isMobileMemo}
        styleOverrides={{ width: "60px", minWidth: "60px" }}
      >
        {item.seller}
      </TextBox>
      <TextBox
        isMobile={isMobileMemo}
        styleOverrides={{ width: "150px", minWidth: "150px" }}
      >
        {item.orderNumber}
      </TextBox>
      <MarqueeOnHoverTextBox
        isMobile={isMobileMemo}
        containerStyleOverrides={{
          width: isMobileMemo ? "300px" : "calc(50% - 348px)",
        }}
        onMouseEnter={() => setIsNameHovered(true)}
        onMouseLeave={() => setIsNameHovered(false)}
        isHovered={isNameHovered}
      >
        {item.productName}
      </MarqueeOnHoverTextBox>
      <MarqueeOnHoverTextBox
        isMobile={isMobileMemo}
        containerStyleOverrides={{
          width: isMobileMemo ? "300px" : "calc(50% - 438px)",
        }}
        onMouseEnter={() => setIsOptionHovered(true)}
        onMouseLeave={() => setIsOptionHovered(false)}
        isHovered={isOptionHovered}
      >
        {item.optionName}
      </MarqueeOnHoverTextBox>
      <TextBox
        isMobile={isMobileMemo}
        styleOverrides={{ width: "60px", minWidth: "60px" }}
      >
        {item.price}
      </TextBox>
      <TextBox
        isMobile={isMobileMemo}
        styleOverrides={{ width: "60px", minWidth: "60px" }}
      >
        {saleString}
      </TextBox>
      <TextBox
        isMobile={isMobileMemo}
        styleOverrides={{ width: "90px", minWidth: "90px" }}
      >
        {item.shippingFee == 0 ? "X" : "O"}
      </TextBox>
      <TextBox
        isMobile={isMobileMemo}
        styleOverrides={{ width: "30px", minWidth: "30px" }}
      >
        {item.amount}
      </TextBox>
      <TextBox
        isMobile={isMobileMemo}
        styleOverrides={{ width: "60px", minWidth: "60px" }}
      >
        {item.orderer}
      </TextBox>
      <TextBox
        isMobile={isMobileMemo}
        styleOverrides={{ width: "60px", minWidth: "60px" }}
      >
        {item.receiver}
      </TextBox>
    </SettlementItemBox>
  );
}

export function SettlementTable({
  items,
  itemsChecked,
  onItemCheck,
  onCheckAll,
  defaultAllCheck = true,
}: {
  items: SettlementItem[];
  itemsChecked: boolean[];
  onItemCheck: (index: number, isChecked: boolean) => void;
  onCheckAll: (isChecked: boolean) => void;
  defaultAllCheck: boolean;
}) {
  const [allChecked, setAllChecked] = useState<boolean>(false);
  const viewportSize = useViewportSize();

  const isMobileMemo: boolean = useMemo(() => {
    return isMobile(viewportSize.width);
  }, [viewportSize]);

  useEffect(() => {
    setAllChecked(defaultAllCheck);
  }, [items]);

  return (
    <SettlementBox isMobile={isMobileMemo}>
      <SettlementHeader isMobile={isMobileMemo}>
        <Checkbox
          color={"gray"}
          size={"sm"}
          checked={allChecked}
          onChange={(event) => {
            const val = event.currentTarget.checked;
            setAllChecked(val);
            onCheckAll(val);
          }}
        />
        <TextBox
          isMobile={isMobileMemo}
          styleOverrides={{ width: "90px", minWidth: "90px" }}
        >
          주문일
        </TextBox>
        <TextBox
          isMobile={isMobileMemo}
          styleOverrides={{ width: "60px", minWidth: "60px" }}
        >
          판매처
        </TextBox>
        <TextBox
          isMobile={isMobileMemo}
          styleOverrides={{ width: "150px", minWidth: "150px" }}
        >
          주문번호
        </TextBox>
        <MarqueeOnHoverTextBox
          isMobile={isMobileMemo}
          containerStyleOverrides={{
            width: isMobileMemo ? "300px" : "calc(50% - 348px)",
          }}
          isHovered={false}
          onMouseEnter={() => {}}
          onMouseLeave={() => {}}
        >
          상품명
        </MarqueeOnHoverTextBox>
        <MarqueeOnHoverTextBox
          isMobile={isMobileMemo}
          containerStyleOverrides={{
            width: isMobileMemo ? "300px" : "calc(50% - 438px)",
          }}
          isHovered={false}
          onMouseEnter={() => {}}
          onMouseLeave={() => {}}
        >
          옵션명
        </MarqueeOnHoverTextBox>
        <TextBox
          isMobile={isMobileMemo}
          styleOverrides={{ width: "60px", minWidth: "60px" }}
        >
          판매단가
        </TextBox>
        <TextBox
          isMobile={isMobileMemo}
          styleOverrides={{ width: "60px", minWidth: "60px" }}
        >
          세일적용
        </TextBox>
        <TextBox
          isMobile={isMobileMemo}
          styleOverrides={{ width: "90px", minWidth: "90px" }}
        >
          배송비 정산
        </TextBox>
        <TextBox
          isMobile={isMobileMemo}
          styleOverrides={{ width: "30px", minWidth: "30px" }}
        >
          수량
        </TextBox>
        <TextBox
          isMobile={isMobileMemo}
          styleOverrides={{ width: "60px", minWidth: "60px" }}
        >
          주문자
        </TextBox>
        <TextBox
          isMobile={isMobileMemo}
          styleOverrides={{ width: "60px", minWidth: "60px" }}
        >
          송신자
        </TextBox>
        <div style={{ width: "16px", minWidth: "16px" }} />
      </SettlementHeader>
      <SettlementItemsBox isMobile={isMobileMemo}>
        {items.map((item, index) => {
          return (
            <SettlementItem
              key={`SettlementItem-${index}`}
              index={index}
              item={item}
              check={itemsChecked[index] ?? false}
              onItemCheck={onItemCheck}
            />
          );
        })}
      </SettlementItemsBox>
    </SettlementBox>
  );
}

export const SettlementTableMemo = React.memo(SettlementTable, (prev, next) => {
  return prev.items == next.items && prev.itemsChecked == next.itemsChecked;
});
