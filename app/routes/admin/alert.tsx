import { LoadingOverlay } from "@mantine/core";
import { ActionFunction, json } from "@remix-run/node";
import {
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
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
import { AdminNotice, NoticeItem, TopicSelect } from "~/components/notice";
import { PageLayout } from "~/components/page_layout";
import {
  addNotice,
  deleteNotice,
  editNotice,
  getNotices,
  getPartnerProfile,
  shareNotice,
} from "~/services/firebase.server";

const EmptyNoticeBox = styled.div`
  display: flex;
  text-align: center;
  font-size: 24px;
  height: 100px;
  align-items: center;
  justify-content: center;
  width: inherit;
`;

const PartnerNameInputBox = styled.input`
  width: 140px;
  height: 40px;
  border: 3px solid black;
  padding: 6px;
  text-align: left;
  font-size: 20px;
  font-weight: 700;
  margin-left: 20px;
  ::placeholder {
    color: black;
    font-weight: 700;
    opacity: 1;
  }
  :focus::placeholder {
    color: transparent;
  }
`;

const NewNoticeButton = styled.button`
  background-color: white;
  border: 3px solid black;
  font-size: 20px;
  font-weight: 700;
  width: 110px;
  line-height: 1;
  padding: 6px 6px 6px 6px;
  cursor: pointer;
`;

const EditInputBox = styled.input`
  font-size: 20px;
  font-weight: 700;
  width: 200px;
  height: 40px;
  margin: 4px;
`;

const LongEditInputBox = styled.textarea`
  font-size: 20px;
  font-weight: 700;
  width: 612px;
  margin: 4px;
`;

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const month = url.searchParams.get("month");
  const partnerName = url.searchParams.get("partner");

  if (month !== null) {
    const notices = await getNotices({
      monthStr: month,
      partnerName: partnerName ?? "",
    });
    return json({ monthStr: month, notices: notices });
  } else {
    const todayMonth = dateToKoreanMonth(new Date());
    const notices = await getNotices({
      monthStr: todayMonth,
      partnerName: partnerName ?? "",
    });
    // console.log(notices);
    return json({ monthStr: todayMonth, notices: notices });
  }
};

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const actionType = body.get("action")?.toString();
  if (actionType === "add") {
    const detail = body.get("detail")?.toString();
    const topic = body.get("topic")?.toString();
    const month = body.get("month")?.toString();
    const partnerName = body.get("partner")?.toString();
    if (
      detail !== undefined &&
      topic !== undefined &&
      month !== undefined &&
      partnerName !== undefined
    ) {
      const isPartner = await getPartnerProfile({ name: partnerName });
      if (isPartner == null) {
        return json({
          message: `유효하지 않은 파트너명입니다.${"\n"}${partnerName}`,
        });
      }
      const result = await addNotice({
        partnerName: partnerName,
        monthStr: month,
        topic: topic,
        detail: detail,
      });
      if (result == true) {
        return json({ message: `알림 생성이 완료되었습니다.` });
      } else {
        return json({
          message: `알림 생성 과정 중 문제가 발생했습니다.${"\n"}${result}`,
        });
      }
    } else {
      return json({
        message: `알림 생성 과정 중 문제가 발생했습니다. (formData)`,
      });
    }
  } else if (actionType == "delete") {
    const id = body.get("id")?.toString();
    const month = body.get("month")?.toString();
    if (id !== undefined && month !== undefined) {
      const result = await deleteNotice({ monthStr: month, id: id });
      if (result == true) {
        return json({ message: `삭제가 완료되었습니다.` });
      } else {
        return json({
          message: `삭제 과정 중 문제가 발생했습니다.${"\n"}${result}`,
        });
      }
    }
  } else if (actionType == "edit") {
    const detail = body.get("detail")?.toString();
    const topic = body.get("topic")?.toString();
    const month = body.get("month")?.toString();
    const partnerName = body.get("partner")?.toString();
    const id = body.get("id")?.toString();
    if (
      detail !== undefined &&
      topic !== undefined &&
      month !== undefined &&
      partnerName !== undefined &&
      id !== undefined
    ) {
      const isPartner = await getPartnerProfile({ name: partnerName });
      if (isPartner == null) {
        return json({
          message: `유효하지 않은 파트너명입니다.${"\n"}${partnerName}`,
        });
      }
      const result = await editNotice({
        partnerName: partnerName,
        monthStr: month,
        topic: topic,
        detail: detail,
        id: id,
      });
      if (result == true) {
        return json({ message: `알림 수정이 완료되었습니다.` });
      } else {
        return json({
          message: `알림 수정 과정 중 문제가 발생했습니다.${"\n"}${result}`,
        });
      }
    } else {
      return json({
        message: `알림 수정 과정 중 문제가 발생했습니다. (formData)`,
      });
    }
  } else if (actionType == "share") {
    const id = body.get("id")?.toString();
    const month = body.get("month")?.toString();
    const partnerName = body.get("partner")?.toString();
    const topic = body.get("topic")?.toString();
    if (
      id !== undefined &&
      month !== undefined &&
      partnerName !== undefined &&
      topic !== undefined
    ) {
      const result = await shareNotice({
        monthStr: month,
        id: id,
        partnerName: partnerName,
        topic: topic,
      });
      if (result == true) {
        return json({ message: `공유가 완료되었습니다.` });
      } else {
        return json({
          message: `공유 과정 중 문제가 발생했습니다.${"\n"}${result}`,
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

  const [isNewNoticeModalOpened, setIsNewNoticeModalOpened] =
    useState<boolean>(false);

  const [noticeModalStr, setNoticeModalStr] = useState<string>(""); //안내 모달창에서 뜨는 메세지
  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);

  const [partnerNameEdit, setPartnerNameEdit] = useState<string>("");
  const [topicEdit, setTopicEdit] = useState<string>("기타");
  const [detailEdit, setDetailEdit] = useState<string>("");

  const formRef = useRef<HTMLFormElement>(null);
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();

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
      <LoadingOverlay visible={navigation.state == "loading"} overlayBlur={2} />
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

      <BasicModal
        opened={isNewNoticeModalOpened}
        onClose={() => {
          setIsNewNoticeModalOpened(false);
        }}
      >
        <div
          style={{
            justifyContent: "center",
            textAlign: "center",
            fontWeight: "700",
            fontSize: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "110px" }}>대상 파트너</div>
            <EditInputBox
              type="text"
              name="partnerName"
              value={partnerNameEdit}
              onChange={(e) => setPartnerNameEdit(e.target.value)}
              required
            />
            <div style={{ width: "100px" }}>공유 주제</div>
            <TopicSelect topic={topicEdit} setTopic={setTopicEdit} />
          </div>
          <div style={{ height: "20px" }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "110px" }}>상세 사유</div>
            <LongEditInputBox
              name="detail"
              value={detailEdit}
              onChange={(e) => setDetailEdit(e.target.value)}
              required
            />
          </div>
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsNewNoticeModalOpened(false)}>
              취소
            </ModalButton>
            <ModalButton
              type="submit"
              onClick={async () => {
                const formData = new FormData(formRef.current ?? undefined);
                formData.set("month", monthStr);
                formData.set("partner", partnerNameEdit);
                formData.set("topic", topicEdit);
                formData.set("detail", detailEdit);
                formData.set("action", "add");
                submit(formData, { method: "post" });
                setIsNewNoticeModalOpened(false);
              }}
            >
              생성
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
            <PartnerNameInputBox
              type="text"
              name="name"
              value={partnerName}
              placeholder="파트너명"
              onChange={(e) => setPartnerName(e.target.value)}
              required
            />
            <Link
              to={
                partnerName.length > 0
                  ? `/admin/alert?month=${selectedMonthStr}&partner=${partnerName}`
                  : `/admin/alert?month=${selectedMonthStr}`
              }
            >
              <GetListButton>조회하기</GetListButton>
            </Link>
          </div>
          <NewNoticeButton onClick={() => setIsNewNoticeModalOpened(true)}>
            신규 생성
          </NewNoticeButton>
        </div>
        {loaderData.notices != undefined && loaderData.notices.length > 0 ? (
          NoticeItems(loaderData.notices, monthStr)
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
            공유한 알림이 없습니다.
          </EmptyNoticeBox>
        )}
        <div style={{ minHeight: "70px" }} />
      </PageLayout>
    </>
  );
}

function NoticeItems(noticeItems: NoticeItem[], monthStr: string) {
  return noticeItems.map((doc: NoticeItem, index: number) => {
    return (
      <AdminNotice
        noticeItem={doc}
        key={`NoticeItem_${index}`}
        monthStr={monthStr}
      />
    );
  });
}
