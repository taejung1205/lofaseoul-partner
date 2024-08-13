import { LoadingOverlay, Space } from "@mantine/core";
import { useNavigation } from "@remix-run/react";
import { useEffect, useState } from "react";
import { PageLayout } from "~/components/page_layout";
import dayPickerStyles from "react-day-picker/dist/style.css";
import { DaySelectPopover } from "~/components/date";
import { getTimezoneDate } from "~/utils/date";
import { SellerSelect } from "~/components/seller";

function EditInputBox({
  width,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const inputStyles: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 700,
    width: width ?? "200px",
    height: "40px",
    border: "3px black solid",
  };
  return <input style={inputStyles} {...props} />;
}

export function links() {
  return [{ rel: "stylesheet", href: dayPickerStyles }];
}

export default function Page() {
  const navigation = useNavigation();
  const [startDate, setStartDate] = useState<Date>(); //주문일 시작
  const [endDate, setEndDate] = useState<Date>(); //주문일 종료
  const [seller, setSeller] = useState<string>("all"); // 판매처
  const [partnerName, setPartnerName] = useState<string>(""); // 공급처
  const [productName, setProductName] = useState<string>(""); //상품명
  const [cs, setCs] = useState<string>(""); //CS
  const [orderStatus, setOrderStatus] = useState<string>(""); //상태
  const [filterDiscount, setFilterDiscount] = useState<string>(""); //할인여부

  //날짜 수신
  useEffect(() => {
    setStartDate(getTimezoneDate(new Date()));
    setEndDate(getTimezoneDate(new Date()));
  }, []);

  return (
    <PageLayout>
      <LoadingOverlay visible={navigation.state == "loading"} overlayBlur={2} />
      <div style={{ display: "flex" }}>
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <div>주문일</div>
          <Space w={10} />
          <DaySelectPopover
            selectedDate={startDate}
            setSelectedDate={setStartDate}
          />
          <Space w={5} />
          <div>~</div>
          <Space w={5} />
          <DaySelectPopover
            selectedDate={endDate}
            setSelectedDate={setEndDate}
          />
        </div>
        <Space w={30} />
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <div>공급처</div>
          <Space w={10} />
          <EditInputBox
            type="text"
            name="partnerName"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            required
          />
        </div>
        <Space w={30} />
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <div>판매처</div>
          <Space w={10} />
          <SellerSelect seller={seller} setSeller={setSeller} />
        </div>
      </div>
      <Space h={20} />
      <div style={{ display: "flex" }}>
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <div>상품명</div>
          <Space w={10} />
          <EditInputBox
            type="text"
            name="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            width={"303px"}
            required
          />
        </div>
        <Space w={30} />
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <div>상태</div>
          <Space w={10} />
          <EditInputBox
            type="text"
            name="orderStatus"
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value)}
            width={"150px"}
            required
          />
        </div>
        <Space w={30} />
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <div>CS</div>
          <Space w={10} />
          <EditInputBox
            type="text"
            name="cs"
            value={cs}
            onChange={(e) => setCs(e.target.value)}
            width={"150px"}
            required
          />
        </div>
        <Space w={30} />
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <div>할인여부</div>
          <Space w={10} />
          <EditInputBox
            type="text"
            name="filterDiscount"
            value={filterDiscount}
            onChange={(e) => setFilterDiscount(e.target.value)}
            width={"150px"}
            required
          />
        </div>
      </div>
    </PageLayout>
  );
}
