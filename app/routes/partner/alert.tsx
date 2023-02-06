import { AdminNotice, NoticeItem } from "~/components/notice";
import { PageLayout } from "~/components/page_layout";

export default function PartnerAlert() {
  const noticeItem: NoticeItem = {
    partnerName: "test",
    docId: "testId",
    sharedDate: undefined,
    topic: "교환요청",
    detail: "detail 상세내용",
    replyList: [],
  };
  return (
    <>
      <PageLayout>
        <AdminNotice noticeItem={noticeItem}/>
      </PageLayout>
    </>
  );
}
