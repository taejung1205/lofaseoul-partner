import styled from "styled-components";
import { Link, useLocation } from "@remix-run/react";
import { useEffect, useState } from "react";

const SidebarBox = styled.div`
  width: 285px;
  height: 100%;
  background-color: black;
  overflow: hidden;
  padding-top: 35px;
  display: flex;
  flex-flow: column;
`;

const NormalSidebarButton = styled.button`
  background-color: transparent;
  border: none;
  color: #ffffff80;
  margin-bottom: 40px;
  font-size: 23px;
  font-weight: 700;
  line-height: 1;
  text-align: left;
  padding-left: 20px;
  cursor: pointer;
`;

const SelectedSidebarButton = styled(NormalSidebarButton)`
  color: white;
`;

type Pathname =
  | null
  | "alert"
  | "dashboard"
  | "delayed-order"
  | "order-share"
  | "partner-list"
  | "settlement-manage"
  | "settlement-share"
  | "shipped-list"
  | "stock-request";

export function AdminSidebar() {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState<Pathname>(null);

  function SidebarButton({
    name,
    pathname,
  }: {
    name: string;
    pathname: Pathname;
  }) {
    if (currentPage === pathname) {
      return <SelectedSidebarButton>{name}</SelectedSidebarButton>;
    } else {
      return (
        <Link
          to={`/admin/${pathname}`}
          style={{ display: "flex", textDecoration: "none"}}
        >
          <NormalSidebarButton>{name}</NormalSidebarButton>
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
        setCurrentPage("settlement-manage");
        break;

      case "/admin/settlement-share":
        setCurrentPage("settlement-share");
        break;

      case "/admin/shipped-list":
        setCurrentPage("shipped-list");
        break;

      case "/admin/stock-request":
        setCurrentPage("stock-request");
        break;
    }
  }, [location.pathname]);
  return (
    <SidebarBox>
      <SidebarButton name="대쉬보드" pathname="dashboard" />
      <SidebarButton name="계약 업체 목록" pathname="partner-list" />
      <SidebarButton name="주문서 공유" pathname="order-share" />
      <SidebarButton name="온라인배송완료내역" pathname="shipped-list" />
      <SidebarButton name="출고 지연주문건" pathname="delayed-order" />
      <SidebarButton name="정산내역 공유" pathname="settlement-share" />
      <SidebarButton name="정산내역 관리" pathname="settlement-manage" />
      <SidebarButton name="재고 요청" pathname="stock-request" />
      <SidebarButton name="긴급알림" pathname="alert" />
    </SidebarBox>
  );
}
