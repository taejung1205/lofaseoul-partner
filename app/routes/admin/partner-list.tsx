import { LoadingOverlay, Space } from "@mantine/core";
import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { DocumentData } from "firebase/firestore";
import { useEffect, useState } from "react";
import { PageLayout } from "~/components/page_layout";
import {
  BusinessTaxStandard,
  PartnerProfile,
} from "~/components/partner_profile";
import {
  addPartnerProfile,
  deletePartnerProfile,
  getAllPartnerProfiles,
} from "~/services/firebase/firebase.server";
import writeXlsxFile from "write-excel-file";
import { useNavigation } from "@remix-run/react";
import { BasicModal, ModalButton } from "~/components/modal";

function MyButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const buttonStyles: React.CSSProperties = {
    backgroundColor: "white",
    border: "3px solid black",
    fontSize: "20px",
    fontWeight: 700,
    width: "180px",
    lineHeight: 1,
    padding: "6px",
    cursor: "pointer",
  };

  return (
    <button style={buttonStyles} {...props}>
      {children}
    </button>
  );
}

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  let error = "";
  const actionType = body.get("action")?.toString();
  if (actionType === "add") {
    const name = body.get("name")?.toString();
    const id = body.get("id")?.toString();
    const password = body.get("password")?.toString();
    const email = body.get("email")?.toString();
    const phone = body.get("phone")?.toString();
    const lofaFee = Number(body.get("lofaFee"));
    const otherFee = Number(body.get("otherFee"));
    const gwangjuBiennaleFee = Number(body.get("gwangjuBiennaleFee"));
    const shippingFee = Number(body.get("shippingFee"));
    const brn = body.get("brn")?.toString();
    const bankAccount = body.get("bankAccount")?.toString();
    const businessName = body.get("businessName")?.toString();
    const businessTaxStandard: BusinessTaxStandard = body
      .get("businessTaxStandard")
      ?.toString() as BusinessTaxStandard;
    const providerName = body.get("providerName")?.toString();
    const productCategory = body.getAll("productCategory");

    if (
      typeof name == "undefined" ||
      typeof id == "undefined" ||
      typeof password == "undefined" ||
      typeof email == "undefined" ||
      typeof phone == "undefined"
    ) {
      console.log("Error");
      error = "데이터가 유효하지 않습니다.";
    } else {
      let partnerProfile: PartnerProfile = {
        name: name,
        id: id,
        password: password,
        email: email,
        phone: phone,
        lofaFee: lofaFee,
        otherFee: otherFee,
        gwangjuBiennaleFee: gwangjuBiennaleFee,
        shippingFee: shippingFee,
        brn: brn ?? "",
        bankAccount: bankAccount ?? "",
        businessName: businessName ?? "",
        businessTaxStandard: businessTaxStandard ?? "일반",
        providerName: providerName ?? name,
        productCategory: productCategory.map((val) => val.toString()),
      };
      const addPartnerResult = await addPartnerProfile({
        partnerProfile,
      });

      if (typeof addPartnerResult == "string") {
        error = addPartnerResult;
        return json({
          status: "error",
          message: `오류가 발생했습니다.\n${error}`,
        });
      } else {
        return json({ status: "ok", message: "성공적으로 추가되었습니다." });
      }
    }
  } else if (actionType === "delete") {
    const name = body.get("name")?.toString();
    if (typeof name == "undefined") {
      console.log("Error");
      error = "Data invalid while deleting partner profile";
    } else {
      const deletePartnerResult: any = await deletePartnerProfile({
        name: name,
      });
      if (typeof deletePartnerResult == "string") {
        error = deletePartnerResult;
        return json({
          status: "error",
          message: `오류가 발생했습니다.\n${error}`,
        });
      } else {
        return json({ status: "ok", message: "성공적으로 삭제되었습니다." });
      }
    }
  }
};

export let loader: LoaderFunction = async ({ request }) => {
  const profileDocs = await getAllPartnerProfiles();
  const profileArr = Array.from(profileDocs.values());
  return profileArr;
};

export default function AdminPartnerList() {
  const [currentEdit, setCurrentEdit] = useState<number>(-1);
  const [isCreatingProfile, setIsCreatingProfile] = useState<boolean>(false);
  const [noticeModalStr, setNoticeModalStr] = useState<string>(""); //안내 모달창에서 뜨는 메세지
  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);
  const [isRefreshRequired, setIsRefreshRequired] = useState<boolean>(false);

  const loaderData = useLoaderData(); //Partner Profile List
  const actionData = useActionData();
  const navigation = useNavigation();

  useEffect(() => {
    if (actionData) {
      if (actionData.status == "ok") {
        setIsRefreshRequired(true);
      }
      setNoticeModalStr(actionData.message);
      setIsNoticeModalOpened(true);
    }
  }, [actionData]);

  async function writeExcel() {
    await writeXlsxFile(loaderData, {
      schema,
      headerStyle: {
        fontWeight: "bold",
        align: "center",
      },
      fileName: `파트너목록.xlsx`,
      fontFamily: "맑은 고딕",
      fontSize: 10,
    });
  }

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
            <ModalButton
              onClick={() => {
                setIsNoticeModalOpened(false);
                if (isRefreshRequired) {
                  window.location.reload();
                }
              }}
            >
              확인
            </ModalButton>
          </div>
        </div>
      </BasicModal>
      <PageLayout>
        <LoadingOverlay
          visible={navigation.state == "loading"}
          overlayBlur={2}
        />
        {actionData?.error?.length > 0 ? (
          <div style={{ margin: "10px" }}>{actionData.error}</div>
        ) : (
          <></>
        )}
        <div style={{ display: "flex" }}>
          <MyButton onClick={() => setIsCreatingProfile((prev) => !prev)}>
            신규 생성
          </MyButton>
          <Space w={20} />
          <MyButton onClick={() => writeExcel()}>목록 다운로드</MyButton>
        </div>

        <div style={{ minHeight: "40px" }} />
        {isCreatingProfile ? (
          <PartnerProfile
            partnerProfile={{
              name: "",
              id: "",
              password: "",
              email: "",
              phone: "",
              lofaFee: 0,
              otherFee: 0,
              gwangjuBiennaleFee: 0,
              shippingFee: 0,
              brn: "",
              bankAccount: "",
              businessName: "",
              businessTaxStandard: "일반",
              providerName: "",
              productCategory: [],
            }}
            isNew={true}
            isEdit={true}
            onEditClick={() => {}}
            isPartner={false}
          />
        ) : (
          <></>
        )}
        {loaderData.map((doc: DocumentData, index: number) => {
          return (
            <PartnerProfile
              key={`PartnerProfile-${index}`}
              partnerProfile={{
                name: doc.name,
                id: doc.id,
                password: doc.password,
                email: doc.email,
                phone: doc.phone,
                lofaFee: doc.lofaFee,
                otherFee: doc.otherFee,
                gwangjuBiennaleFee: doc.gwangjuBiennaleFee,
                shippingFee: doc.shippingFee,
                brn: doc.brn,
                bankAccount: doc.bankAccount,
                businessName: doc.businessName,
                businessTaxStandard: doc.businessTaxStandard,
                providerName: doc.providerName,
                productCategory: doc.productCategory,
              }}
              isEdit={currentEdit == index}
              onEditClick={() => {
                setCurrentEdit(index);
              }}
              isPartner={false}
              isNew={false}
            />
          );
        })}
        <div style={{ minHeight: "40px" }} />
      </PageLayout>
    </>
  );
}

const schema = [
  {
    column: "파트너명",
    type: String,
    value: (profile: PartnerProfile) => profile.name,
    width: 30,
    wrap: true,
  },
  {
    column: "공급처명",
    type: String,
    value: (profile: PartnerProfile) => profile.providerName ?? profile.name,
    width: 30,
    wrap: true,
  },
  {
    column: "아이디",
    type: String,
    value: (profile: PartnerProfile) => profile.id,
    width: 30,
    wrap: true,
  },
  {
    column: "비밀번호",
    type: String,
    value: (profile: PartnerProfile) => profile.password,
    width: 30,
    wrap: true,
  },
  {
    column: "이메일",
    type: String,
    value: (profile: PartnerProfile) => profile.email,
    width: 30,
    wrap: true,
  },
  {
    column: "전화번호",
    type: String,
    value: (profile: PartnerProfile) => profile.phone,
    width: 30,
    wrap: true,
  },
  {
    column: "로파채널 수수료",
    type: Number,
    value: (profile: PartnerProfile) => profile.lofaFee,
    width: 20,
  },
  {
    column: "광주비엔날레 수수료",
    type: Number,
    value: (profile: PartnerProfile) => profile.gwangjuBiennaleFee,
    width: 20,
  },
  {
    column: "기타채널 수수료",
    type: Number,
    value: (profile: PartnerProfile) => profile.otherFee,
    width: 20,
  },
  {
    column: "배송비",
    type: Number,
    value: (profile: PartnerProfile) => profile.shippingFee,
    width: 20,
  },
  {
    column: "사업자등록번호",
    type: String,
    value: (profile: PartnerProfile) => profile.brn,
    width: 30,
    wrap: true,
  },
  {
    column: "계좌번호",
    type: String,
    value: (profile: PartnerProfile) => profile.bankAccount,
    width: 40,
    wrap: true,
  },
  {
    column: "사업자명",
    type: String,
    value: (profile: PartnerProfile) => profile.businessName,
    width: 30,
    wrap: true,
  },
  {
    column: "사업자과세기준",
    type: String,
    value: (profile: PartnerProfile) => profile.businessTaxStandard,
    width: 30,
    wrap: true,
  },
];
