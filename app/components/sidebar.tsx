import { Link, useLocation } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useViewportSize } from "@mantine/hooks";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  isMobile?: boolean;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  screenHeight: number;
  isSelected: boolean;
}

export function SidebarBox({ isMobile, children, ...props }: Props) {
  const boxStyles: React.CSSProperties = {
    width: "285px",
    minWidth: "285px",
    height: "100%",
    backgroundColor: "black",
    overflow: "hidden",
    paddingTop: isMobile ? "0px" : "20px",
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

export function SidebarButton({
  screenHeight,
  children,
  isSelected,
  ...props
}: ButtonProps) {
  const buttonStyles: React.CSSProperties = {
    backgroundColor: "transparent",
    border: "none",
    color: isSelected ? "white" : "#ffffff80",
    marginTop: screenHeight < 700 ? "7px" : "12px",
    marginBottom: screenHeight < 700 ? "7px" : "12px",
    fontSize: screenHeight < 700 ? "16px" : "20px",
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

export function SubcategoryButton({
  screenHeight,
  children,
  isSelected,
  ...props
}: ButtonProps) {
  const buttonStyles: React.CSSProperties = {
    backgroundColor: "transparent",
    border: "none",
    color: isSelected ? "white" : "#ffffff80",
    marginBottom: screenHeight < 700 ? "6px" : "8px",
    marginTop: screenHeight < 700 ? "6px" : "8px",
    marginLeft: "30px",
    fontSize: screenHeight < 700 ? "12px" : "16px",
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
  | "order-edit-exchange-refund"
  | "order-edit-discount"
  | "revenue-file-upload"
  | "revenue-calculate"
  | "revenue-chart"
  | "revenue-db"
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
  const [isOrderEditOpen, setIsOrderEditOpen] = useState<boolean>(false);
  const [isRevenueStatOpen, setIsRevenueStatOpen] = useState<boolean>(false);

  function MenuButton({
    name,
    pathname,
  }: {
    name: string;
    pathname: AdminPathname;
  }) {
    const isSelected = pathname == currentPage;
    return (
      <Link
        to={`/admin/${pathname}`}
        style={{
          display: "flex",
          textDecoration: "none",
          pointerEvents: isSelected ? "none" : "inherit",
        }}
      >
        <SidebarButton
          screenHeight={viewportSize.height}
          isSelected={isSelected}
        >
          {name}
        </SidebarButton>
      </Link>
    );
  }

  function SubcategoryMenuButton({
    name,
    pathname,
  }: {
    name: string;
    pathname: AdminPathname;
  }) {
    const isSelected = pathname == currentPage;
    return (
      <Link
        to={`/admin/${pathname}`}
        style={{
          display: "flex",
          textDecoration: "none",
          pointerEvents: isSelected ? "none" : "inherit",
        }}
      >
        <SubcategoryButton
          screenHeight={viewportSize.height}
          isSelected={isSelected}
        >
          {name}
        </SubcategoryButton>
      </Link>
    );
  }

  function Category({
    name,
    isCategoryOpen,
    onClick,
    children,
  }: {
    name: string;
    isCategoryOpen: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) {
    return (
      <>
        <SidebarButton
          screenHeight={viewportSize.height}
          isSelected={false}
          onClick={onClick}
        >
          {name}
        </SidebarButton>
        {isCategoryOpen ? children : <></>}
      </>
    );
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

      case "/admin/order-edit-exchange-refund":
        setCurrentPage("order-edit-exchange-refund");
        break;

      case "/admin/order-edit-discount":
        setCurrentPage("order-edit-discount");
        break;

      case "/admin/revenue-calculate":
        setCurrentPage("revenue-calculate");
        break;

      case "/admin/revenue-chart":
        setCurrentPage("revenue-chart");
        break;

      case "/admin/revenue-db":
        setCurrentPage("revenue-db");
        break;

      case "/admin/revenue-file-upload":
        setCurrentPage("revenue-file-upload");
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
      <MenuButton name="대쉬보드" pathname="dashboard" />
      <MenuButton name="계약 업체 목록" pathname="partner-list" />
      <MenuButton name="판매처 수수료 관리" pathname="seller-manage" />
      <MenuButton name="주문서 공유" pathname="order-share" />
      <MenuButton name="주문서 조회" pathname="order-list" />
      <MenuButton name="온라인배송완료내역" pathname="shipped-list" />
      <MenuButton name="출고 지연주문건" pathname="delayed-order" />
      <MenuButton name="정산내역 공유" pathname="settlement-share" />
      <MenuButton name="정산내역 관리" pathname="settlement-manage" />
      <MenuButton name="상품등록 관리" pathname="product-manage" />
      <MenuButton name="발신함 / 수신함" pathname="alert" />
      <Category
        name="• 주문서 수정"
        onClick={() => {
          setIsOrderEditOpen(!isOrderEditOpen);
        }}
        isCategoryOpen={
          currentPage == "order-edit-exchange-refund" ||
          currentPage == "order-edit-discount"
            ? true
            : isOrderEditOpen
        }
      >
        <SubcategoryMenuButton
          name="교환/환불내역 관리"
          pathname="order-edit-exchange-refund"
        />
        <SubcategoryMenuButton
          name="할인내역 관리"
          pathname="order-edit-discount"
        />
      </Category>
      <Category
        name="• 수익통계"
        onClick={() => {
          setIsRevenueStatOpen(!isRevenueStatOpen);
        }}
        isCategoryOpen={
          currentPage == "revenue-file-upload" ||
          currentPage == "revenue-calculate" ||
          currentPage == "revenue-chart" ||
          currentPage == "revenue-db"
            ? true
            : isRevenueStatOpen
        }
      >
        <SubcategoryMenuButton
          name="통계용 파일 업로드"
          pathname="revenue-file-upload"
        />
        <SubcategoryMenuButton
          name="수익금 계산"
          pathname="revenue-calculate"
        />
        <SubcategoryMenuButton name="통계차트조회" pathname="revenue-chart" />
        <SubcategoryMenuButton name="정산통계 DB" pathname="revenue-db" />
      </Category>
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

  function MenuButton({
    name,
    pathname,
  }: {
    name: string;
    pathname: PartnerPathname;
  }) {
    const isSelected = pathname == currentPage;
    return (
      <Link
        to={`/admin/${pathname}`}
        style={{
          display: "flex",
          textDecoration: "none",
          pointerEvents: isSelected ? "none" : "inherit",
        }}
      >
        <SidebarButton
          screenHeight={viewportSize.height}
          isSelected={isSelected}
        >
          {name}
        </SidebarButton>
      </Link>
    );
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
      <MenuButton name="대쉬보드" pathname="dashboard" />
      <MenuButton name="내 계약 정보" pathname="my-info" />
      <MenuButton name="운송장 공유" pathname="waybill-share" />
      <MenuButton name="온라인배송완료내역" pathname="shipped-list" />
      <MenuButton name="출고 지연주문건" pathname="delayed-order" />
      <MenuButton name="정산내역" pathname="settlement-list" />
      <MenuButton name="상품 관리" pathname="product-manage" />
      <MenuButton name="발신함 / 수신함" pathname="alert" />
    </SidebarBox>
  );
}
