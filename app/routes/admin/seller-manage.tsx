import { LoadingOverlay, Space } from "@mantine/core";
import { ActionFunction, LoaderFunction } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { BasicModal, ModalButton } from "~/components/modal";
import { PageLayout } from "~/components/page_layout";
import {
  editSellerProfile,
  getAllSellerProfiles,
} from "~/services/firebase.server";

export type SellerProfile = {
  name: string;
  fee: number;
};

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const actionType = body.get("action")?.toString();
  if (actionType === "edit") {
    const name = body.get("name")?.toString();
    const fee = Number(body.get("fee") ?? -1);
    if (name !== undefined && fee >= 0) {
      const editResult = await editSellerProfile(name, fee);
      if (typeof editResult == "string") {
        return {
          status: "error",
          message: `오류가 발생했습니다. ${editResult}`,
        };
      } else {
        return { status: "ok", message: "수정을 완료하였습니다." };
      }
    } else {
      return {
        status: "error",
        message: "오류가 발생했습니다. 수수료는 음수일 수 없습니다.",
      };
    }
  }
  return null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const profileDocs = await getAllSellerProfiles();
  const profileArr = Array.from(profileDocs.values());
  return profileArr;
};

function SellerProfileBox({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const boxStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#ebebeb4d",
    padding: "10px",
    marginTop: "30px",
    lineHeight: 1,
    fontSize: "24px",
    height: "45px",
    width: "100%",
    justifyContent: "space-between",
  };

  return (
    <div style={boxStyles} {...props}>
      {children}
    </div>
  );
}

export default function Page() {
  const [currentEdit, setCurrentEdit] = useState<number>(-1);
  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);
  const [noticeModalStr, setNoticeModalStr] = useState<string>("");
  const navigation = useNavigation();
  const sellerProfiles = useLoaderData() as any[];
  const actionData = useActionData();

  useEffect(() => {
    if (actionData !== undefined && actionData !== null) {
      setNoticeModalStr(actionData.message);
      setIsNoticeModalOpened(true);
      if (actionData.status == "ok") {
        setCurrentEdit(-1);
      }
    }
  }, [actionData]);

  return (
    <>
      <LoadingOverlay
        visible={
          navigation.state == "loading" || navigation.state == "submitting"
        }
        overlayBlur={2}
      />
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
        {sellerProfiles.map((value, index) => {
          return (
            <SellerItem
              sellerProfile={{
                name: value.name,
                fee: value.fee,
              }}
              isEdit={currentEdit == index}
              onEditClick={() => setCurrentEdit(index)}
              key={`SellterItem_${index}`}
            />
          );
        })}
      </PageLayout>
    </>
  );
}

function SellerItem({
  sellerProfile,
  isEdit,
  onEditClick,
}: {
  sellerProfile: SellerProfile;
  isEdit: boolean;
  onEditClick: () => void;
}) {
  const [feeEdit, setFeeEdit] = useState(sellerProfile.fee);

  return (
    <SellerProfileBox>
      <div> {sellerProfile.name}</div>{" "}
      {isEdit ? (
        <Form method="post">
          <input type="hidden" value={"edit"} name="action" required />
          <input
            type="hidden"
            value={sellerProfile.name}
            name="name"
            required
          />
          <div style={{ display: "flex" }}>
            <input
              type="number"
              name="fee"
              value={feeEdit}
              onChange={(e) => setFeeEdit(Number(e.target.value))}
              required
              style={{
                marginRight: "4px",
                width: "100px",
                fontSize: "24px",
                fontWeight: 700,
                textAlign: "end",
              }}
            />
            {"%"}
            <Space w={20} />
            <input
              type="image"
              src={"/images/icon_save.svg"}
              style={{
                width: "30px",
                height: "30px",
                marginRight: "10px",
                cursor: "pointer",
              }}
            />
          </div>
        </Form>
      ) : (
        <div style={{ display: "flex", alignItems: "center" }}>
          {sellerProfile.fee}% <Space w={20} />
          <img
            src={"/images/icon_edit.svg"}
            onClick={onEditClick}
            style={{
              width: "30px",
              height: "30px",
              marginRight: "10px",
              cursor: "pointer",
            }}
          />
        </div>
      )}
    </SellerProfileBox>
  );
}
