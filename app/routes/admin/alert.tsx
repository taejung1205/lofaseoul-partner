import { LoadingOverlay, Space } from "@mantine/core";
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
import { CommonButton } from "~/components/button";
import { MonthSelectPopover } from "~/components/date";
import { BasicModal, ModalButton } from "~/components/modal";
import { AdminNotice, NoticeItem, TopicSelect } from "~/components/notice";
import { PageLayout } from "~/components/page_layout";
import { CommonSelect } from "~/components/select";
import {
  addNotice,
  deleteNotice,
  editNotice,
  getAllPartnerProfiles,
  getNotices,
  getPartnerProfile,
  replyNotice,
  shareNotice,
} from "~/services/firebase/firebase.server";
import { dateToKoreanMonth, koreanMonthToDate } from "~/utils/date";

interface EmptyNoticeBoxProps extends React.HTMLProps<HTMLDivElement> {}

const EmptyNoticeBox: React.FC<EmptyNoticeBoxProps> = (props) => {
  const styles: React.CSSProperties = {
    display: "flex",
    textAlign: "center",
    fontSize: "30px",
    height: "100px",
    alignItems: "center",
    justifyContent: "center",
    width: "inherit",
  };

  return <div style={styles} {...props} />;
};

interface PartnerNameInputBoxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const PartnerNameInputBox: React.FC<PartnerNameInputBoxProps> = (props) => {
  const styles: React.CSSProperties = {
    width: "140px",
    height: "40px",
    border: "3px solid black",
    padding: "6px",
    textAlign: "left",
    fontSize: "20px",
    fontWeight: 700,
    marginLeft: "20px",
  };

  return (
    <input
      style={styles}
      placeholder="Placeholder"
      {...props}
      // Adding styles for placeholder and focus
      // (inline styles for these cannot be applied directly to the element; they need to be in CSS or styled-components)
    />
  );
};

interface NewNoticeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const NewNoticeButton: React.FC<NewNoticeButtonProps> = (props) => {
  const styles: React.CSSProperties = {
    backgroundColor: "white",
    border: "3px solid black",
    fontSize: "20px",
    fontWeight: 700,
    width: "110px",
    lineHeight: "1",
    padding: "6px",
    cursor: "pointer",
  };

  return <button style={styles} {...props} />;
};

interface EditInputBoxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const EditInputBox: React.FC<EditInputBoxProps> = (props) => {
  const styles: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 700,
    width: "200px",
    height: "40px",
    margin: "4px",
  };

  return <input style={styles} {...props} />;
};

interface LongEditInputBoxProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const LongEditInputBox: React.FC<LongEditInputBoxProps> = (props) => {
  const styles: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 700,
    width: "612px",
    margin: "4px",
  };

  return <textarea style={styles} {...props} />;
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const month = url.searchParams.get("month");
  const partnerName = url.searchParams.get("partner");
  const partnersMap = await getAllPartnerProfiles();
  const partnerNamesArr = Array.from(partnersMap.keys());

  if (month !== null) {
    const notices = await getNotices({
      monthStr: month,
      partnerName: partnerName ?? "",
    });
    return json({
      monthStr: month,
      notices: notices,
      partnerNamesArr: partnerNamesArr,
    });
  } else {
    const todayMonth = dateToKoreanMonth(new Date());
    const notices = await getNotices({
      monthStr: todayMonth,
      partnerName: partnerName ?? "",
    });
    // console.log(notices);
    return json({
      monthStr: todayMonth,
      notices: notices,
      partnerNamesArr: partnerNamesArr,
    });
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
        isFromPartner: false,
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
  } else if (actionType == "reply") {
    const id = body.get("id")?.toString();
    const month = body.get("month")?.toString();
    const reply = body.get("reply")?.toString();
    if (
      id !== undefined &&
      month !== undefined &&
      reply !== undefined &&
      reply.length > 0
    ) {
      const result = await replyNotice({
        monthStr: month,
        id: id,
        reply: reply,
        isAdmin: true,
      });
      if (result == true) {
        return json({ message: `추가 메세지 전송이 완료되었습니다.` });
      } else {
        return json({
          message: `메세지 전송 과정 중 문제가 발생했습니다.${"\n"}${result}`,
        });
      }
    } else {
      return json({
        message: `메세지 내용이 잘못되었습니다. 다시 시도해주세요.`,
      });
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

  //메세지 발송에 사용되는 항목들
  const [partnerNameEdit, setPartnerNameEdit] = useState<string>("");
  const [topicEdit, setTopicEdit] = useState<string>("기타");
  const [detailEdit, setDetailEdit] = useState<string>("");

  const formRef = useRef<HTMLFormElement>(null);
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();

  const partnerNamesList = useMemo(() => {
    if (loaderData) {
      return loaderData.partnerNamesArr;
    } else {
      return undefined;
    }
  }, [loaderData]);

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
      <LoadingOverlay
        visible={
          navigation.state == "loading" || navigation.state == "submitting"
        }
        overlayBlur={2}
      />

      {/* 메세지 추가 모달 */}
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
            <CommonSelect
              selected={partnerNameEdit}
              setSelected={(partnerName: string) => {
                setPartnerNameEdit(partnerName);
              }}
              items={partnerNamesList ?? []}
              width="400px"
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
                if (partnerNameEdit) {
                  const formData = new FormData(formRef.current ?? undefined);
                  formData.set("month", monthStr);
                  formData.set("partner", partnerNameEdit);
                  formData.set("topic", topicEdit);
                  formData.set("detail", detailEdit);
                  formData.set("action", "add");
                  submit(formData, { method: "post" });
                  setIsNewNoticeModalOpened(false);
                } else {
                  setIsNoticeModalOpened(true);
                  setNoticeModalStr("대상 업체를 선택해야 합니다.");
                }
              }}
            >
              생성
            </ModalButton>
          </div>
        </div>
      </BasicModal>

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

      <PageLayout styleOverrides={{ display: "block" }}>
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
            <Space w={20} />
            <CommonSelect
              selected={partnerName}
              setSelected={(partnerName: string) => {
                setPartnerName(partnerName);
              }}
              items={partnerNamesList ?? []}
              width="400px"
            />

            <Space w={20} />
            <Link
              to={
                partnerName.length > 0
                  ? `/admin/alert?month=${selectedMonthStr}&partner=${encodeURIComponent(
                      partnerName
                    )}`
                  : `/admin/alert?month=${selectedMonthStr}`
              }
            >
              <CommonButton>조회하기</CommonButton>
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
