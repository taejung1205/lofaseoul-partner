import { Link, useLocation } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useViewportSize } from "@mantine/hooks";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  isMobile?: boolean;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  screenHeight: number;
}

export function SidebarBox({ isMobile, children, ...props }: Props) {
  const boxStyles: React.CSSProperties = {
    width: "285px",
    minWidth: "285px",
    height: "100%",
    backgroundColor: "black",
    overflow: "hidden",
    paddingTop: isMobile ? "0px" : "35px",
    display: "flex",
    flexFlow: "column",
    position: isMobile ? "fixed" : "relative",
    zIndex: 10,
  };

  return (
    <div style={boxStyles} {...props}>
      {children}
    </div>
  );
}

export function NormalSidebarButton({
  screenHeight,
  children,
  ...props
}: ButtonProps) {
  const buttonStyles: React.CSSProperties = {
    backgroundColor: "transparent",
    border: "none",
    color: "#ffffff80",
    marginBottom: screenHeight < 700 ? "25px" : "40px",
    fontSize: screenHeight < 700 ? "20px" : "23px",
    fontWeight: 700,
    lineHeight: 1,
    textAlign: "left",
    paddingLeft: "20px",
    cursor: "pointer",
  };

  return (
    <button style={buttonStyles} {...props}>
      {children}
    </button>
  );
}

export function SelectedSidebarButton({
  screenHeight,
  children,
  ...props
}: ButtonProps) {
  const buttonStyles: React.CSSProperties = {
    backgroundColor: "transparent",
    border: "none",
    color: "white",
    marginBottom: screenHeight < 700 ? "25px" : "40px",
    fontSize: screenHeight < 700 ? "20px" : "23px",
    fontWeight: 700,
    lineHeight: 1,
    textAlign: "left",
    paddingLeft: "20px",
    cursor: "pointer",
  };

  return (
    <button style={buttonStyles} {...props}>
      {children}
    </button>
  );
}

type AdminPathname =
  | null
  | "alert"
  | "dashboard"
  | "delayed-order"
  | "order-share"
  | "order-list"
  | "partner-list"
  | "settlement-manage"
  | "settlement-share"
  | "shipped-list"
  | "product-manage"
  | "seller-manage";

type PartnerPathname =
  | null
  | "alert"
  | "dashboard"
  | "delayed-order"
  | "waybill-share"
  | "my-info"
  | "settlement-list"
  | "shipped-list"
  | "product-manage";

export function AdminSidebar({
  isMobile = false,
  onSidebarClose,
}: {
  isMobile?: boolean;
  onSidebarClose?: () => void;
}) {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState<AdminPathname>(null);
  const viewportSize = useViewportSize();

  function SidebarButton({
    name,
    pathname,
  }: {
    name: string;
    pathname: AdminPathname;
  }) {
    if (currentPage === pathname) {
      return (
        <SelectedSidebarButton screenHeight={viewportSize.height}>
          {name}
        </SelectedSidebarButton>
      );
    } else {
      return (
        <Link
          to={`/admin/${pathname}`}
          style={{ display: "flex", textDecoration: "none" }}
        >
          <NormalSidebarButton screenHeight={viewportSize.height}>
            {name}
          </NormalSidebarButton>
        </Link>
      );
    }
  }
  useEffect(() => {
    switch (location.pathname) {
      case "/admin/dashboard":
        setCurrentPage("dashboard");
        break;

      case "/admin/alert":
        setCurrentPage("alert");
        break;

      case "/admin/delayed-order":
        setCurrentPage("delayed-order");
        break;

      case "/admin/order-share":
        setCurrentPage("order-share");
        break;

      case "/admin/partner-list":
        setCurrentPage("partner-list");
        break;

      case "/admin/settlement-manage":
      case "/admin/settlement-manage-detail":
        setCurrentPage("settlement-manage");
        break;

      case "/admin/settlement-share":
        setCurrentPage("settlement-share");
        break;

      case "/admin/shipped-list":
        setCurrentPage("shipped-list");
        break;

      case "/admin/order-list":
        setCurrentPage("order-list");
        break;

      case "/admin/product-manage":
        setCurrentPage("product-manage");
        break;
      
      case "/admin/seller-manage":
        setCurrentPage("seller-manage");
        break;
    }
  }, [location.pathname]);
  return (
    <SidebarBox isMobile={isMobile}>
      {isMobile ? (
        <img
          src="/images/icon_x_white.svg"
          width={25}
          height={25}
          onClick={onSidebarClose}
          style={{ cursor: "pointer", margin: "15px", marginBottom: "40px" }}
        />
      ) : (
        <></>
      )}
      <SidebarButton name="대쉬보드" pathname="dashboard" />
      <SidebarButton name="계약 업체 목록" pathname="partner-list" />
      <SidebarButton name="주문서 공유" pathname="order-share" />
      <SidebarButton name="주문서 조회" pathname="order-list" />
      <SidebarButton name="온라인배송완료내역" pathname="shipped-list" />
      <SidebarButton name="출고 지연주문건" pathname="delayed-order" />
      <SidebarButton name="정산내역 공유" pathname="settlement-share" />
      <SidebarButton name="정산내역 관리" pathname="settlement-manage" />
      <SidebarButton name="상품등록 관리 (WIP)" pathname="product-manage" />
      <SidebarButton name="발신함 / 수신함" pathname="alert" />
    </SidebarBox>
  );
}

export function PartnerSidebar({
  isMobile = false,
  onSidebarClose,
}: {
  isMobile?: boolean;
  onSidebarClose?: () => void;
}) {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState<PartnerPathname>(null);
  const viewportSize = useViewportSize();

  function SidebarButton({
    name,
    pathname,
  }: {
    name: string;
    pathname: PartnerPathname;
  }) {
    if (currentPage === pathname) {
      return (
        <SelectedSidebarButton screenHeight={viewportSize.height}>
          {name}
        </SelectedSidebarButton>
      );
    } else {
      return (
        <Link
          to={`/partner/${pathname}`}
          style={{ display: "flex", textDecoration: "none" }}
        >
          <NormalSidebarButton screenHeight={viewportSize.height}>
            {name}
          </NormalSidebarButton>
        </Link>
      );
    }
  }
  useEffect(() => {
    switch (location.pathname) {
      case "/partner/dashboard":
        setCurrentPage("dashboard");
        break;

      case "/partner/alert":
        setCurrentPage("alert");
        break;

      case "/partner/delayed-order":
        setCurrentPage("delayed-order");
        break;

      case "/partner/waybill-share":
        setCurrentPage("waybill-share");
        break;

      case "/partner/my-info":
        setCurrentPage("my-info");
        break;

      case "/partner/settlement-list":
        setCurrentPage("settlement-list");
        break;

      case "/partner/shipped-list":
        setCurrentPage("shipped-list");
        break;
      case "/partner/product-manage":
        setCurrentPage("product-manage");
        break;
    }
  }, [location.pathname]);
  return (
    <SidebarBox isMobile={isMobile}>
      {isMobile ? (
        <img
          src="/images/icon_x_white.svg"
          width={25}
          height={25}
          onClick={onSidebarClose}
          style={{ cursor: "pointer", margin: "15px", marginBottom: "40px" }}
        />
      ) : (
        <></>
      )}
      <SidebarButton name="대쉬보드" pathname="dashboard" />
      <SidebarButton name="내 계약 정보" pathname="my-info" />
      <SidebarButton name="운송장 공유" pathname="waybill-share" />
      <SidebarButton name="온라인배송완료내역" pathname="shipped-list" />
      <SidebarButton name="출고 지연주문건" pathname="delayed-order" />
      <SidebarButton name="정산내역" pathname="settlement-list" />
      <SidebarButton name="상품 관리 (WIP)" pathname="product-manage" />
      <SidebarButton name="발신함 / 수신함" pathname="alert" />
    </SidebarBox>
  );
}
