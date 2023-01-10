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

export function AdminHeader() {
  return (
    <HeaderBox>
      <img src="/images/icon_person.png" />
      <div style={{ width: "10px" }} />
      ADMIN
    </HeaderBox>
  );
}

export function PartnerHeader({ username }: { username: string }) {
  return (
    <HeaderBox>
      <img src="/images/icon_person.png" />
      <div style={{ width: "10px" }} />
      {username}
    </HeaderBox>
  );
}
