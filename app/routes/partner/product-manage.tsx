import { Checkbox, Modal, Space } from "@mantine/core";
import {
  ActionFunction,
  LoaderFunction,
  json,
  redirect,
} from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { useRef, useState } from "react";
import styled from "styled-components";
import { BlackButton } from "~/components/button";
import { BasicModal, ModalButton } from "~/components/modal";
import { PageLayout } from "~/components/page_layout";
import { Product } from "~/components/product";
import { addProduct } from "~/services/firebase.server";
import { requireUser } from "~/services/session.server";

const EditInputBox = styled.input`
  font-size: 20px;
  font-weight: 700;
  width: 250px;
  margin: 4px;
`;

const LongEditInputBox = styled(EditInputBox)`
  width: 568px;
`;

const LongEditInputBox2 = styled(EditInputBox)`
  width: 480px;
`;

const EditTextareaBox = styled.textarea`
  font-size: 16px;
  font-weight: 400;
  width: 568px;
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
  const productName = body.get("productName")?.toString();
  const englishProductName = body.get("englishProductName")?.toString();
  const explanation = body.get("explanation")?.toString();
  const keyword = body.get("keyword")?.toString();
  const sellerPrice = Number(body.get("sellerPrice")?.toString());
  const isUsingOption = body.get("isUsingOption")?.toString() == "true";
  const option = body.get("option")?.toString();
  const optionCount = Number(body.get("optionCount")?.toString());
  const refundExplanation = body.get("refundExplanation")?.toString();
  const serviceExplanation = body.get("serviceExplanation")?.toString();

  if (
    productName !== undefined &&
    englishProductName !== undefined &&
    explanation !== undefined &&
    keyword !== undefined &&
    sellerPrice !== undefined &&
    isUsingOption !== undefined &&
    option !== undefined &&
    optionCount !== undefined &&
    refundExplanation !== undefined &&
    serviceExplanation !== undefined
  ) {
    const product: Product = {
      productName: productName,
      englishProductName: englishProductName,
      explanation: explanation,
      keyword: keyword,
      sellerPrice: sellerPrice,
      isUsingOption: isUsingOption,
      option: option,
      optionCount: optionCount,
      refundExplanation: refundExplanation,
      serviceExplanation: serviceExplanation,
    };
    const result = await addProduct({ product: product });
    if (result == true) {
      return json({ message: `상품이 등록되었습니다.` });
    } else {
      return json({
        message: `상품 등록 중 문제가 발생했습니다.${"\n"}${result}`,
      });
    }
  }

  return null;
};

export const loader: LoaderFunction = async ({ request }) => {
  let partnerName: string;
  const user = await requireUser(request);
  if (user !== null) {
    partnerName = user.uid;
  } else {
    return redirect("/login");
  }

  return json({ partnerName: partnerName });
};

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
  const [detailImageFileList, setDetailImageFileList] = useState<
    (File | undefined)[]
  >([]); //상세 이미지 (최소 1개 필수)
  const [refundExplanation, setRefundExplanation] = useState<string>(""); //교환/반품안내
  const [serviceExplanation, setServiceExplanation] = useState<string>(""); //서비스문의/안내

  //모달 열림 여부
  const [isAddProductModalOpened, setIsAddProductModalOpened] =
    useState<boolean>(false);
  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);

  //안내 메세지
  const [notice, setNotice] = useState<string>("");

  const loaderData = useLoaderData();
  const actionData = useActionData();
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

  function addOption() {
    setOptionList((prev) => [...prev, ""]);
  }

  function editOption(index: number, val: string) {
    const newOptionList = optionList.map((item, i) => {
      if (i == index) {
        return val;
      } else {
        return item;
      }
    });
    setOptionList(newOptionList);
  }

  function deleteOption(index: number) {
    const first = optionList.slice(0, index);
    const last = optionList.slice(index + 1);
    setOptionList(first.concat(last));
  }

  function addDetailImage() {
    setDetailImageFileList((prev) => [...prev, undefined]);
  }

  function editDetailImage(index: number, val: File) {
    const newDetailImageList = detailImageFileList.map((item, i) => {
      if (i == index) {
        return val;
      } else {
        return item;
      }
    });
    setDetailImageFileList(newDetailImageList);
  }

  function deleteDetailImage(index: number) {
    const first = detailImageFileList.slice(0, index);
    const last = detailImageFileList.slice(index + 1);
    setDetailImageFileList(first.concat(last));
  }

  //필수 입력 내용을 전부 제대로 입력했는지
  function checkRequirements() {
    if (productName.length == 0) {
      setNotice("상품명을 입력해야 합니다.");
      setIsNoticeModalOpened(true);
      return false;
    }

    if (explanation.length == 0) {
      setNotice("상품 간략설명을 입력해야 합니다.");
      setIsNoticeModalOpened(true);
      return false;
    }

    if (mainImageFile == undefined) {
      setNotice("상품 이미지를 등록해야 합니다.");
      setIsNoticeModalOpened(true);
      return false;
    }

    if (thumbnailImageFile == undefined) {
      setNotice("마우스 호버용 이미지를 등록해야 합니다.");
      setIsNoticeModalOpened(true);
      return false;
    }

    if (detailImageFileList.length == 0) {
      setNotice("상세 페이지 이미지를 최소 1개 등록해야 합니다.");
      setIsNoticeModalOpened(true);
      return false;
    }

    for (let i = 0; i < keywordList.length; i++) {
      if (keywordList[i].length == 0) {
        setNotice(
          "빈 검색어가 있습니다. 해당 항목을 삭제하거나 내용을 입력해주세요."
        );
        setIsNoticeModalOpened(true);
        return false;
      }
    }

    if (isUsingOption && optionList.length == 0) {
      setNotice("옵션을 사용하고자 할 경우, 옵션을 최소 1개 입력해주세요.");
      setIsNoticeModalOpened(true);
      return false;
    }

    for (let i = 0; i < optionList.length; i++) {
      if (optionList[i].length == 0) {
        setNotice(
          "빈 옵션이 있습니다. 해당 항목을 삭제하거나 내용을 입력해주세요."
        );
        setIsNoticeModalOpened(true);
        return false;
      }
      const openBrace = optionList[i].indexOf("{");
      const closeBrace = optionList[i].indexOf("}");

      if (openBrace <= 0 || closeBrace <= 0 || openBrace >= closeBrace) {
        setNotice("옵션을 양식에 맞춰 입력해주세요.");
        setIsNoticeModalOpened(true);
        return false;
      }
    }

    for (let i = 0; i < detailImageFileList.length; i++) {
      if (detailImageFileList[i] == undefined) {
        setNotice(
          "빈 상세 페이지 이미지가 있습니다. 해당 항목을 삭제하거나 파일을 등록해주세요."
        );
        setIsNoticeModalOpened(true);
        return false;
      }
    }

    return true;
  }

  //입력한 내용 토대로 엑셀에 들어갈 내용물을 만들고 추가 요청
  function submitAddProduct() {
    const partnerName = loaderData.partnerName;
    if (partnerName == undefined) {
      setNotice(
        "프로필을 불러오는 것에 실패했습니다. 오류가 반복될 경우 관리자에게 문의해주세요."
      );
      setIsNoticeModalOpened(true);
      return false;
    }

    const newProductName = `[${partnerName}] ${productName}`;
    const newEnglishProductName =
      englishProductName.length > 0
        ? `[${partnerName}] ${englishProductName}`
        : "";
    let keyword = "";
    for (let i = 0; i < keywordList.length; i++) {
      keyword += keywordList[i];
      if (i < keywordList.length - 1) {
        keyword += ", ";
      }
    }
    let option = "";
    for (let i = 0; i < optionList.length; i++) {
      option += optionList[i];
      if (i < optionList.length - 1) {
        option += "//";
      }
    }

    const formData = new FormData(formRef.current ?? undefined);
    formData.set("productName", newProductName);
    formData.set("englishProductName", newEnglishProductName);
    formData.set("explanation", explanation);
    formData.set("keyword", keyword);
    formData.set("sellerPrice", sellerPrice.toString());
    formData.set("isUsingOption", isUsingOption.toString());
    formData.set("option", option);
    formData.set("optionCount", optionList.length.toString());
    formData.set("refundExplanation", refundExplanation);
    formData.set("serviceExplanation", serviceExplanation);

    submit(formData, { method: "post" });
  }

  return (
    <>
      {/* 상품 입력을 위한 모달 */}
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
            <div
              style={{
                width: "160px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              상품명<div style={{ width: "10px", color: "red" }}>*</div>
            </div>
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
            <div style={{ width: "160px" }}>영문 상품명</div>
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
            <div
              style={{
                width: "160px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              상품 간략설명<div style={{ width: "10px", color: "red" }}>*</div>
            </div>
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
            <div style={{ width: "160px", marginTop: "8px" }}>검색어 설정</div>
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
                      placeholder="검색어"
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
            <div style={{ width: "160px" }}>판매가</div>
            <EditInputBox
              name="sellerPrice"
              value={sellerPrice}
              onChange={(e) => {
                if (!Number.isNaN(Number(e.target.value))) {
                  setSellerPrice(Number(e.target.value));
                }
              }}
              required
            />
            <div style={{ width: "160px" }}>옵션 사용</div>
            <Checkbox
              name="isUsingOption"
              checked={isUsingOption}
              onChange={(event) => {
                setIsUsingOption(event.currentTarget.checked);
                if (!isUsingOption) {
                  setOptionList([]);
                }
              }}
              sx={{
                marginTop: "4px",
              }}
            />
          </div>

          {isUsingOption ? (
            <div
              style={{
                display: "flex",
              }}
            >
              <div style={{ width: "160px", marginTop: "8px" }}>옵션 입력</div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "start",
                }}
              >
                {optionList.map((item, index) => {
                  return (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "start",
                      }}
                    >
                      <LongEditInputBox2
                        key={`OptionItem-${index}`}
                        value={optionList[index]}
                        onChange={(e) => editOption(index, e.target.value)}
                        placeholder="옵션명{옵션1|옵션2|옵션3|...}"
                      />
                      <Space w={10} />
                      <ListButton onClick={() => deleteOption(index)}>
                        삭제
                      </ListButton>
                    </div>
                  );
                })}
                <ListButton
                  onClick={() => {
                    addOption();
                  }}
                >
                  추가
                </ListButton>
              </div>
            </div>
          ) : (
            <></>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "160px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              상품 이미지<div style={{ width: "10px", color: "red" }}>*</div>
            </div>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              style={{ margin: "8px" }}
              onChange={(e) => {
                if (e.target.files) {
                  setMainImageFile(e.target.files[0]);
                }
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "160px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              마우스 호버 이미지
              <div style={{ width: "10px", color: "red" }}>*</div>
            </div>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              style={{ margin: "8px" }}
              onChange={(e) => {
                if (e.target.files) {
                  setThumbnailImageFile(e.target.files[0]);
                }
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
            }}
          >
            <div
              style={{
                width: "160px",
                display: "flex",
                justifyContent: "center",
                marginTop: "8px"
              }}
            >
              상세 페이지 이미지<div style={{ width: "10px", color: "red" }}>*</div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "start",
              }}
            >
              {detailImageFileList.map((item, index) => {
                return (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "start",
                    }}
                  >
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg"
                      style={{ margin: "8px" }}
                      onChange={(e) => {
                        if (e.target.files) {
                          editDetailImage(index, e.target.files[0]);
                        }
                      }}
                    />
                    <Space w={10} />
                    <ListButton onClick={() => deleteDetailImage(index)}>
                      삭제
                    </ListButton>
                  </div>
                );
              })}
              <ListButton
                onClick={() => {
                  addDetailImage();
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
            <div style={{ width: "160px" }}>교환/반품 안내</div>
            <EditTextareaBox
              name="refundExplanation"
              value={refundExplanation}
              onChange={(e) => setRefundExplanation(e.target.value)}
              rows={2}
              required
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "160px" }}>서비스 문의/안내</div>
            <EditTextareaBox
              name="serviceExplanation"
              value={serviceExplanation}
              onChange={(e) => setServiceExplanation(e.target.value)}
              rows={2}
              required
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
                if (checkRequirements()) {
                  submitAddProduct();
                }
              }}
            >
              추가
            </ModalButton>
          </div>
        </div>
      </Modal>

      {/* 안내메세지를 위한 모달 */}
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
          {notice}
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsNoticeModalOpened(false)}>
              확인
            </ModalButton>
          </div>
        </div>
      </BasicModal>

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
