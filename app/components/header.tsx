import styled from "styled-components";

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
