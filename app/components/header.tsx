import { AdminSidebar, PartnerSidebar } from "./sidebar";

export function HeaderBox({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const defaultStyles: React.CSSProperties = {
    width: "inherit",
    height: "75px",
    backgroundColor: "#ebebeb",
    paddingTop: "23px",
    paddingBottom: "23px",
    paddingRight: "40px",
    display: "flex",
    justifyContent: "flex-end", // Use `flex-end` to align content to the right
    fontSize: "20px",
    fontWeight: 700,
    lineHeight: "29px",
  };

  return (
    <div style={defaultStyles} {...props}>
      {children}
    </div>
  );
}

export function MobileHeaderBox({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const defaultStyles: React.CSSProperties = {
    width: "inherit",
    height: "75px",
    backgroundColor: "#ebebeb",
    paddingTop: "10px",
    paddingBottom: "10px",
    paddingLeft: "10px",
    paddingRight: "10px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "16px",
    fontWeight: 700,
  };

  return (
    <div style={defaultStyles} {...props}>
      {children}
    </div>
  );
}

export function AdminHeader({
  onLogoutClick,
  isStaff,
}: {
  onLogoutClick: () => void;
  isStaff: boolean;
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
      {isStaff ? "STAFF" : "ADMIN"}
    </HeaderBox>
  );
}

export function MobileAdminHeader({
  onLogoutClick,
  isSidebarOpen,
  onSidebarOpen,
  onSidebarClose,
  isStaff,
}: {
  onLogoutClick: () => void;
  isSidebarOpen: boolean;
  onSidebarOpen: () => void;
  onSidebarClose: () => void;
  isStaff: boolean;
}) {
  return (
    <>
      {isSidebarOpen ? (
        <AdminSidebar
          isMobile
          onSidebarClose={onSidebarClose}
          isStaff={isStaff}
        />
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
            alignItems: "center",
          }}
        >
          <div
            style={{
              color: "#00000080",
              fontSize: "15px",
              cursor: "pointer",
              lineHeight: "40px",
            }}
            onClick={onLogoutClick}
          >
            로그아웃
          </div>
          <div style={{ width: "10px" }} />
          <img src="/images/icon_person.svg" width={30} height={30} />
          <div style={{ width: "10px" }} />
          {isStaff ? "STAFF" : "ADMIN"}
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
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              color: "#00000080",
              fontSize: "15px",
              cursor: "pointer",
              display: "flex",
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
