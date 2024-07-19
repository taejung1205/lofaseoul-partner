import styled from "styled-components";
import { AdminSidebar, PartnerSidebar } from "./sidebar";

export const HeaderBox = styled.div`
  width: inherit;
  height: 75px;
  background-color: #ebebeb;
  padding-top: 23px;
  padding-bottom: 23px;
  padding-right: 40px;
  display: flex;
  justify-content: right;
  font-size: 20px;
  font-weight: 700;
  line-height: 29px;
`;

export const MobileHeaderBox = styled(HeaderBox)`
  padding-top: 10px;
  padding-bottom: 10px;
  padding-left: 10px;
  padding-right: 10px;
  font-size: 16px;
  height: 50px;
  justify-content: space-between;
`;

export function AdminHeader({ onLogoutClick }: { onLogoutClick: () => void }) {
  return (
    <HeaderBox>
      <div
        style={{
          color: "#00000080",
          fontSize: "15px",
          cursor: "pointer",
        }}
        onClick={onLogoutClick}
      >
        로그아웃
      </div>
      <div style={{ width: "10px" }} />
      <img src="/images/icon_person.svg" />
      <div style={{ width: "10px" }} />
      ADMIN
    </HeaderBox>
  );
}

export function MobileAdminHeader({
  onLogoutClick,
  isSidebarOpen,
  onSidebarOpen,
  onSidebarClose,
}: {
  onLogoutClick: () => void;
  isSidebarOpen: boolean;
  onSidebarOpen: () => void;
  onSidebarClose: () => void;
}) {
  return (
    <>
      {isSidebarOpen ? (
        <AdminSidebar isMobile onSidebarClose={onSidebarClose} />
      ) : (
        <></>
      )}

      <MobileHeaderBox>
        <div>
          <img
            src="/images/icon_menu.svg"
            width={30}
            height={30}
            onClick={onSidebarOpen}
            style={{ cursor: "pointer" }}
          />
        </div>
        <div
          style={{
            display: "flex",
          }}
        >
          <div
            style={{
              color: "#00000080",
              fontSize: "15px",
              cursor: "pointer",
            }}
            onClick={onLogoutClick}
          >
            로그아웃
          </div>
          <div style={{ width: "10px" }} />
          <img src="/images/icon_person.svg" width={30} height={30} />
          <div style={{ width: "10px" }} />
          ADMIN
        </div>
      </MobileHeaderBox>
    </>
  );
}

export function PartnerHeader({
  username,
  onLogoutClick,
}: {
  username: string;
  onLogoutClick: () => void;
}) {
  return (
    <HeaderBox>
      <div
        style={{
          color: "#00000080",
          fontSize: "15px",
          cursor: "pointer",
        }}
        onClick={onLogoutClick}
      >
        로그아웃
      </div>
      <div style={{ width: "10px" }} />
      <img src="/images/icon_person.svg" />
      <div style={{ width: "10px" }} />
      {username}
    </HeaderBox>
  );
}

export function MobilePartnerHeader({
  username,
  onLogoutClick,
  isSidebarOpen,
  onSidebarOpen,
  onSidebarClose,
}: {
  username: string;
  onLogoutClick: () => void;
  isSidebarOpen: boolean;
  onSidebarOpen: () => void;
  onSidebarClose: () => void;
}) {
  return (
    <>
      {isSidebarOpen ? (
        <PartnerSidebar isMobile onSidebarClose={onSidebarClose} />
      ) : (
        <></>
      )}
      <MobileHeaderBox>
        <div>
          <img
            src="/images/icon_menu.svg"
            width={30}
            height={30}
            onClick={onSidebarOpen}
            style={{ cursor: "pointer" }}
          />
        </div>
        <div style={{ display: "flex" }}>
          <div
            style={{
              color: "#00000080",
              fontSize: "15px",
              cursor: "pointer",
            }}
            onClick={onLogoutClick}
          >
            로그아웃
          </div>
          <div style={{ width: "10px" }} />
          <img src="/images/icon_person.svg" />
          <div style={{ width: "10px" }} />
          {username}
        </div>
      </MobileHeaderBox>
    </>
  );
}
