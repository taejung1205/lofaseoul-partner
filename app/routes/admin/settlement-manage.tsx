import { json, LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { BlackButton, GetListButton } from "~/components/button";
import {
  MonthSelectPopover,
  dateToKoreanMonth,
  dateToNumeralMonth,
  numeralMonthToKorean,
  getTimezoneDate,
} from "~/components/date";
import { PageLayout } from "~/components/page_layout";
import { SellerSelect } from "~/components/seller";
import {
  getAllSellerSettlementSum,
  SettlementSumBar,
  SettlementSumItem,
  SettlementSumTable,
} from "~/components/settlement_sum";
import { getAllSettlementSum } from "~/services/firebase.server";
import writeXlsxFile from "write-excel-file";

const EmptySettlementBox = styled.div`
  display: flex;
  text-align: center;
  font-size: 24px;
  height: 100px;
  align-items: center;
  justify-content: center;
  width: inherit;
`;

const DownloadButton = styled(GetListButton)`
width: 200px;
`;

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const month = url.searchParams.get("month");

  if (month !== null) {
    const monthStr = numeralMonthToKorean(month);
    const sums = await getAllSettlementSum({
      monthStr: monthStr,
    });
    return json({ sums: sums, month: month });
  } else {
    return null;
  }
};

export default function AdminSettlementManage() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>();
  const [seller, setSeller] = useState<string>("all");
  const loaderData = useLoaderData();

  const selectedMonthNumeral = useMemo(
    () => dateToNumeralMonth(selectedDate ?? new Date()),
    [selectedDate]
  );

  const sums: SettlementSumItem[] = useMemo(() => {
    if (loaderData == null) {
      return null;
    } else {
      return loaderData.sums;
    }
  }, [loaderData]);

  const totalSum = useMemo(() => {
    if (sums == null) {
      return null;
    } else {
      let settlementSum = 0;
      let shippingSum = 0;
      if (seller == "all") {
        sums.forEach((item) => {
          const sum = getAllSellerSettlementSum(item.data);
          settlementSum += sum.settlement;
          shippingSum += sum.shippingFee;
        });
      } else {
        sums.forEach((item) => {
          settlementSum += item.data[`settlement_${seller}`];
          shippingSum += item.data[`shipping_${seller}`];
        });
      }
      return {
        settlement: settlementSum,
        shippingFee: shippingSum,
      };
    }
  }, [sums, seller]);

  useEffect(() => {
    setSelectedDate(getTimezoneDate(new Date()));
  }, []);

  useEffect(() => {
    if (selectedDate !== undefined) {
      setSelectedMonthStr(dateToKoreanMonth(selectedDate));
    }
  }, [selectedDate]);

  async function writeExcel(sumItems: SettlementSumItem[]) {
    const copy = sumItems.map((item) => item);
    const totalSumItem: SettlementSumItem = {
      partnerName: "합계",
      data: totalSum,
      brn: "",
      bankAccount: ""
    }
    copy.push(totalSumItem)
    await writeXlsxFile(copy, {
      schema,
      headerStyle: {
        fontWeight: "bold",
        align: "center",
      },
      fileName: `정산합계_${loaderData.month}.xlsx`,
      fontFamily: "맑은 고딕",
      fontSize: 10,

    });
  }

  return (
    <PageLayout>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "inherit",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/images/icon_calendar.svg" />
          <MonthSelectPopover
            onLeftClick={() =>
              setSelectedDate(
                new Date(selectedDate!.setMonth(selectedDate!.getMonth() - 1))
              )
            }
            onRightClick={() =>
              setSelectedDate(
                new Date(selectedDate!.setMonth(selectedDate!.getMonth() + 1))
              )
            }
            monthStr={selectedMonthStr ?? ""}
          />
          <Link to={`/admin/settlement-manage?month=${selectedMonthNumeral}`}>
            <GetListButton>조회하기</GetListButton>
          </Link>
          {sums == null || sums.length == 0 ? <></> :
            <DownloadButton onClick={async () => {
              await writeExcel(sums);
            }
            }>엑셀 다운로드</DownloadButton>}
        </div>

        <SellerSelect seller={seller} setSeller={setSeller} />
      </div>
      <div style={{ height: "20px" }} />
      {sums == null ? (
        <EmptySettlementBox
          style={{
            display: "flex",
            textAlign: "center",
            fontSize: "30px",
            height: "100px",
            alignItems: "center",
            justifyContent: "center",
            width: "inherit",
          }}
        >
          조회하기 버튼을 클릭하여 정산내역을 확인할 수 있습니다.
        </EmptySettlementBox>
      ) : sums.length > 0 ? (
        <SettlementSumTable
          items={sums}
          seller={seller}
          monthNumeral={loaderData.month}
        />
      ) : (
        <EmptySettlementBox
          style={{
            display: "flex",
            textAlign: "center",
            fontSize: "30px",
            height: "100px",
            alignItems: "center",
            justifyContent: "center",
            width: "inherit",
          }}
        >
          공유된 정산내역이 없습니다.
        </EmptySettlementBox>
      )}
      {sums !== null && sums.length > 0 && totalSum !== null ? (
        <>
          <div style={{ height: "40px" }} />
          <SettlementSumBar
            seller={seller ?? "all"}
            settlement={totalSum?.settlement}
            shippingFee={totalSum?.shippingFee}
          />
        </>
      ) : (
        <></>
      )}
    </PageLayout>
  );
}

const schema = [
  {
    column: "업체명",
    type: String,
    value: (item: SettlementSumItem) => item.partnerName,
    width: 30,
    wrap: true,
  },
  {
    column: "사업자등록번호",
    type: String,
    value: (item: SettlementSumItem) => item.brn,
    width: 30,
    wrap: true,
  },
  {
    column: "계좌번호",
    type: String,
    value: (item: SettlementSumItem) => item.bankAccount,
    width: 30,
    wrap: true,
  },
  {
    column: "정산금액",
    type: Number,
    value: (item: SettlementSumItem) => {
      if (item.partnerName == "합계") {
        return item.data.settlement;
      } else {
        const sum = getAllSellerSettlementSum(item.data);
        return sum.settlement;
      }
    },
    width: 30,
  },
  {
    column: "배송비 별도 정산",
    type: Number,
    value: (item: SettlementSumItem) => {
      if (item.partnerName == "합계") {
        return item.data.shippingFee;
      } else {
        const sum = getAllSellerSettlementSum(item.data);
        return sum.shippingFee;
      }
    },
    width: 30,
  },
  {
    column: "최종 정산 금액",
    type: Number,
    value: (item: SettlementSumItem) => {
      if (item.partnerName == "합계") {
        return item.data.shippingFee + item.data.settlement;
      } else {
        const sum = getAllSellerSettlementSum(item.data);
        return sum.shippingFee + sum.settlement
      }
    },
    width: 30,
  }
];
