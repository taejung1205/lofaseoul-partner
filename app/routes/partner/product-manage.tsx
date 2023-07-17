import { Modal, Space } from "@mantine/core";
import { ActionFunction, unstable_composeUploadHandlers, unstable_createFileUploadHandler, unstable_createMemoryUploadHandler, unstable_parseMultipartFormData} from "@remix-run/node";
import { useSubmit } from "@remix-run/react";
import { useRef, useState } from "react";
import styled from "styled-components";
import { BlackButton } from "~/components/button";
import { BasicModal, ModalButton } from "~/components/modal";
import { PageLayout } from "~/components/page_layout";
import { uploadFileTest } from "~/services/firebase.server";

const EditInputBox = styled.input`
  font-size: 20px;
  font-weight: 700;
  width: 250px;
  margin: 4px;
`;

const LongEditInputBox = styled.input`
  font-size: 20px;
  font-weight: 700;
  width: 608px;
  margin: 4px;
`;

const EditTextareaBox = styled.textarea`
  font-size: 16px;
  font-weight: 400;
  width: 608px;
  margin: 4px;
  resize: vertical;
`;
const ListButton = styled.button`
  font-size: 16px;
  background-color: black;
  width: 60px;
  height: 32px;
  margin: 4px;
  color: white;
  border: none;
  font-weight: 700;
  cursor: pointer;
`;


export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  
  const file = body.get("file");
  if(file instanceof File){
    await uploadFileTest(file)
  } else {
    console.log("nope")
  }
  return null;
 }
  
export default function PartnerProductManage() {
  //상품 추가 모달 입력값
  const [productName, setProductName] = useState<string>(""); //상품명 (필수)
  const [englishProductName, setEnglishProductName] = useState<string>(""); //영문상품명
  const [explanation, setExplanation] = useState<string>(""); //상품 설명
  const [keywordList, setKeywordList] = useState<string[]>([]); //검색어 설정
  const [sellerPrice, setSellerPrice] = useState<number>(0); //판매가 (필수)
  const [isUsingOption, setIsUsingOption] = useState<boolean>(false); // 옵션 사용 여부
  const [optionList, setOptionList] = useState<string[]>([]); //옵션 목록
  const [mainImageFile, setMainImageFile] = useState<File>(); //메인 이미지 (필수)
  const [thumbnailImageFile, setThumbnailImageFile] = useState<File>(); //썸네일 이미지 (필수)
  const [detailImageFileList, setDetailImageFileList] = useState<File[]>([]); //상세 이미지
  const [refundExplanation, setRefundExplanation] = useState<string>(""); //교환/반품안내
  const [serviceExplanation, setServiceExplanation] = useState<string>(""); //서비스문의/안내

  //모달 열림 여부
  const [isAddProductModalOpened, setIsAddProductModalOpened] =
    useState<boolean>(false);

  const formRef = useRef<HTMLFormElement>(null);
  const submit = useSubmit();

  function addKeyword() {
    setKeywordList((prev) => [...prev, ""]);
  }

  function editKeyword(index: number, val: string) {
    const newKeywordList = keywordList.map((item, i) => {
      if (i == index) {
        return val;
      } else {
        return item;
      }
    });
    setKeywordList(newKeywordList);
  }

  function deleteKeyword(index: number) {
    const first = keywordList.slice(0, index);
    const last = keywordList.slice(index + 1);
    setKeywordList(first.concat(last));
  }

  function testUpload() {
    const formData: any= new FormData(formRef.current ?? undefined);
    formData.set("file", mainImageFile);
    submit(formData, { method: "post", encType: "multipart/form-data"});
  }
  return (
    <>
      <Modal
        opened={isAddProductModalOpened}
        onClose={() => setIsAddProductModalOpened(false)}
        size={"xl"}
        withCloseButton={false}
        closeOnClickOutside={false}
      >
        <div
          style={{
            justifyContent: "center",
            textAlign: "center",
            fontWeight: "700",
            fontSize: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "120px" }}>상품명 (필수)</div>
            <LongEditInputBox
              type="text"
              name="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "120px" }}>영문 상품명</div>
            <LongEditInputBox
              type="text"
              name="englishProductName"
              value={englishProductName}
              onChange={(e) => setEnglishProductName(e.target.value)}
              required
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "120px" }}>상품 간략설명</div>
            <EditTextareaBox
              name="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div
            style={{
              display: "flex",
            }}
          >
            <div style={{ width: "120px", marginTop: "8px" }}>검색어 설정</div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "start",
              }}
            >
              {keywordList.map((item, index) => {
                return (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "start",
                    }}
                  >
                    <EditInputBox
                      key={`KeywordItem-${index}`}
                      value={keywordList[index]}
                      onChange={(e) => editKeyword(index, e.target.value)}
                    />
                    <Space w={10} />
                    <ListButton onClick={() => deleteKeyword(index)}>
                      삭제
                    </ListButton>
                  </div>
                );
              })}
              <ListButton
                onClick={() => {
                  addKeyword();
                }}
              >
                추가
              </ListButton>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "120px" }}>상품 이미지</div>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              style={{ margin: "4px" }}
              onChange={(e) => {
                if (e.target.files) {
                  setMainImageFile(e.target.files[0]);
                }
              }}
            />
          </div>

          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsAddProductModalOpened(false)}>
              취소
            </ModalButton>
            <ModalButton
              type="submit"
              onClick={async () => {
                console.log(replaceLinebreak(explanation));
                console.log(keywordList);
                console.log(mainImageFile?.name);
                testUpload();
              }}
            >
              추가
            </ModalButton>
          </div>
        </div>
      </Modal>
      <PageLayout>
        <BlackButton onClick={() => setIsAddProductModalOpened(true)}>
          상품 추가
        </BlackButton>
      </PageLayout>
    </>
  );
}

function replaceLinebreak(str: string) {
  return str.split("\n").join("<br />");
}
