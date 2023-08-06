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

const FileUploadButton = styled.label`
  font-size: 16px;
  background-color: darkgrey;
  width: 100px;
  height: 32px;
  margin: 4px;
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

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const actionType = body.get("actionType")?.toString();
  if (actionType == "add" || actionType == "update") {
    const partnerName = body.get("partnerName")?.toString();
    const productName = body.get("productName")?.toString();
    const englishProductName = body.get("englishProductName")?.toString();
    const explanation = body.get("explanation")?.toString();
    const keyword = body.get("keyword")?.toString();
    const sellerPrice = Number(body.get("sellerPrice")?.toString());
    const isUsingOption = body.get("isUsingOption")?.toString() == "true";
    const option = body.get("option")?.toString();
    const refundExplanation = body.get("refundExplanation")?.toString();
    const serviceExplanation = body.get("serviceExplanation")?.toString();

    const mainImageFile = body.get("mainImageFile");
    const thumbnailImageFile = body.get("thumbnailImageFile");
    const detailImageFileList = body.getAll("detailImageFileList");

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
        refundExplanation: refundExplanation,
        serviceExplanation: serviceExplanation,
        mainImageFile: mainImageFile,
        thumbnailImageFile: thumbnailImageFile,
        detailImageFileList: detailImageFileList,
        status: "승인대기",
      };

      //수정일 경우 기존 삭제 후 새로 올리는 형식으로
      if (actionType == "update") {
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
      console.log("PRODUCT: ", product);

      if (result == null) {
        return {
          isWaiting: true,
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
        return json({ isWaiting: true, progress: result });
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

    if (detailImageFileList.length == 0) {
      setNotice("상세 페이지 이미지를 최소 1개 등록해야 합니다.");
      setIsNoticeModalOpened(true);
      return false;
    }

    if (!checkDuplicateFileName(detailImageFileList)) {
      setNotice("상세 페이지 이미지 파일들은 이름이 서로 달라야 합니다.");
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

      if (keywordList[i].includes(",")) {
        setNotice("쉼표(,)는 검색어에 들어갈 수 없습니다.");
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

      if (optionList[i].includes("//")) {
        setNotice("'//' 문자열은 옵션에 들어갈 수 없습니다.");
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
      if (
        detailImageFileList[i] == undefined ||
        typeof detailImageFileList[i] == "undefined"
      ) {
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
    let newKeyword = "";
    for (let i = 0; i < keywordList.length; i++) {
      newKeyword += keywordList[i];
      if (i < keywordList.length - 1) {
        newKeyword += ",";
      }
    }
    let newOption = "";
    for (let i = 0; i < optionList.length; i++) {
      newOption += optionList[i];
      if (i < optionList.length - 1) {
        newOption += "//";
      }
    }

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
    formData.set("keyword", newKeyword);
    formData.set("sellerPrice", sellerPrice.toString());
    formData.set("isUsingOption", isUsingOption.toString());
    formData.set("option", newOption);
    formData.set("refundExplanation", newRefundExplanation);
    formData.set("serviceExplanation", newServiceExplanation);
    formData.set("mainImageFile", mainImageFile);
    formData.set("thumbnailImageFile", thumbnailImageFile);
    for (let i = 0; i < detailImageFileList.length; i++) {
      formData.append("detailImageFileList", detailImageFileList[i]);
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
    if (product.keyword.length == 0) {
      setKeywordList([]);
    } else {
      setKeywordList(product.keyword.split(","));
    }
    setSellerPrice(product.sellerPrice);
    setIsUsingOption(product.isUsingOption);
    if (product.option.length == 0) {
      setOptionList([]);
    } else {
      setOptionList(product.option.split("//"));
    }

    const mainFile = await downloadFile(
      product.mainImageURL,
      product.mainImageName
    );
    const thumbnailFile = await downloadFile(
      product.thumbnailImageURL,
      product.thumbnailImageName
    );
    const detailFileList = [];
    for (let i = 0; i < product.detailImageURLList.length; i++) {
      detailFileList.push(
        await downloadFile(
          product.detailImageURLList[i],
          product.detailImageNameList[i]
        )
      );
    }
    setMainImageFile(mainFile);
    setThumbnailImageFile(thumbnailFile);
    setDetailImageFileList(detailFileList);
    setRefundExplanation(replaceBr(product.refundExplanation));
    setServiceExplanation(replaceBr(product.serviceExplanation));
  }

  //입력란 초기화
  function resetAddProductModal() {
    setProductName("");
    setEnglishProductName("");
    setExplanation("");
    setKeywordList([]);
    setSellerPrice(0);
    setIsUsingOption(false);
    setOptionList([]);
    setMainImageFile(undefined);
    setThumbnailImageFile(undefined);
    setDetailImageFileList([]);
    setRefundExplanation("");
    setServiceExplanation("");
  }

  //결과로 오는 거 바탕으로 안내모달
  useEffect(() => {
    if (actionData !== undefined && actionData !== null) {
      if (actionData.isWaiting) {
        setImageUploadProgress(actionData.progress);
      } else {
        console.log(actionData);
        setIsUploadInProgress(false);
        setNotice(actionData.message);
        setIsNoticeModalOpened(true);
        //성공했으면 모달 닫기
        if (actionData.status == "ok") {
          clearInterval(queryIntervalId);
          setImageUploadProgress(0);
          setIsAddProductModalOpened(false);
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
    }
  }, [thumbnailImageFile]);

  useEffect(() => {
    for (let i = 0; i < detailImageFileList.length; i++) {
      if (detailImageFileList[i] !== undefined) {
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

  return (
    <>
      <LoadingOverlay visible={isLoading} overlayBlur={2} />

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
                    key={`KeywordItem-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: "start",
                    }}
                  >
                    <EditInputBox
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
                      key={`OptionItem-${index}`}
                      style={{
                        display: "flex",
                        justifyContent: "start",
                      }}
                    >
                      <LongEditInputBox2
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
                {optionList.length > 0 ? (
                  <div style={{ fontSize: "16px", textAlign: "start" }}>
                    {"예시) 컬러{빨강|파랑|초록}"}
                  </div>
                ) : (
                  <></>
                )}

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
            <FileUploadButton htmlFor="uploadMainImage">
              파일 선택
            </FileUploadButton>
            <div style={{ fontSize: "12px", fontWeight: "400" }}>
              {mainImageFile?.name}
            </div>
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
            <FileUploadButton htmlFor="uploadThumbnailImage">
              파일 선택
            </FileUploadButton>
            <div style={{ fontSize: "12px", fontWeight: "400" }}>
              {thumbnailImageFile?.name}
            </div>
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
                marginTop: "8px",
              }}
            >
              상세 페이지 이미지
              <div style={{ width: "10px", color: "red" }}>*</div>
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
                    key={`DetailImageItem_${index}`}
                    style={{
                      display: "flex",
                      justifyContent: "start",
                      alignItems: "center",
                    }}
                  >
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
                    <FileUploadButton htmlFor={`uploadDetailImage_${index}`}>
                      파일 선택
                    </FileUploadButton>
                    <div style={{ fontSize: "12px", fontWeight: "400" }}>
                      {detailImageFileList[index]?.name}
                    </div>
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
              {isLoadedProduct ? "닫기" : "취소"}
            </ModalButton>
            <ModalButton
              type="submit"
              onClick={async () => {
                if (checkRequirements()) {
                  setIsLoading(true);
                  await submitProduct();
                  setIsUploadInProgress(true);
                  setIsLoading(false);
                }
              }}
            >
              {isLoadedProduct ? "수정" : "추가"}
            </ModalButton>
            {isLoadedProduct ? (
              <ModalButton
                type="submit"
                onClick={async () => {
                  setIsLoading(true);
                  await deleteProduct();
                  setIsLoading(false);
                }}
              >
                삭제
              </ModalButton>
            ) : (
              <></>
            )}
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

      <PageLayout>
        <BlackButton
          onClick={() => {
            if (isLoadedProduct) {
              resetAddProductModal();
              setIsLoadedProduct(false);
            }
            setIsAddProductModalOpened(true);
          }}
        >
          상품 추가
        </BlackButton>
        <div style={{ fontSize: "28px", padding: "16px" }}>
          신청한 상품 목록
        </div>
        <Space h={10} />
        <div style={{ overflowY: "auto", width: "inherit" }}>
          {loadedProducts.map((item, index) => {
            return (
              <div
                key={`LoadedProductItems_${index}`}
                style={{
                  display: "flex",
                  width: "inherit",
                  alignItems: "center",
                  backgroundColor: "#ebebeb4d",
                  padding: "10px",
                  marginTop: "8px",
                  lineHeight: "1",
                }}
              >
                <div
                  style={{
                    width: "calc(100% - 200px)",
                    marginLeft: "10px",
                    lineHeight: "16px",
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
                        : "blue",
                    width: "90px",
                  }}
                >
                  {item.status}
                </div>
                <Space w={10} />
                <ListButton
                  onClick={async () => {
                    setIsLoading(true);
                    await loadAddProductModal(item);
                    setIsLoadedProduct(true);
                    setIsAddProductModalOpened(true);
                    setLoadedProduct(item);
                    setIsLoading(false);
                  }}
                >
                  자세히
                </ListButton>
              </div>
            );
          })}
        </div>
      </PageLayout>
    </>
  );
}

function replaceLinebreak(str: string) {
  return str.split("\n").join("<br />");
}

function replaceBr(str: string) {
  return str.split("<br />").join("\n");
}

function checkDuplicateFileName(list: any[]) {
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (
        !(list[i] instanceof File) ||
        !(list[j] instanceof File) ||
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
