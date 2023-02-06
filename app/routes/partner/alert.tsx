import { ActionFunction, json, redirect } from "@remix-run/node";
import {
  Link,
  useActionData,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderFunction } from "react-router-dom";
import styled from "styled-components";
import { GetListButton } from "~/components/button";
import {
  dateToKoreanMonth,
  koreanMonthToDate,
  MonthSelectPopover,
} from "~/components/date";
import { BasicModal, ModalButton } from "~/components/modal";
import { NoticeItem, PartnerNotice } from "~/components/notice";
import { PageLayout } from "~/components/page_layout";
import { getSharedNotices, replyNotice } from "~/services/firebase.server";
import { requireUser } from "~/services/session.server";

const EmptyNoticeBox = styled.div`
  display: flex;
  text-align: center;
  font-size: 24px;
  height: 100px;
  align-items: center;
  justify-content: center;
  width: inherit;
`;

export const loader: LoaderFunction = async ({ request }) => {
  let partnerName: string;
  const user = await requireUser(request);
  if (user !== null) {
    partnerName = user.uid;
  } else {
    return redirect("/logout");
  }

  const url = new URL(request.url);
  const month = url.searchParams.get("month");

  if (month !== null) {
    const notices = await getSharedNotices({
      monthStr: month,
      partnerName: partnerName,
    });
    return json({ monthStr: month, notices: notices });
  } else {
    const todayMonth = dateToKoreanMonth(new Date());
    const notices = await getSharedNotices({
      monthStr: todayMonth,
      partnerName: partnerName,
    });
    // console.log(notices);
    return json({ monthStr: todayMonth, notices: notices });
  }
};

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const actionType = body.get("action")?.toString();
  if (actionType == "reply") {
    const id = body.get("id")?.toString();
    const month = body.get("month")?.toString();
    const reply = body.get("reply")?.toString();
    if (id !== undefined && month !== undefined && reply !== undefined) {
      const result = await replyNotice({
        monthStr: month,
        id: id,
        reply: reply,
      });
      if (result == true) {
        return json({ message: `답신이 완료되었습니다.` });
      } else {
        return json({
          message: `답신 과정 중 문제가 발생했습니다.${"\n"}${result}`,
        });
      }
    }
  }
  return null;
};

export default function AdminAlert() {
  const [selectedDate, setSelectedDate] = useState<Date>(); // 선택중인 날짜 (현재 조회된 월이 아닌, MonthSelectPopover로 선택중인 날짜)
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>(); //선택중인 날짜의 string (XX년 XX월)
  const [partnerName, setPartnerName] = useState<string>(""); //파트너명 (조회된 파트너명으로 시작, 입력창으로 수정 및 조회)

  const [noticeModalStr, setNoticeModalStr] = useState<string>(""); //안내 모달창에서 뜨는 메세지
  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);

  const formRef = useRef<HTMLFormElement>(null);
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();

  useEffect(() => {
    if (monthStr !== null) {
      setSelectedDate(koreanMonthToDate(monthStr));
    } else {
      setSelectedDate(new Date());
    }
  }, []);

  useEffect(() => {
    if (selectedDate !== undefined) {
      setSelectedMonthStr(dateToKoreanMonth(selectedDate));
    }
  }, [selectedDate]);

  useEffect(() => {
    if (actionData !== undefined && actionData !== null) {
      setNoticeModalStr(actionData.message);
      setIsNoticeModalOpened(true);
    }
  }, [actionData]);

  //loaderData에서 불러온, 현재 조회한 월의 string(XX년 XX월)
  const monthStr: string = useMemo(() => {
    if (loaderData.error !== undefined) {
      return null;
    } else {
      return loaderData.monthStr;
    }
  }, [loaderData]);

  return (
    <>
      {/* 안내용 모달 */}
      <BasicModal
        opened={isNoticeModalOpened}
        onClose={() => setIsNoticeModalOpened(false)}
      >
        <div
          style={{
            justifyContent: "center",
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          {noticeModalStr}
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsNoticeModalOpened(false)}>
              확인
            </ModalButton>
          </div>
        </div>
      </BasicModal>

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
            <Link to={`/partner/alert?month=${selectedMonthStr}`}>
              <GetListButton>조회하기</GetListButton>
            </Link>
          </div>
        </div>
        <div style={{ height: "20px" }} />
        {loaderData.notices != undefined && loaderData.notices.length > 0 ? (
          <>
            {UnrepliedNoticeItems(loaderData.notices, monthStr)}
            <div
              style={{
                backgroundColor: "#D9D9D9",
                padding: "10px",
                paddingLeft: "20px",
                marginTop: "40px",
                width: "inherit",
                textAlign: "left",
              }}
            >
              회신한 일람
            </div>
            {RepliedNoticeItems(loaderData.notices, monthStr)}
          </>
        ) : (
          <EmptyNoticeBox
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
            공유된 알림이 없습니다.
          </EmptyNoticeBox>
        )}

        <div style={{ minHeight: "70px" }} />
      </PageLayout>
    </>
  );
}

function UnrepliedNoticeItems(noticeItems: NoticeItem[], monthStr: string) {
  return noticeItems.map((item: NoticeItem, index: number) => {
    const replies = item.replies;
    if (replies.length > 0) {
      return null;
    } else {
      return (
        <PartnerNotice
          noticeItem={item}
          key={`NoticeItem_${index}`}
          monthStr={monthStr}
        />
      );
    }
  });
}

function RepliedNoticeItems(noticeItems: NoticeItem[], monthStr: string) {
  return noticeItems.map((item: NoticeItem, index: number) => {
    const replies = item.replies;
    if (replies.length == 0) {
      return null;
    } else {
      return (
        <PartnerNotice
          noticeItem={item}
          key={`NoticeItem_${index}`}
          monthStr={monthStr}
        />
      );
    }
  });
}
