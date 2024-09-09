import { LoadingOverlay, Space } from "@mantine/core";
import { ActionFunction, json, redirect } from "@remix-run/node";
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
import { MessageItem, PartnerMessage, TopicSelect } from "~/components/message";
import { PageLayout } from "~/components/page_layout";
import {
  addMessage,
  getSharedMessages,
  replyMessage,
} from "~/services/firebase/message.server";
import { requireUser } from "~/services/session.server";
import { dateToKoreanMonth, koreanMonthToDate } from "~/utils/date";

function EmptyMessageBox({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const boxStyles: React.CSSProperties = {
    display: "flex",
    textAlign: "center",
    fontSize: "30px",
    height: "100px",
    alignItems: "center",
    justifyContent: "center",
    width: "inherit",
  };

  return (
    <div style={boxStyles} {...props}>
      {children}
    </div>
  );
}

interface LongEditInputBoxProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const LongEditInputBox: React.FC<LongEditInputBoxProps> = (props) => {
  const styles: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 700,
    width: "90%",
  };

  return <textarea style={styles} {...props} />;
};

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
    const messages = await getSharedMessages({
      monthStr: month,
      partnerName: partnerName,
    });
    return json({
      monthStr: month,
      messages: messages,
      partnerName: partnerName,
    });
  } else {
    const todayMonth = dateToKoreanMonth(new Date());
    const messages = await getSharedMessages({
      monthStr: todayMonth,
      partnerName: partnerName,
    });
    // console.log(messages);
    return json({
      monthStr: todayMonth,
      messages: messages,
      partnerName: partnerName,
    });
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
      const result = await replyMessage({
        monthStr: month,
        id: id,
        reply: reply,
        isAdmin: false,
      });
      if (result == true) {
        return json({ message: `답신이 완료되었습니다.` });
      } else {
        return json({
          message: `답신 과정 중 문제가 발생했습니다.${"\n"}${result}`,
        });
      }
    }
  } else if (actionType == "add") {
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
      const result = await addMessage({
        partnerName: partnerName,
        monthStr: month,
        topic: topic,
        detail: detail,
        isFromPartner: true,
      });
      if (result == true) {
        return json({ message: `메세지 생성이 완료되었습니다.` });
      } else {
        return json({
          message: `메세지 생성 과정 중 문제가 발생했습니다.${"\n"}${result}`,
        });
      }
    } else {
      return json({
        message: `메세지 생성 과정 중 문제가 발생했습니다. (formData)`,
      });
    }
  }
  return null;
};

export default function PartnerAlert() {
  const [selectedDate, setSelectedDate] = useState<Date>(); // 선택중인 날짜 (현재 조회된 월이 아닌, MonthSelectPopover로 선택중인 날짜)
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>(); //선택중인 날짜의 string (XX년 XX월)

  const [isNewMessageModalOpened, setIsNewMessageModalOpened] =
    useState<boolean>(false);

  const [noticeModalStr, setNoticeModalStr] = useState<string>(""); //안내 모달창에서 뜨는 메세지
  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);

  const [topicEdit, setTopicEdit] = useState<string>("기타");
  const [detailEdit, setDetailEdit] = useState<string>("");

  const loaderData = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);
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

      {/* 메세지 추가 모달 */}
      <BasicModal
        opened={isNewMessageModalOpened}
        onClose={() => {
          setIsNewMessageModalOpened(false);
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
            <div style={{ minWidth: "110px" }}>공유 주제</div>
            <TopicSelect topic={topicEdit} setTopic={setTopicEdit} />
          </div>
          <div style={{ height: "20px" }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ minWidth: "110px" }}>상세 사유</div>
            <LongEditInputBox
              name="detail"
              value={detailEdit}
              onChange={(e) => setDetailEdit(e.target.value)}
              required
            />
          </div>
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsNewMessageModalOpened(false)}>
              취소
            </ModalButton>
            <ModalButton
              type="submit"
              onClick={async () => {
                const formData = new FormData(formRef.current ?? undefined);
                formData.set("month", monthStr);
                formData.set("partner", loaderData.partnerName);
                formData.set("topic", topicEdit);
                formData.set("detail", detailEdit);
                formData.set("action", "add");
                submit(formData, { method: "post" });
                setIsNewMessageModalOpened(false);
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
            <Space w={20} />
            <Link to={`/partner/message?month=${selectedMonthStr}`}>
              <CommonButton>조회하기</CommonButton>
            </Link>
            <Space w={20} />
            <CommonButton onClick={() => setIsNewMessageModalOpened(true)}>
              신규 생성
            </CommonButton>
          </div>
        </div>
        <div style={{ height: "20px" }} />
        {loaderData.messages != undefined && loaderData.messages.length > 0 ? (
          <>
            {UnrepliedMessageItems(loaderData.messages, monthStr)}
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
            {RepliedMessageItems(loaderData.messages, monthStr)}
          </>
        ) : (
          <EmptyMessageBox>공유된 쪽지가 없습니다.</EmptyMessageBox>
        )}

        <div style={{ minHeight: "70px" }} />
      </PageLayout>
    </>
  );
}

function UnrepliedMessageItems(messageItems: MessageItem[], monthStr: string) {
  return messageItems.map((item: MessageItem, index: number) => {
    const replies = item.replies;
    if (replies.length > 0) {
      return null;
    } else {
      return (
        <PartnerMessage
          messageItem={item}
          key={`MessageItem_${index}`}
          monthStr={monthStr}
        />
      );
    }
  });
}

function RepliedMessageItems(messageItems: MessageItem[], monthStr: string) {
  return messageItems.map((item: MessageItem, index: number) => {
    const replies = item.replies;
    if (replies.length == 0) {
      return null;
    } else {
      return (
        <PartnerMessage
          messageItem={item}
          key={`MessageItem_${index}`}
          monthStr={monthStr}
        />
      );
    }
  });
}
