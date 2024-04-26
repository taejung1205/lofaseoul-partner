import { Checkbox, LoadingOverlay, Modal, Space } from "@mantine/core";
import {
  ActionFunction,
  LoaderFunction,
  json,
  redirect,
} from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { BlackButton } from "~/components/button";
import { BasicModal, ModalButton } from "~/components/modal";
import { PageLayout } from "~/components/page_layout";
import { LoadedProduct, Product } from "~/components/product";
import {
  addProduct,
  deleteProduct,
  getPartnerProducts,
  getProductUploadProgress,
  isProductUploaded,
} from "~/services/firebase.server";
import { requireUser } from "~/services/session.server";

const EditInputBox = styled.input`
  font-size: 20px;
  font-weight: 700;
  width: 360px;
  height: 34px;
  margin-top: 10px;
  margin-bottom: 10px;
  border: 1px solid black;
`;

const InfoBox = styled.div`
  background-color: #f2f2f2;
  padding-top: 20px;
  padding-left: 25px;
  padding-right: 25px;
  padding-bottom: 20px;
  text-align: left;
  size: 18px;
  line-height: 26px;
`;

const LongEditInputBox = styled(EditInputBox)`
  width: 800px;
`;

const EditTextareaBox = styled.textarea`
  font-size: 20px;
  font-weight: 400;
  width: 568px;
  margin-top: 10px;
  margin-bottom: 10px;
  resize: vertical;
  border: 1px solid black;
`;
const ListButton = styled.button`
  font-size: 16px;
  background-color: black;
  width: 60px;
  height: 32px;
  margin-top: 10px;
  margin-bottom: 10px;
  color: white;
  border: none;
  font-weight: 700;
  cursor: pointer;
`;

const DetailButton = styled.button`
  font-size: 20px;
  background-color: black;
  width: 95px;
  height: 32px;
  color: white;
  border: none;
  font-weight: 700;
  cursor: pointer;
`;

const FileUploadButton = styled.label`
  font-size: 16px;
  background-color: black;
  width: 60px;
  height: 32px;
  color: white;
  border: none;
  font-weight: 700;
  line-height: 1.8;
  cursor: pointer;
`;

const FileUpload = styled.input`
  width: 0;
  height: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
`;

const LoadedProductItem = styled.div`
  display: flex;
  width: inherit;
  align-items: top;
  background-color: #ebebeb4d;
  padding: 10px;
  margin-bottom: 6px;
  line-height: 1;
`;

const LoadedProductThumbnail = styled.img`
  object-fit: contain;
  width: 100px;
  height: 100px;
`;

const LabelText = styled.div`
  font-size: 24px;
  display: flex;
  justify-content: left;
  width: 200px;
  font-weight: 700;
  line-height: 35px;
`;

const HintText = styled.div`
  font-size: 18px;
  color: #acacac;
  line-height: 26px;
  font-weight: 700;
  text-align: left;
`;

const PreviewImage = styled.img`
  width: 166px;
  height: 168px;
  object-fit: contain;
  border: 1px solid black;
  background-color: #f8f8f8;
  color: black;
  margin-top: 10px;
`;

const PreviewImageAlt = styled.div`
  width: 166px;
  height: 168px;
  border: 1px solid black;
  background-color: #f8f8f8;
  text-align: center;
  align-items: center;
  justify-content: center;
  color: #9d9d9d;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  margin-top: 10px;
`;

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const actionType = body.get("actionType")?.toString();
  if (
    actionType == "add" ||
    actionType == "update" ||
    actionType == "tempsave-add" ||
    actionType == "tempsave-update"
  ) {
    const partnerName = body.get("partnerName")?.toString();
    const productName = body.get("productName")?.toString();
    const englishProductName = body.get("englishProductName")?.toString();
    const explanation = body.get("explanation")?.toString();
    const keyword = body.get("keyword")?.toString();
    const sellerPrice = Number(body.get("sellerPrice")?.toString());
    const isUsingOption = body.get("isUsingOption")?.toString() == "true";
    const option = body.get("option")?.toString();
    const memo = body.get("memo")?.toString();
    const refundExplanation = body.get("refundExplanation")?.toString();
    const serviceExplanation = body.get("serviceExplanation")?.toString();

    const mainImageFile = body.get("mainImageFile");
    const thumbnailImageFile = body.get("thumbnailImageFile");
    const detailImageFileList = body.getAll("detailImageFileList");

    const isTempSave =
      actionType == "tempsave-add" || actionType == "tempsave-update";

    for (let i = 0; i < detailImageFileList.length; i++) {
      if (!(detailImageFileList[i] instanceof File)) {
        return json({
          message: `상품 등록 중 문제가 발생했습니다. 상세 이미지가 파일이 아닙니다. 관리자에게 문의해주세요.`,
        });
      }
    }

    if (
      partnerName !== undefined &&
      productName !== undefined &&
      englishProductName !== undefined &&
      explanation !== undefined &&
      keyword !== undefined &&
      sellerPrice !== undefined &&
      isUsingOption !== undefined &&
      option !== undefined &&
      memo !== undefined &&
      refundExplanation !== undefined &&
      serviceExplanation !== undefined &&
      mainImageFile instanceof File &&
      thumbnailImageFile instanceof File
    ) {
      const product: Product = {
        partnerName: partnerName,
        productName: productName,
        englishProductName: englishProductName,
        explanation: explanation,
        keyword: keyword,
        sellerPrice: sellerPrice,
        isUsingOption: isUsingOption,
        option: option,
        memo: memo,
        refundExplanation: refundExplanation,
        serviceExplanation: serviceExplanation,
        mainImageFile: mainImageFile,
        thumbnailImageFile: thumbnailImageFile,
        detailImageFileList: detailImageFileList,
        status: isTempSave ? "임시저장" : "승인대기",
      };

      //수정일 경우 기존 삭제 후 새로 올리는 형식으로
      if (actionType == "update" || actionType == "tempsave-update") {
        const prevProductName = body.get("prevProductName")?.toString();
        if (prevProductName !== undefined || prevProductName == "") {
          const result = await deleteProduct({ productName: prevProductName });
          if (result !== null) {
            return json({
              message: `상품 수정 중 삭제 과정에서 문제가 발생했습니다.${"\n"}${result}`,
              status: "error",
            });
          }
        } else {
          return json({
            message: `상품 수정 중 기존 정보 삭제 과정에서 발생했습니다. 기존 상품 정보의 이름이 누락되었습니다. 관리자에게 문의해주세요.`,
            status: "error",
          });
        }
      }

      const result = await addProduct({ product: product });

      if (result == null) {
        return {
          isWaiting: true,
          isStartWaiting: true,
          progress: 0,
          status: "ok",
        };
      } else {
        if (actionType == "add") {
          return json({
            message: `상품 등록 중 문제가 발생했습니다.${"\n"}${result}`,
            status: "error",
          });
        } else {
          return json({
            message: `상품 수정 중 등록 과정에서 문제가 발생했습니다.${"\n"}${result}`,
            status: "error",
          });
        }
      }
    }

    return json({
      message: `상품 등록 중 문제가 발생했습니다. 상품 입력 요청 처리 중 누락된 내용이 존재합니다. 관리자에게 문의해주세요`,
      status: "error",
    });
  } else if (actionType == "delete") {
    const productName = body.get("productName")?.toString();
    if (productName !== undefined || productName == "") {
      const result = await deleteProduct({ productName: productName });
      if (result !== null) {
        return json({
          message: `상품  삭제 과정에서 문제가 발생했습니다.${"\n"}${result}`,
          status: "error",
        });
      } else {
        return json({ message: `상품이 삭제되었습니다..`, status: "ok" });
      }
    } else {
      return json({
        message: `상품 삭제 과정에서 발생했습니다. 기존 상품 정보의 이름이 누락되었습니다. 관리자에게 문의해주세요.`,
        status: "error",
      });
    }
  } else if (actionType == "waiting") {
    const productName = body.get("productName")?.toString();
    if (productName !== undefined || productName == "") {
      const result = await isProductUploaded({ productName: productName });
      if (result == true) {
        return json({
          message: `업로드가 완료되었습니다.`,
          status: "ok",
        });
      } else {
        const result = await getProductUploadProgress({
          productName: productName,
        });
        return json({ isWaiting: true, progress: result, status: "ok" });
      }
    } else {
      return json({
        message: `상품 업로드 확인 과정에서 발생했습니다. 관리자에게 문의해주세요.`,
        status: "error",
      });
    }
  }
};

export const loader: LoaderFunction = async ({ request }) => {
  let partnerName: string;
  const user = await requireUser(request);
  if (user !== null) {
    partnerName = user.uid;
  } else {
    return redirect("/login");
  }

  const products = await getPartnerProducts({
    partnerName: partnerName,
  });

  if (typeof products == "string") {
    return json({ partnerName: partnerName, products: [], error: products });
  }

  return json({ partnerName: partnerName, products: products });
};

export default function PartnerProductManage() {
  //상품 추가 모달 입력값
  const [productName, setProductName] = useState<string>(""); //상품명 (필수)
  const [englishProductName, setEnglishProductName] = useState<string>(""); //영문상품명
  const [explanation, setExplanation] = useState<string>(""); //상품 설명
  const [keyword, setKeyword] = useState<string>(); //검색어 설정
  const [sellerPrice, setSellerPrice] = useState<number>(0); //판매가 (필수)
  const [isUsingOption, setIsUsingOption] = useState<boolean>(false); // 옵션 사용 여부
  const [optionCategoryList, setOptionCategoryList] = useState<string[]>([""]); //옵션 카테고리 목록
  const [optionDetailList, setOptionDetailList] = useState<string[]>([""]); //옵션 세부항목 목록
  const [mainImageFile, setMainImageFile] = useState<File>(); //메인 이미지 (필수)
  const [thumbnailImageFile, setThumbnailImageFile] = useState<File>(); //썸네일 이미지 (필수)
  const [detailImageFileList, setDetailImageFileList] = useState<
    (File | undefined)[]
  >(Array(8).fill(undefined)); //상세 이미지 (최소 1개 필수)
  const [memo, setMemo] = useState<string>(""); // 옵션 별 가격 설정 및 관리자 전달 메모
  const [refundExplanation, setRefundExplanation] = useState<string>(""); //교환/반품안내
  const [serviceExplanation, setServiceExplanation] = useState<string>(""); //서비스문의/안내

  //모달 열림 여부
  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);

  // 상품 추가 메뉴가 열렸는지
  const [isAddProductMenuOpened, setIsAddProductMenuOpened] =
    useState<boolean>(false);

  //기존 상품 목록으로 창을 연건지
  const [isLoadedProduct, setIsLoadedProduct] = useState<boolean>(false);

  //현재 열고 있는 상품
  const [loadedProduct, setLoadedProduct] = useState<
    LoadedProduct | undefined
  >();

  //안내 메세지
  const [notice, setNotice] = useState<string>("");

  //불러온 상품 목록
  const [loadedProducts, setLoadedProducts] = useState<LoadedProduct[]>([]); //로딩된 전체 주문건 아이템 리스트

  //업로드 중 상태
  const [isUploadInProgress, setIsUploadInProgress] = useState<boolean>(false);

  //파일 업로드 진행 상태
  const [imageUploadProgress, setImageUploadProgress] = useState<number>(0);

  //업로드 중 확인 요청 용 타이머
  const [queryIntervalId, setQueryIntervalId] = useState<NodeJS.Timer>();

  //로딩 중
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //현재 보고 있는 신청한 상품 목록 페이지 번호
  //유저한테 보이는 값은 여기서 +1
  const [pageIndex, setPageIndex] = useState<number>(0);

  const loaderData = useLoaderData();
  const actionData = useActionData();
  const formRef = useRef<HTMLFormElement>(null);
  const submit = useSubmit();

  function addOption() {
    setOptionCategoryList((prev) => [...prev, ""]);
    setOptionDetailList((prev) => [...prev, ""]);
  }

  function editOptionCategory(index: number, val: string) {
    const newOptionCategoryList = optionCategoryList.map((item, i) => {
      if (i == index) {
        return val;
      } else {
        return item;
      }
    });
    setOptionCategoryList(newOptionCategoryList);
  }

  function editOptionDetail(index: number, val: string) {
    const newOptionDetailList = optionDetailList.map((item, i) => {
      if (i == index) {
        return val;
      } else {
        return item;
      }
    });
    setOptionDetailList(newOptionDetailList);
  }

  function deleteOption(index: number) {
    const first1 = optionCategoryList.slice(0, index);
    const last1 = optionCategoryList.slice(index + 1);
    setOptionCategoryList(first1.concat(last1));

    const first2 = optionDetailList.slice(0, index);
    const last2 = optionDetailList.slice(index + 1);
    setOptionDetailList(first2.concat(last2));
  }

  function addDetailImage() {
    setDetailImageFileList((prev) => [...prev, undefined]);
  }

  function editDetailImage(index: number, val: File | undefined) {
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

    if (explanation.includes("<br />")) {
      setNotice("'<br />' 문자열은 설명에 들어갈 수 없습니다.");
      setIsNoticeModalOpened(true);
      return false;
    }

    if (refundExplanation.includes("<br />")) {
      setNotice("'<br />' 문자열은 안내 설명에 들어갈 수 없습니다.");
      setIsNoticeModalOpened(true);
      return false;
    }

    if (serviceExplanation.includes("<br />")) {
      setNotice("'<br />' 문자열은 안내 설명에 들어갈 수 없습니다.");
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

    if (isDetailImageListEmpty()) {
      setNotice("상세 페이지 이미지를 최소 1개 등록해야 합니다.");
      setIsNoticeModalOpened(true);
      return false;
    }

    if (!checkDuplicateFileName(detailImageFileList)) {
      setNotice("상세 페이지 이미지 파일들은 이름이 서로 달라야 합니다.");
      setIsNoticeModalOpened(true);
      return false;
    }

    //검색어 설정 검사
    // for (let i = 0; i < keywordList.length; i++) {
    //   if (keywordList[i].length == 0) {
    //     setNotice(
    //       "빈 검색어가 있습니다. 해당 항목을 삭제하거나 내용을 입력해주세요."
    //     );
    //     setIsNoticeModalOpened(true);
    //     return false;
    //   }

    //   if (keywordList[i].includes(",")) {
    //     setNotice("쉼표(,)는 검색어에 들어갈 수 없습니다.");
    //     setIsNoticeModalOpened(true);
    //     return false;
    //   }
    // }

    for (let i = 0; i < optionCategoryList.length; i++) {
      if (
        optionCategoryList[i].length == 0 &&
        optionDetailList[i].length != 0
      ) {
        setNotice(
          "옵션 카테고리가 빈 항목이 있습니다. 해당 항목을 삭제하거나 내용을 입력해주세요."
        );
        setIsNoticeModalOpened(true);
        return false;
      }

      if (
        optionCategoryList[i].length != 0 &&
        optionDetailList[i].length == 0
      ) {
        setNotice(
          "옵션 세부항목이 빈 항목이 있습니다. 해당 항목을 삭제하거나 내용을 입력해주세요."
        );
        setIsNoticeModalOpened(true);
        return false;
      }

      if (
        optionDetailList[i].includes("//") ||
        optionCategoryList[i].includes("//")
      ) {
        setNotice("'//' 문자열은 옵션에 들어갈 수 없습니다.");
        setIsNoticeModalOpened(true);
        return false;
      }

      if (
        optionDetailList[i].includes("{") ||
        optionCategoryList[i].includes("{") ||
        optionDetailList[i].includes("}") ||
        optionCategoryList[i].includes("}")
      ) {
        setNotice("중괄호 ({, }) 문자열은 옵션에 들어갈 수 없습니다.");
        setIsNoticeModalOpened(true);
        return false;
      }

      if (
        optionDetailList[i].includes("|") ||
        optionCategoryList[i].includes("|")
      ) {
        setNotice("'|' 문자열은 옵션에 들어갈 수 없습니다.");
        setIsNoticeModalOpened(true);
        return false;
      }
    }

    // for (let i = 0; i < detailImageFileList.length; i++) {
    //   if (
    //     detailImageFileList[i] == undefined ||
    //     typeof detailImageFileList[i] == "undefined"
    //   ) {
    //     setNotice(
    //       "빈 상세 페이지 이미지가 있습니다. 해당 항목을 삭제하거나 파일을 등록해주세요."
    //     );
    //     setIsNoticeModalOpened(true);
    //     return false;
    //   }
    // }

    return true;
  }

  //입력한 내용 토대로 엑셀에 들어갈 내용물을 만들고 추가 요청
  async function submitProduct() {
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
    const newExplanation = replaceLinebreak(explanation);
    const newRefundExplanation = replaceLinebreak(refundExplanation);
    const newServiceExplanation = replaceLinebreak(serviceExplanation);
    let newOption = "";
    for (let i = 0; i < optionCategoryList.length; i++) {
      if (
        optionCategoryList[i].length == 0 &&
        optionDetailList[i].length == 0
      ) {
        continue;
      }
      console.log(optionCategoryList[i]);
      console.log(optionDetailList[i]);
      let parsedOption = optionCategoryList[i];
      parsedOption += "{";
      parsedOption += replaceComma(optionDetailList[i]);
      parsedOption += "}";
      newOption += parsedOption;
      if (i < optionCategoryList.length - 1) {
        newOption += "//";
      }
    }
    console.log(newOption);

    const formData: any = new FormData(formRef.current ?? undefined);
    if (isLoadedProduct) {
      formData.set("actionType", "update");
      formData.set("prevProductName", loadedProduct?.productName ?? "");
    } else {
      formData.set("actionType", "add");
    }
    formData.set("partnerName", partnerName);
    formData.set("productName", newProductName);
    formData.set("englishProductName", newEnglishProductName);
    formData.set("explanation", newExplanation);
    formData.set("keyword", keyword);
    formData.set("sellerPrice", sellerPrice.toString());
    formData.set("isUsingOption", isUsingOption.toString());
    formData.set("option", newOption);
    formData.set("memo", memo);
    formData.set("refundExplanation", newRefundExplanation);
    formData.set("serviceExplanation", newServiceExplanation);
    formData.set("mainImageFile", mainImageFile);
    formData.set("thumbnailImageFile", thumbnailImageFile);
    for (let i = 0; i < detailImageFileList.length; i++) {
      if (detailImageFileList[i]) {
        formData.append("detailImageFileList", detailImageFileList[i]);
      }
    }

    submit(formData, { method: "post", encType: "multipart/form-data" });
  }

  //입력한 내용을 토대로 임시저장, 해당 절차는 필수 내용 입력 여부를 거치지 않음
  async function submitTemporarySave() {
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
    const newExplanation = replaceLinebreak(explanation);
    const newRefundExplanation = replaceLinebreak(refundExplanation);
    const newServiceExplanation = replaceLinebreak(serviceExplanation);
    let newOption = "";
    for (let i = 0; i < optionCategoryList.length; i++) {
      if (
        optionCategoryList[i].length == 0 &&
        optionDetailList[i].length == 0
      ) {
        continue;
      }
      console.log(optionCategoryList[i]);
      console.log(optionDetailList[i]);
      let parsedOption = optionCategoryList[i];
      parsedOption += "{";
      parsedOption += replaceComma(optionDetailList[i]);
      parsedOption += "}";
      newOption += parsedOption;
      if (i < optionCategoryList.length - 1) {
        newOption += "//";
      }
    }
    console.log(newOption);

    const formData: any = new FormData(formRef.current ?? undefined);
    if (isLoadedProduct) {
      formData.set("actionType", "tempsave-update");
      formData.set("prevProductName", loadedProduct?.productName ?? "");
    } else {
      formData.set("actionType", "tempsave-add");
    }
    formData.set("partnerName", partnerName);
    formData.set("productName", newProductName);
    formData.set("englishProductName", newEnglishProductName);
    formData.set("explanation", newExplanation);
    formData.set("keyword", keyword);
    formData.set("sellerPrice", sellerPrice.toString());
    formData.set("isUsingOption", isUsingOption.toString());
    formData.set("option", newOption);
    formData.set("memo", memo);
    formData.set("refundExplanation", newRefundExplanation);
    formData.set("serviceExplanation", newServiceExplanation);
    formData.set("mainImageFile", mainImageFile);
    formData.set("thumbnailImageFile", thumbnailImageFile);
    for (let i = 0; i < detailImageFileList.length; i++) {
      if (detailImageFileList[i]) {
        formData.append("detailImageFileList", detailImageFileList[i]);
      }
    }

    submit(formData, { method: "post", encType: "multipart/form-data" });
  }

  //현재 보고 있는 상품 삭제 요청
  async function deleteProduct() {
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("actionType", "delete");
    formData.set("productName", loadedProduct?.productName ?? "");
    submit(formData, { method: "post" });
  }

  //LoadedProduct로 입력란업데이트
  async function loadAddProductModal(product: LoadedProduct) {
    console.log(product);
    setProductName(
      product.productName.slice(
        product.productName.indexOf(`[${loaderData.partnerName}]`) +
          loaderData.partnerName.length +
          3
      )
    );
    setEnglishProductName(
      product.englishProductName.slice(
        product.englishProductName.indexOf(`[${loaderData.partnerName}]`) +
          loaderData.partnerName.length +
          3
      )
    );
    setExplanation(replaceBr(product.explanation));
    setKeyword(product.keyword);
    setSellerPrice(product.sellerPrice);
    setIsUsingOption(product.isUsingOption);
    if (product.option.length == 0) {
      setOptionCategoryList([""]);
      setOptionDetailList([""]);
    } else {
      const catList = [];
      const detList = [];
      const fullList = product.option.split("//");
      for (let i = 0; i < fullList.length; i++) {
        const list = fullList[i].split("{");
        catList.push(list[0]);
        detList.push(replaceVerticalBar(list[1].split("}")[0]));
      }
      setOptionCategoryList(catList);
      setOptionDetailList(detList);
    }

    const mainFile = await downloadFile(
      product.mainImageURL,
      product.mainImageName
    );
    const thumbnailFile = await downloadFile(
      product.thumbnailImageURL,
      product.thumbnailImageName
    );
    const detailFileList = Array(8).fill(undefined);
    for (let i = 0; i < product.detailImageURLList.length; i++) {
      detailFileList[i] = await downloadFile(
        product.detailImageURLList[i],
        product.detailImageNameList[i]
      );
    }
    setMainImageFile(mainFile);
    setThumbnailImageFile(thumbnailFile);
    setDetailImageFileList(detailFileList);
    setMemo(product.memo);
    setRefundExplanation(replaceBr(product.refundExplanation));
    setServiceExplanation(replaceBr(product.serviceExplanation));
  }

  //입력란 초기화
  function resetAddProductModal() {
    setProductName("");
    setEnglishProductName("");
    setExplanation("");
    setKeyword("");
    setSellerPrice(0);
    setIsUsingOption(false);
    setOptionCategoryList([""]);
    setOptionDetailList([""]);
    setMainImageFile(undefined);
    setThumbnailImageFile(undefined);
    setDetailImageFileList(Array(8).fill(undefined));
    setMemo("");
    setRefundExplanation("");
    setServiceExplanation("");
  }

  function isDetailImageListEmpty() {
    for (let i = 0; i < detailImageFileList.length; i++) {
      if (detailImageFileList[i]) {
        return false;
      }
    }
    return true;
  }

  //결과로 오는 거 바탕으로 안내모달
  useEffect(() => {
    if (actionData !== undefined && actionData !== null) {
      if (actionData.isStartWaiting) {
        setIsUploadInProgress(true);
      }
      if (actionData.isWaiting) {
        setImageUploadProgress(actionData.progress);
        console.log("isWaiting status: ", actionData.status);
      } else {
        console.log(actionData);
        setIsUploadInProgress(false);
        setNotice(actionData.message ?? actionData.errorMessage ?? actionData);
        setIsNoticeModalOpened(true);
        //성공했으면 모달 닫기
        if (actionData.status == "ok") {
          clearInterval(queryIntervalId);
          setImageUploadProgress(0);
          setIsAddProductMenuOpened(false);
        }
      }
    }
  }, [actionData]);

  useEffect(() => {
    if (loaderData.error == undefined) {
      setLoadedProducts(loaderData.products);
    } else {
      setNotice(
        `상품 등록 정보를 불러오는 도중 오류가 발생했습니다. ${loaderData.error}`
      );
      setIsNoticeModalOpened(true);
    }
  }, [loaderData]);

  useEffect(() => {
    if (mainImageFile !== undefined) {
      if (mainImageFile.size > 50 * 1024 ** 2) {
        setNotice("업로드할 이미지의 크기는 50MB를 넘을 수 없습니다.");
        setIsNoticeModalOpened(true);
        setMainImageFile(undefined);
        return;
      }

      if (
        mainImageFile.name.includes("/") ||
        mainImageFile.name.includes("|")
      ) {
        setNotice(
          "업로드할 이미지의 이름에 '/' 또는 '|'이 들어갈 수 없습니다."
        );
        setIsNoticeModalOpened(true);
        setMainImageFile(undefined);
        return;
      }

      const preview = document.getElementById(
        "mainImagePreview"
      ) as HTMLImageElement;
      if (preview) {
        preview.src = URL.createObjectURL(mainImageFile);
      }
    }
  }, [mainImageFile]);

  useEffect(() => {
    if (thumbnailImageFile !== undefined) {
      if (thumbnailImageFile.size > 50 * 1024 ** 2) {
        setNotice("업로드할 이미지의 크기는 50MB를 넘을 수 없습니다.");
        setIsNoticeModalOpened(true);
        setThumbnailImageFile(undefined);
        return;
      }

      if (
        thumbnailImageFile.name.includes("/") ||
        thumbnailImageFile.name.includes("|")
      ) {
        setNotice(
          "업로드할 이미지의 이름에 '/' 또는 '|'이 들어갈 수 없습니다."
        );
        setIsNoticeModalOpened(true);
        setThumbnailImageFile(undefined);
        return;
      }

      const preview = document.getElementById(
        "thumbnailImagePreview"
      ) as HTMLImageElement;
      if (preview) {
        preview.src = URL.createObjectURL(thumbnailImageFile);
      }
    }
  }, [thumbnailImageFile]);

  useEffect(() => {
    for (let i = 0; i < detailImageFileList.length; i++) {
      if (
        detailImageFileList[i] !== undefined &&
        detailImageFileList[i] !== null
      ) {
        const file: any = detailImageFileList[i];
        if (file.size > 50 * 1024 ** 2) {
          setNotice("업로드할 이미지의 크기는 50MB를 넘을 수 없습니다.");
          setIsNoticeModalOpened(true);
          editDetailImage(i, undefined);
          return;
        }

        if (file.name.includes("/") || file.name.includes("|")) {
          setNotice(
            "업로드할 이미지의 이름에 '/' 또는 '|'이 들어갈 수 없습니다."
          );
          setIsNoticeModalOpened(true);
          editDetailImage(i, undefined);
          return;
        }

        const preview = document.getElementById(
          `detailImagePreview_${i}`
        ) as HTMLImageElement;
        if (preview) {
          preview.src = URL.createObjectURL(detailImageFileList[i]!);
        } else {
          console.log("no");
        }
      }
    }
  }, [detailImageFileList]);

  //업로드 중 업로드됐는지 확인을 위한 인터벌
  useEffect(() => {
    var interval = setInterval(() => {
      if (isUploadInProgress) {
        const formData = new FormData(formRef.current ?? undefined);
        formData.set(
          "productName",
          `[${loaderData.partnerName}] ${productName}`
        );
        formData.set("actionType", "waiting");
        submit(formData, { method: "post" });
      } else {
        clearInterval(queryIntervalId);
      }
    }, 1 * 2000);
    setQueryIntervalId(interval);
    return () => clearInterval(queryIntervalId); //
  }, [isUploadInProgress]);

  // return (<div>WIP <br /> 공사중입니다.</div>)

  return (
    <>
      <LoadingOverlay visible={isLoading} overlayBlur={2} />

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

      {/* 업로드를 기다리기 위한 모달 */}
      <BasicModal opened={isUploadInProgress} onClose={() => {}}>
        <div
          style={{
            justifyContent: "center",
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          {`업로드 진행 중... (${imageUploadProgress.toFixed(2)}%)`}
          <br />
          {`도중에 페이지를 닫을 경우 오류가 발생할 수 있습니다.`}
        </div>
      </BasicModal>

      {isAddProductMenuOpened ? (
        /* 상품 입력 시의 화면 */
        <PageLayout>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div style={{ display: "flex" }}>
              <img
                src="/images/icon_back.png"
                onClick={() => setIsAddProductMenuOpened(false)}
                style={{
                  cursor: "pointer",
                  width: "40px",
                  objectFit: "contain",
                }}
              />
              <Space w={15} />
              <div style={{ fontSize: "24px", lineHeight: "35px" }}>
                상품 추가
              </div>
            </div>
            <div style={{ display: "flex" }}>
              <img
                src="/images/icon_trash.svg"
                style={{ cursor: "pointer" }}
                onClick={async () => {
                  if (isLoadedProduct) {
                    setIsLoading(true);
                    await deleteProduct();
                    setIsLoading(false);
                  } else {
                    setIsAddProductMenuOpened(false);
                  }
                }}
              />
              <Space w={20} />
              <img
                src="/images/icon_save.svg"
                style={{ cursor: "pointer" }}
                onClick={async () => {
                  if (checkRequirements()) {
                    setIsLoading(true);
                    await submitTemporarySave();
                    setIsLoading(false);
                  }
                }}
              />
            </div>
          </div>
          <Space h={40} />
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
              <LabelText>
                상품명<div style={{ width: "10px", color: "red" }}>*</div>
              </LabelText>
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
              <LabelText>영문 상품명</LabelText>
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
              }}
            >
              <LabelText style={{ marginTop: "10px" }}>
                상품 간략설명
                <div style={{ width: "10px", color: "red" }}>*</div>
              </LabelText>
              <EditTextareaBox
                name="explanation"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <LabelText>검색어 설정</LabelText>
              <EditInputBox
                type="text"
                name="keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                required
              />
              <Space w={10} />
              <HintText>{`쉼표로 구분해주세요. (예: 검색어1, 검색어2, 검색어3)`}</HintText>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <LabelText>
                판매가 <div style={{ width: "10px", color: "red" }}>*</div>
              </LabelText>
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
            </div>

            <div
              style={{
                display: "flex",
                marginTop: "10px",
              }}
            >
              <LabelText>옵션 설정</LabelText>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "start",
                }}
              >
                <div style={{ display: "flex" }}>
                  <div style={{ width: "200px" }}>
                    <HintText>
                      옵션 카테고리 <br />
                      ex. 컬러
                    </HintText>
                  </div>
                  <Space w={10} />
                  <div style={{ width: "400px" }}>
                    <HintText>
                      옵션 세부항목, 쉼표로 구분해주세요. <br />
                      ex. 빨강, 파랑, 초록
                    </HintText>
                  </div>
                </div>

                {optionCategoryList.map((item, index) => {
                  return (
                    <div
                      key={`OptionItem-${index}`}
                      style={{
                        display: "flex",
                        justifyContent: "start",
                      }}
                    >
                      <EditInputBox
                        style={{ width: "200px" }}
                        value={optionCategoryList[index]}
                        onChange={(e) =>
                          editOptionCategory(index, e.target.value)
                        }
                      />
                      <Space w={10} />
                      <EditInputBox
                        style={{ width: "400px" }}
                        value={optionDetailList[index]}
                        onChange={(e) =>
                          editOptionDetail(index, e.target.value)
                        }
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <LabelText style={{ textAlign: "left" }}>
                옵션 별 가격 <br /> 설정 및 관리자 <br />
                전달 메모
              </LabelText>
              <EditTextareaBox
                name="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "top",
              }}
            >
              <LabelText style={{ marginTop: "10px" }}>
                교환/반품 안내
              </LabelText>
              <EditTextareaBox
                name="refundExplanation"
                value={refundExplanation}
                onChange={(e) => setRefundExplanation(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "top",
              }}
            >
              <LabelText style={{ marginTop: "10px" }}>
                서비스 문의/안내
              </LabelText>
              <EditTextareaBox
                name="serviceExplanation"
                value={serviceExplanation}
                onChange={(e) => setServiceExplanation(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "top",
              }}
            >
              <LabelText style={{ marginTop: "10px" }}>
                썸네일 이미지
                <div style={{ width: "10px", color: "red" }}>*</div>
              </LabelText>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "left",
                }}
              >
                {mainImageFile == undefined ? (
                  <PreviewImageAlt>메인 썸네일</PreviewImageAlt>
                ) : (
                  <PreviewImage id="mainImagePreview" />
                )}

                <FileUpload
                  type="file"
                  id="uploadMainImage"
                  accept=".png,.jpg,.jpeg,.svg"
                  onChange={(e) => {
                    if (e.target.files) {
                      setMainImageFile(e.target.files[0]);
                    }
                  }}
                />
                <Space h={12} />
                <FileUploadButton htmlFor="uploadMainImage">
                  추가
                </FileUploadButton>
              </div>
              <Space w={20} />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "left",
                }}
              >
                {thumbnailImageFile == undefined ? (
                  <PreviewImageAlt>
                    마우스
                    <br />
                    후버이미지
                  </PreviewImageAlt>
                ) : (
                  <PreviewImage id="thumbnailImagePreview" />
                )}

                <FileUpload
                  type="file"
                  id="uploadThumbnailImage"
                  accept=".png,.jpg,.jpeg,.svg"
                  onChange={(e) => {
                    if (e.target.files) {
                      setThumbnailImageFile(e.target.files[0]);
                    }
                  }}
                />
                <Space h={12} />
                <FileUploadButton htmlFor="uploadThumbnailImage">
                  추가
                </FileUploadButton>
              </div>
            </div>
            <Space h={30} />
            <div
              style={{
                display: "flex",
              }}
            >
              <LabelText />
              <InfoBox style={{ width: "800px" }}>
                상품 이미지는 가로 1000 세로 1250 의 4:5 배율로 업로드
                부탁드립니다.
                <br />
                흰 배경의 누끼 이미지로 업로드 부탁드립니다.
                <br />
                <br />
                이미지 가이드라인을 따르지 않을 경우,업로드가 지연될 수
                있습니다.
              </InfoBox>
            </div>
            <Space h={10} />
            <div
              style={{
                display: "flex",
              }}
            >
              <LabelText style={{ marginTop: "10px" }}>
                상세페이지 이미지
                <div style={{ width: "10px", color: "red" }}>*</div>
              </LabelText>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto auto auto auto",
                  gap: "10px",
                }}
              >
                {detailImageFileList.map((item, index) => {
                  return (
                    <div
                      key={`DetailImageItem_${index}`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "left",
                      }}
                    >
                      {detailImageFileList[index] == undefined ? (
                        <PreviewImageAlt>{index + 1}</PreviewImageAlt>
                      ) : (
                        <PreviewImage id={`detailImagePreview_${index}`} />
                      )}
                      <FileUpload
                        type="file"
                        id={`uploadDetailImage_${index}`}
                        accept=".png,.jpg,.jpeg,.svg"
                        onChange={(e) => {
                          if (e.target.files) {
                            editDetailImage(index, e.target.files[0]);
                          }
                        }}
                      />
                      <Space h={12} />
                      <div style={{ display: "flex" }}>
                        <FileUploadButton
                          htmlFor={`uploadDetailImage_${index}`}
                        >
                          추가
                        </FileUploadButton>
                        <Space w={10} />
                        <FileUploadButton
                          onClick={() => {
                            editDetailImage(index, undefined);
                          }}
                        >
                          삭제
                        </FileUploadButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ height: "100px" }} />
            <div style={{ display: "flex" }}>
              <LabelText />
              <ListButton
                type="submit"
                style={{
                  width: "225px",
                  height: "60px",
                  fontSize: "22px",
                }}
                onClick={async () => {
                  if (checkRequirements()) {
                    setIsLoading(true);
                    await submitProduct();
                    setIsLoading(false);
                  }
                }}
              >
                상품 검수요청
              </ListButton>
            </div>
            <div style={{ height: "100px" }} />
          </div>
        </PageLayout>
      ) : (
        <PageLayout>
          <InfoBox>
            로파서울에서는 모든 상품들이 아닌, 엄선한 상품들만 업로드 승인을
            하고 있습니다.
            <br />
            또 때로는 로파서울 측에서 이미지 재촬영 후 상품 업로드를 진행하여
            <br />
            업로드까지 시일이 오래 걸리는 경우도 있습니다. <br />
            <br />
            비록 타 플랫폼처럼 빠르게 업로드가 진행되지 못하더라도, 고객님들과
            개별 브랜드/ 작가님들께 유의미한 제안을 하고자 <br />
            로파서울이 유지하고 있는 정책이니 파트너분들의 너른 양해
            부탁드립니다.
          </InfoBox>
          <BlackButton
            onClick={() => {
              if (isLoadedProduct) {
                resetAddProductModal();
                setIsLoadedProduct(false);
              }
              setIsAddProductMenuOpened(true);
            }}
          >
            상품 추가
          </BlackButton>
          <Space h={40} />
          <div
            style={{ backgroundColor: "black", height: 1, width: "100%" }}
          ></div>
          <div style={{ fontSize: "28px", padding: "16px" }}>
            신청한 상품 목록
          </div>
          <div style={{ overflowY: "auto", width: "inherit" }}>
            {loadedProducts.map((item, index) => {
              if (Math.floor(index / 3) == pageIndex) {
                return (
                  <LoadedProductItem key={`LoadedProductItems_${index}`}>
                    <LoadedProductThumbnail src={item.mainImageURL} />
                    <div
                      style={{
                        width: "calc(100% - 320px)",
                        marginLeft: "10px",
                        lineHeight: "28px",
                        textAlign: "left",
                      }}
                    >
                      {item.productName}
                    </div>
                    <Space w={10} />
                    <div
                      style={{
                        color:
                          item.status == "승인대기"
                            ? "black"
                            : item.status == "승인거부"
                            ? "red"
                            : item.status == "승인완료"
                            ? "blue"
                            : "grey",
                        width: "90px",
                        lineHeight: "28px",
                      }}
                    >
                      {item.status}
                    </div>
                    <Space w={10} />
                    <DetailButton
                      onClick={async () => {
                        setIsLoading(true);
                        await loadAddProductModal(item);
                        setIsLoadedProduct(true);
                        setIsAddProductMenuOpened(true);
                        setLoadedProduct(item);
                        setIsLoading(false);
                      }}
                    >
                      자세히
                    </DetailButton>
                  </LoadedProductItem>
                );
              }
            })}
          </div>
          <Space h={10} />
          <PageIndex
            pageCount={Math.ceil(loadedProducts.length / 3)}
            currentIndex={pageIndex}
            onIndexClick={(index: number) => {
              setPageIndex(index);
            }}
          />
        </PageLayout>
      )}
    </>
  );
}

function replaceLinebreak(str: string) {
  return str.split("\n").join("<br />");
}

function replaceBr(str: string) {
  return str.split("<br />").join("\n");
}

function replaceComma(str: string) {
  return str.split(",").join("|");
}

function replaceVerticalBar(str: string) {
  return str.split("|").join(",");
}

function checkDuplicateFileName(list: any[]) {
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (
        list[i] instanceof File &&
        list[j] instanceof File &&
        list[i].name == list[j].name
      ) {
        return false;
      }
    }
  }
  return true;
}

async function downloadFile(url: string, fileName: string) {
  let file: File = await fetch(url)
    .then((response) => response.blob())
    .then((blob) => new File([blob], fileName));
  return file;
}

function PageIndex({
  pageCount,
  currentIndex,
  onIndexClick,
}: {
  pageCount: number;
  currentIndex: number;
  onIndexClick: (index: number) => void;
}) {
  let arr = [];
  for (let i = 0; i < pageCount; i++) {
    arr.push(i);
  }
  return (
    <div style={{ display: "flex", width: "100%", justifyContent: "center" }}>
      {arr.map((item, index) => (
        <div
          style={{
            fontWeight: item == currentIndex ? 700 : 400,
            margin: 5,
            cursor: "pointer",
          }}
          onClick={() => {
            onIndexClick(item);
          }}
        >
          {item + 1}
        </div>
      ))}
    </div>
  );
}
