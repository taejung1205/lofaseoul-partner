import { Select } from "@mantine/core";
import { Form } from "@remix-run/react";
import { useState } from "react";
import styled from "styled-components";
import { BlackButton } from "./button";
import { BasicModal, ModalButton } from "./modal";

export type NoticeItem = {
  partnerName: string;
  docId: string;
  sharedDate: string | undefined;
  topic: NoticeTopic;
  detail: string;
  replies: string[];
};

type NoticeTopic =
  | "교환요청"
  | "반품요청"
  | "배송 중 파손 고지"
  | "출고 전 취소"
  | "출고 전 주소지 변경 요청"
  | "정산 오류 관련"
  | "출고지연관련"
  | "재고요청"
  | "기타";

const NoticeBox = styled.div`
  background-color: #d9d9d9;
  border: 1px solid black;
  width: inherit;
  margin-top: 40px;
`;

const NoticeGridContainer = styled.div`
  display: grid;
  grid-template-columns: auto auto;
`;

const NoticeGridItem = styled.div`
  background-color: #f0f0f0;
  border: 0.5px solid black;
  text-align: left;
  display: flex;
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

const ReplyInputBox = styled.textarea`
  font-size: 20px;
  font-weight: 700;
  width: 100%;
  margin: 10px;
  padding: 10px;
  min-height: 100px;
`;

export function TopicSelect({
  topic,
  setTopic,
}: {
  topic: string;
  setTopic: (value: string) => void;
}) {
  return (
    <Select
      value={topic}
      onChange={setTopic}
      data={[
        { value: "교환요청", label: "교환요청" },
        { value: "반품요청", label: "반품요청" },
        { value: "배송 중 파손 고지", label: "배송 중 파손 고지" },
        { value: "출고 전 취소", label: "출고 전 취소" },
        {
          value: "출고 전 주소지 변경 요청",
          label: "출고 전 주소지 변경 요청",
        },
        { value: "정산 오류 관련", label: "정산 오류 관련" },
        { value: "출고지연관련", label: "출고지연관련" },
        { value: "재고요청", label: "재고요청" },
        { value: "기타", label: "기타" },
      ]}
      styles={{
        input: {
          fontSize: "20px",
          fontWeight: "bold",
          borderRadius: 0,
          border: "3px solid black !important",
          height: "40px",
        },
        item: {
          "&[data-selected]": {
            backgroundColor: "grey",
          },
        },
      }}
    />
  );
}

export function AdminNotice({
  noticeItem,
  monthStr,
}: // isEdit,
// onEditClick,
{
  noticeItem: NoticeItem;
  monthStr: string;
  // isEdit: boolean;
  // onEditClick: () => void;
}) {
  const [isDeleteModalOpened, setIsDeleteModalOpened] =
    useState<boolean>(false);
  const [isEditModalOpened, setIsEditModalOpened] = useState<boolean>(false);
  const [isShareModalOpened, setIsShareModalOpened] = useState<boolean>(false);
  const [partnerNameEdit, setPartnerNameEdit] = useState<string>(
    noticeItem.partnerName
  );
  const [topicEdit, setTopicEdit] = useState<string>(noticeItem.topic);
  const [detailEdit, setDetailEdit] = useState<string>(noticeItem.detail);
  return (
    <>
      {/* 삭제 모달*/}
      <BasicModal
        opened={isDeleteModalOpened}
        onClose={() => setIsDeleteModalOpened(false)}
      >
        <div
          style={{
            justifyContent: "center",
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          해당 알림을 삭제하시겠습니까?
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsDeleteModalOpened(false)}>
              취소
            </ModalButton>
            <Form method="post">
              <input type="hidden" value={"delete"} name="action" required />
              <input
                type="hidden"
                value={noticeItem.docId}
                name="id"
                required
              />
              <input type="hidden" value={monthStr} name="month" required />
              <ModalButton
                type="submit"
                style={{ borderColor: "red", color: "red" }}
                onClick={() => setIsDeleteModalOpened(false)}
              >
                삭제
              </ModalButton>
            </Form>
          </div>
        </div>
      </BasicModal>

      {/* 공유 모달*/}
      <BasicModal
        opened={isShareModalOpened}
        onClose={() => setIsShareModalOpened(false)}
      >
        <div
          style={{
            justifyContent: "center",
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          해당 알림을 공유하시겠십니까? <br />
          공유한 알림은 수정하거나 삭제할 수 없습니다.
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsShareModalOpened(false)}>
              취소
            </ModalButton>
            <Form method="post">
              <input type="hidden" value={"share"} name="action" required />
              <input
                type="hidden"
                value={noticeItem.docId}
                name="id"
                required
              />
              <input type="hidden" value={monthStr} name="month" required />
              <input
                type="hidden"
                value={noticeItem.partnerName}
                name="partner"
                required
              />
              <input
                type="hidden"
                value={noticeItem.topic}
                name="topic"
                required
              />
              <ModalButton
                type="submit"
                onClick={() => setIsShareModalOpened(false)}
              >
                공유
              </ModalButton>
            </Form>
          </div>
        </div>
      </BasicModal>

      <BasicModal
        opened={isEditModalOpened}
        onClose={() => {
          setIsEditModalOpened(false);
        }}
        size="xl"
      >
        <Form method="post" id="edit">
          <input type="hidden" value={"edit"} name="action" required />
          <input type="hidden" value={noticeItem.docId} name="id" required />
          <input type="hidden" value={monthStr} name="month" required />
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
                name="partner"
                value={partnerNameEdit}
                onChange={(e) => setPartnerNameEdit(e.target.value)}
                required
              />
              <div style={{ width: "100px" }}>공유 주제</div>
              <TopicSelect topic={topicEdit} setTopic={setTopicEdit} />
              <input type="hidden" value={topicEdit} name="topic" />
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
                form="edit"
                value={detailEdit}
                onChange={(e) => setDetailEdit(e.target.value)}
                required
              />
            </div>
            <div style={{ height: "20px" }} />
            <div style={{ display: "flex", justifyContent: "center" }}>
              <ModalButton onClick={() => setIsEditModalOpened(false)}>
                취소
              </ModalButton>
              <ModalButton
                type="submit"
                onClick={() => setIsEditModalOpened(false)}
              >
                수정
              </ModalButton>
            </div>
          </div>
        </Form>
      </BasicModal>

      <NoticeBox>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "9px",
            border: "0.5px solid black",
            height: "48px",
            alignItems: "center",
          }}
        >
          <div>{noticeItem.partnerName}</div>
          {noticeItem.sharedDate == undefined ? (
            <div style={{ display: "flex" }}>
              <img
                src={"/images/icon_edit.png"}
                onClick={() => setIsEditModalOpened(true)}
                style={{
                  width: "30px",
                  height: "30px",
                  marginRight: "10px",
                  cursor: "pointer",
                }}
              />
              <img
                src={"/images/icon_trash.png"}
                onClick={() => setIsDeleteModalOpened(true)}
                style={{
                  width: "30px",
                  height: "30px",
                  marginRight: "10px",
                  cursor: "pointer",
                }}
              />
              <img
                src={"/images/icon_send.svg"}
                onClick={() => setIsShareModalOpened(true)}
                style={{
                  width: "30px",
                  height: "30px",
                  marginRight: "10px",
                  cursor: "pointer",
                }}
              />{" "}
            </div>
          ) : (
            <></>
          )}
        </div>
        <NoticeGridContainer>
          <NoticeGridItem>
            <div style={{ padding: "13px", width: "120px" }}>공유 날짜</div>
            <div
              style={{
                padding: "13px",
                color: noticeItem.sharedDate == undefined ? "red" : "black",
              }}
            >
              {noticeItem.sharedDate ?? "공유되지 않음"}
            </div>
          </NoticeGridItem>
          <NoticeGridItem>
            <div style={{ padding: "13px", width: "120px" }}>공유 주제</div>
            <div style={{ padding: "13px" }}>{noticeItem.topic}</div>
          </NoticeGridItem>
          <NoticeGridItem style={{ gridColumnStart: "span 2" }}>
            <div style={{ padding: "13px", width: "120px" }}>상세 사유</div>
            <div style={{ padding: "13px" }}>{noticeItem.detail}</div>
          </NoticeGridItem>
          {noticeItem.replies.length > 0 ? (
            <NoticeGridItem style={{ gridColumnStart: "span 2" }}>
              <div
                style={{ padding: "13px", width: "120px", color: "#1859FF" }}
              >
                업체 회신
              </div>
              <div>
                {noticeItem.replies.map((reply: string, index: number) => {
                  return <div style={{ padding: "13px" }}>{reply}</div>;
                })}
              </div>
            </NoticeGridItem>
          ) : (
            <></>
          )}
        </NoticeGridContainer>
      </NoticeBox>
      {noticeItem.replies.length == 0 && noticeItem.sharedDate != undefined ? (
        <div style={{ padding: "13px", width: "120px", color: "#FF0000" }}>
          미회신
        </div>
      ) : (
        <></>
      )}
    </>
  );
}

export function PartnerNotice({
  noticeItem,
  monthStr,
}: {
  noticeItem: NoticeItem;
  monthStr: string;
}) {
  return (
    <>
      <NoticeBox>
        <Form method="post" id="reply-form">
          <NoticeGridContainer>
            <NoticeGridItem>
              <div style={{ padding: "13px", width: "120px" }}>공유 날짜</div>
              <div style={{ padding: "13px" }}>
                {noticeItem.sharedDate ?? "공유되지 않음"}
              </div>
            </NoticeGridItem>
            <NoticeGridItem>
              <div style={{ padding: "13px", width: "120px" }}>공유 주제</div>
              <div style={{ padding: "13px" }}>{noticeItem.topic}</div>
            </NoticeGridItem>
            <NoticeGridItem style={{ gridColumnStart: "span 2" }}>
              <div style={{ padding: "13px", width: "120px" }}>상세 사유</div>
              <div style={{ padding: "13px" }}>{noticeItem.detail}</div>
            </NoticeGridItem>
            {noticeItem.replies.length > 0 ? (
              <NoticeGridItem style={{ gridColumnStart: "span 2" }}>
                <div
                  style={{ padding: "13px", width: "120px", color: "#1859FF" }}
                >
                  회신 완료
                </div>
                <div>
                  {noticeItem.replies.map((reply: string, index: number) => {
                    return <div style={{ padding: "13px" }}>{reply}</div>;
                  })}
                </div>
              </NoticeGridItem>
            ) : (
              <></>
            )}
            <NoticeGridItem
              style={{ gridColumnStart: "span 2", alignItems: "end" }}
            >
              <ReplyInputBox name="reply" form="reply-form" />
              <input type="hidden" value={"reply"} name="action" required />
              <input
                type="hidden"
                value={noticeItem.docId}
                name="id"
                required
              />
              <input type="hidden" value={monthStr} name="month" required />
              <BlackButton type="submit">
                {noticeItem.replies.length > 0 ? "추가답신" : "답신하기"}
              </BlackButton>
            </NoticeGridItem>
          </NoticeGridContainer>
        </Form>
      </NoticeBox>
    </>
  );
}
