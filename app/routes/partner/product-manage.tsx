import { LoadingOverlay, Space } from "@mantine/core";
import {
  ActionFunction,
  LoaderFunction,
  json,
  redirect,
} from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useSubmit,
  useNavigation,
} from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { BlackButton } from "~/components/button";
import { getIdFromTime } from "~/components/date";
import { BasicModal, ModalButton } from "~/components/modal";
import { PageLayout } from "~/components/page_layout";
import { LoadedProduct, Product } from "~/components/product";
import {
  addProduct,
  deleteProduct,
  getPartnerProducts,
  uploadProductImage,
} from "~/services/firebase/product.server";
import { requireUser } from "~/services/session.server";
import { sanitizeFileName } from "~/utils/filename";
import { cropImage, resizeFile } from "~/utils/resize-image";

type ImageUsage = "main" | "thumbnail" | "detail" | "extra";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  styleoverrides?: React.CSSProperties;
}

function EditInputBox(props: InputProps) {
  const styles: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 700,
    width: "360px",
    height: "34px",
    marginTop: "10px",
    marginBottom: "10px",
    border: "1px solid black",
    ...props.styleoverrides,
  };

  return <input style={styles} {...props} />;
}

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  styleoverrides?: React.CSSProperties;
}

function InfoBox(props: Props) {
  const styles: React.CSSProperties = {
    backgroundColor: "#f2f2f2",
    paddingTop: "20px",
    paddingLeft: "25px",
    paddingRight: "25px",
    paddingBottom: "20px",
    textAlign: "left",
    fontSize: "18px",
    lineHeight: "26px",
    ...props.styleoverrides,
  };

  return <div style={styles} {...props} />;
}

function LongEditInputBox(props: InputProps) {
  const styles: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 700,
    width: "800px",
    height: "34px",
    marginTop: "10px",
    marginBottom: "10px",
    border: "1px solid black",
    ...props.styleoverrides,
  };

  return <input style={styles} {...props} />;
}

function EditTextareaBox(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  const styles: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 400,
    width: "568px",
    marginTop: "10px",
    marginBottom: "10px",
    resize: "vertical",
    border: "1px solid black",
  };

  return <textarea style={styles} {...props} />;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  styleoverrides?: React.CSSProperties;
}

function ListButton(props: ButtonProps) {
  const styles: React.CSSProperties = {
    fontSize: "16px",
    backgroundColor: "black",
    width: "60px",
    height: "32px",
    marginTop: "10px",
    marginBottom: "10px",
    color: "white",
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
    ...props.styleoverrides,
  };

  return <button style={styles} {...props} />;
}

function DetailButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles: React.CSSProperties = {
    fontSize: "20px",
    backgroundColor: "black",
    width: "95px",
    height: "32px",
    color: "white",
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
  };

  return <button style={styles} {...props} />;
}

function FileUploadButton(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const styles: React.CSSProperties = {
    fontSize: "16px",
    backgroundColor: "black",
    width: "60px",
    height: "32px",
    color: "white",
    border: "none",
    fontWeight: 700,
    lineHeight: 1.8,
    cursor: "pointer",
  };

  return <label style={styles} {...props} />;
}

function FileUpload(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const styles: React.CSSProperties = {
    width: 0,
    height: 0,
    padding: 0,
    overflow: "hidden",
    border: 0,
  };

  return <input style={styles} {...props} />;
}

function LoadedProductItem(props: React.HTMLAttributes<HTMLDivElement>) {
  const styles: React.CSSProperties = {
    display: "flex",
    width: "inherit",
    alignItems: "top",
    backgroundColor: "#ebebeb4d",
    padding: "10px",
    marginBottom: "6px",
    lineHeight: 1,
  };

  return <div style={styles} {...props} />;
}

function LoadedProductThumbnail(
  props: React.ImgHTMLAttributes<HTMLImageElement>
) {
  const styles: React.CSSProperties = {
    objectFit: "contain",
    width: "100px",
    height: "100px",
  };

  return <img style={styles} {...props} />;
}

function LabelText(props: Props) {
  const styles: React.CSSProperties = {
    fontSize: "24px",
    display: "flex",
    justifyContent: "left",
    width: "200px",
    fontWeight: 700,
    lineHeight: "35px",
    ...props.styleoverrides,
  };

  return <div style={styles} {...props} />;
}

function HintText(props: React.HTMLAttributes<HTMLDivElement>) {
  const styles: React.CSSProperties = {
    fontSize: "18px",
    color: "#acacac",
    lineHeight: "26px",
    fontWeight: 700,
    textAlign: "left",
  };

  return <div style={styles} {...props} />;
}

function PreviewImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const styles: React.CSSProperties = {
    width: "133px",
    height: "168px",
    objectFit: "contain",
    border: "1px solid black",
    backgroundColor: "#f8f8f8",
    color: "black",
    marginTop: "10px",
  };

  return <img style={styles} {...props} />;
}

function PreviewImageAlt(props: React.HTMLAttributes<HTMLDivElement>) {
  const styles: React.CSSProperties = {
    width: "133px",
    height: "168px",
    border: "1px solid black",
    backgroundColor: "#f8f8f8",
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
    color: "#9d9d9d",
    fontSize: "20px",
    fontWeight: 700,
    display: "flex",
    marginTop: "10px",
  };

  return <div style={styles} {...props} />;
}

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const actionType = body.get("actionType")?.toString();

  if (
    actionType == "add" ||
    actionType == "update" ||
    actionType == "tempsave-add" ||
    actionType == "tempsave-update"
  ) {
    const id = body.get("id")?.toString();
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
    const mainName = body.get("mainName")?.toString();
    const mainURL = body.get("mainURL")?.toString();
    const thumbnailURL = body.get("thumbnailURL")?.toString();
    const thumbnailName = body.get("thumbnailName")?.toString();
    const detailURLList = body.getAll("detailURL");
    const detailNameList = body.getAll("detailName");
    const extraURLList = body.getAll("extraURL");
    const extraNameList = body.getAll("extraName");

    const isTempSave =
      actionType == "tempsave-add" || actionType == "tempsave-update";

    if (
      id !== undefined &&
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
      serviceExplanation !== undefined
    ) {
      const product: Product = {
        id: id,
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
        status: isTempSave ? "임시저장" : "승인대기",
        mainImageName: mainName,
        mainImageURL: mainURL,
        thumbnailImageName: thumbnailName,
        thumbnailImageURL: thumbnailURL,
        detailImageNameList: detailNameList.map((val) => val.toString()),
        detailImageURLList: detailURLList.map((val) => val.toString()),
        extraImageURLList: extraURLList.map((val) => val.toString()),
        extraImageNameList: extraNameList.map((val) => val.toString()),
      };

      //수정일 경우 기존 삭제 후 새로 올리는 형식으로
      if (actionType == "update" || actionType == "tempsave-update") {
        const prevProductName = body.get("prevProductName")?.toString();
        if (prevProductName !== undefined || prevProductName == "") {
          const result = await deleteProduct({
            productName: prevProductName,
            isDeletingStorage: false,
          });
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
          message: "상품 등록이 완료되었습니다.",
          type: "upload-complete",
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
          message: `상품 삭제 과정에서 문제가 발생했습니다.${"\n"}${result}`,
          status: "error",
        });
      } else {
        return json({ message: `상품이 삭제되었습니다.`, status: "ok" });
      }
    } else {
      return json({
        message: `상품 삭제 과정에서 발생했습니다. 기존 상품 정보의 이름이 누락되었습니다. 관리자에게 문의해주세요.`,
        status: "error",
      });
    }
  } else if (actionType == "upload-image") {
    const id = body.get("id")?.toString();
    const file = body.get("file");
    const usage = body.get("usage")?.toString();
    const filename = body.get("filename")?.toString();
    const index = Number(body.get("index")?.toString() ?? "-1");
    if (
      id !== undefined &&
      file instanceof File &&
      usage !== undefined &&
      filename !== undefined
    ) {
      const downloadURL = await uploadProductImage(file, usage, id, index);
      console.log(`${usage} image uploaded`, downloadURL);
      return json({
        status: "ok",
        type: "downloadURL",
        usage: usage,
        index: index,
        url: downloadURL,
      });
    } else {
      console.log("error");
      return json({
        message: `이미지 업로드 과정에서 문제가 발생했습니다. 관리자에게 문의해주세요.`,
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
  const [optionCategoryList, setOptionCategoryList] = useState<string[]>([""]); //옵션 카테고리 목록
  const [optionDetailList, setOptionDetailList] = useState<string[]>([""]); //옵션 세부항목 목록
  const [mainImageFile, setMainImageFile] = useState<File>(); //메인 이미지 (필수)
  const [mainImageURL, setMainImageURL] = useState<string>();
  const [thumbnailImageFile, setThumbnailImageFile] = useState<File>(); //썸네일 이미지 (필수)
  const [thumbnailImageURL, setThumbnailImageUrl] = useState<string>();
  const [detailImageFileList, setDetailImageFileList] = useState<
    (File | undefined)[]
  >(Array(8).fill(undefined)); //상세 이미지 - 좌우슬라이드 (최소 1개 필수)
  const [detailImageURLList, setDetailImageURLList] = useState<
    (string | undefined)[]
  >(Array(8).fill(undefined)); //상세 이미지 - 좌우슬라이드 (최소 1개 필수)
  const [extraImageFileList, setExtraImageFileList] = useState<
    (File | undefined)[]
  >(Array(8).fill(undefined)); //상세 이미지 - 하단첨부
  const [extraImageURLList, setExtraImageURLList] = useState<
    (string | undefined)[]
  >(Array(8).fill(undefined)); //상세 이미지 - 하단첨부
  const [memo, setMemo] = useState<string>(""); // 옵션 별 가격 설정 및 관리자 전달 메모
  const [refundExplanation, setRefundExplanation] = useState<string>(""); //교환/반품안내
  const [serviceExplanation, setServiceExplanation] = useState<string>(""); //서비스문의/안내

  const [id, setId] = useState<string>(""); // 상품정보 식별 ID

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

  //로딩 중
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //현재 보고 있는 신청한 상품 목록 페이지 번호
  //유저한테 보이는 값은 여기서 +1
  const [pageIndex, setPageIndex] = useState<number>(0);

  const loaderData = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
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

  function editExtraImage(index: number, val: File | undefined) {
    const newExtraImageList = extraImageFileList.map((item, i) => {
      if (i == index) {
        return val;
      } else {
        return item;
      }
    });
    setExtraImageFileList(newExtraImageList);
  }

  function editDetailImageURL(index: number, val: string | undefined) {
    const newDetailURLList = detailImageURLList.map((item, i) => {
      if (i == index) {
        return val;
      } else {
        return item;
      }
    });
    setDetailImageURLList(newDetailURLList);
  }

  function editExtraImageURL(index: number, val: string | undefined) {
    const newExtraURLList = extraImageURLList.map((item, i) => {
      if (i == index) {
        return val;
      } else {
        return item;
      }
    });
    setExtraImageURLList(newExtraURLList);
  }

  //필수 입력 내용을 전부 제대로 입력했는지
  function checkRequirements() {
    if (productName.length == 0) {
      setNotice("상품명을 입력해야 합니다.");
      setIsNoticeModalOpened(true);
      return false;
    }

    if (productName.includes("/")) {
      setNotice("상품명에 '/'가 들어갈 수 없습니다.");
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

    if (!checkDuplicateFileName(extraImageFileList)) {
      setNotice("상세 페이지 이미지 파일들은 이름이 서로 달라야 합니다.");
      setIsNoticeModalOpened(true);
      return false;
    }

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

    return true;
  }

  //새 상품정보를 등록하기 위한 초기화 과정
  function initializeNewProduct() {
    const newId = getIdFromTime();
    resetAddProductModal();
    setId(newId);
    console.log("Product ID: ", newId);
    setIsAddProductMenuOpened(true);
    setIsLoadedProduct(false);
  }

  async function submitProductData(isTempSave = false) {
    const partnerName = loaderData.partnerName;
    if (partnerName == undefined) {
      setNotice(
        "프로필을 불러오는 것에 실패했습니다. 오류가 반복될 경우 관리자에게 문의해주세요."
      );
      setIsNoticeModalOpened(true);
      return false;
    }
    const newProductName = `[${partnerName}] ${productName}`;

    //Add data except files
    const formData: any = new FormData(formRef.current ?? undefined);
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
      let parsedOption = optionCategoryList[i];
      parsedOption += "{";
      parsedOption += replaceComma(optionDetailList[i]);
      parsedOption += "}";
      newOption += parsedOption;
      if (i < optionCategoryList.length - 1) {
        newOption += "//";
      }
    }

    if (isLoadedProduct) {
      if (isTempSave) {
        formData.set("actionType", "tempsave-update");
        formData.set("prevProductName", loadedProduct?.productName ?? "");
      } else {
        formData.set("actionType", "update");
        formData.set("prevProductName", loadedProduct?.productName ?? "");
      }
    } else {
      if (isTempSave) {
        formData.set("actionType", "tempsave-add");
      } else {
        formData.set("actionType", "add");
      }
    }

    formData.set("id", id);
    formData.set("partnerName", partnerName);
    formData.set("productName", newProductName);
    formData.set("englishProductName", newEnglishProductName);
    formData.set("explanation", newExplanation);
    formData.set("keyword", keyword ?? "");
    formData.set("sellerPrice", sellerPrice.toString());
    formData.set("isUsingOption", newOption.length > 0 ? "true" : "false");
    formData.set("option", newOption);
    formData.set("memo", memo);
    formData.set("refundExplanation", newRefundExplanation);
    formData.set("serviceExplanation", newServiceExplanation);
    formData.set("mainName", mainImageFile?.name);
    formData.set("mainURL", mainImageURL);
    formData.set("thumbnailName", thumbnailImageFile?.name);
    formData.set("thumbnailURL", thumbnailImageURL);
    for (let i = 0; i < detailImageFileList.length; i++) {
      if (detailImageFileList[i]) {
        formData.append("detailURL", detailImageURLList[i]);
        formData.append("detailName", detailImageFileList[i]?.name);
      }
    }
    for (let i = 0; i < extraImageFileList.length; i++) {
      if (extraImageFileList[i]) {
        formData.append("extraURL", extraImageURLList[i]);
        formData.append("extraName", extraImageFileList[i]?.name);
      }
    }

    submit(formData, { method: "post" });
  }

  async function submitUploadImage(
    file: File,
    usage: ImageUsage,
    index?: number
  ) {
    let formData: any = new FormData(formRef.current ?? undefined);
    formData.set("actionType", "upload-image");
    formData.set("id", id);
    formData.set("file", file);
    formData.set("filename", sanitizeFileName(file.name));
    formData.set("usage", usage);
    switch (usage) {
      case "detail":
      case "extra":
        formData.set("index", index);
        break;
    }
    submit(formData, {
      method: "post",
      encType: "multipart/form-data",
    });
  }

  //현재 보고 있는 상품 삭제 요청
  async function deleteProduct() {
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("actionType", "delete");
    formData.set("productName", loadedProduct?.productName ?? "");
    submit(formData, { method: "post" });
  }

  //LoadedProduct로 상품정보, 입력란 업데이트
  async function loadAddProductModal(product: LoadedProduct) {
    console.log("Product ID: ", product.id);
    setId(product.id);
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
    const extraFileList = Array(8).fill(undefined);
    const detailURLList = Array(8).fill(undefined);
    const extraURLList = Array(8).fill(undefined);
    for (let i = 0; i < product.detailImageURLList.length; i++) {
      detailFileList[i] = await downloadFile(
        product.detailImageURLList[i],
        product.detailImageNameList[i]
      );
      detailURLList[i] = product.detailImageURLList[i];
    }

    for (let i = 0; i < product.extraImageURLList.length; i++) {
      extraFileList[i] = await downloadFile(
        product.extraImageURLList[i],
        product.extraImageNameList[i]
      );
      extraURLList[i] = product.extraImageURLList[i];
    }
    setMainImageFile(mainFile);
    setMainImageURL(product.mainImageURL);
    setThumbnailImageFile(thumbnailFile);
    setThumbnailImageUrl(product.thumbnailImageURL);
    setDetailImageFileList(detailFileList);
    setDetailImageURLList(detailURLList);
    setExtraImageFileList(extraFileList);
    setExtraImageURLList(extraURLList);
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
    setOptionCategoryList([""]);
    setOptionDetailList([""]);
    setMainImageFile(undefined);
    setThumbnailImageFile(undefined);
    setDetailImageFileList(Array(8).fill(undefined));
    setExtraImageFileList(Array(8).fill(undefined));
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
      if (actionData.status == "error") {
        setNotice(`오류가 발생했습니다. ${actionData.message}`);
        setIsNoticeModalOpened(true);
      } else {
        if (actionData.type == "downloadURL") {
          switch (actionData.usage) {
            case "main":
              setMainImageURL(actionData.url);
              break;
            case "thumbnail":
              setThumbnailImageUrl(actionData.url);
              break;
            case "detail":
              editDetailImageURL(actionData.index, actionData.url);
              break;
            case "extra":
              editExtraImageURL(actionData.index, actionData.url);
              break;
          }
        } else if ((actionData.type = "upload-complete")) {
          setIsAddProductMenuOpened(false);
          setNotice(`${actionData.message}`);
          setIsNoticeModalOpened(true);
        } else {
          setNotice(`${actionData.message}`);
          setIsNoticeModalOpened(true);
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
      if (mainImageFile.size > 3 * 1024 ** 2) {
        setNotice("업로드할 이미지의 크기는 3MB를 넘을 수 없습니다.");
        setIsNoticeModalOpened(true);
        setMainImageFile(undefined);
        setMainImageURL(undefined);
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
        setMainImageURL(undefined);
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
      if (thumbnailImageFile.size > 3 * 1024 ** 2) {
        setNotice("업로드할 이미지의 크기는 3MB를 넘을 수 없습니다.");
        setIsNoticeModalOpened(true);
        setThumbnailImageFile(undefined);
        setThumbnailImageUrl(undefined);
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
        setThumbnailImageUrl(undefined);
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
        if (file.size > 3 * 1024 ** 2) {
          setNotice("업로드할 이미지의 크기는 3MB를 넘을 수 없습니다.");
          setIsNoticeModalOpened(true);
          editDetailImage(i, undefined);
          editDetailImageURL(i, undefined);
          return;
        }

        if (file.name.includes("/") || file.name.includes("|")) {
          setNotice(
            "업로드할 이미지의 이름에 '/' 또는 '|'이 들어갈 수 없습니다."
          );
          setIsNoticeModalOpened(true);
          editDetailImage(i, undefined);
          editDetailImageURL(i, undefined);
          return;
        }

        const preview = document.getElementById(
          `detailImagePreview_${i}`
        ) as HTMLImageElement;
        if (preview) {
          preview.src = URL.createObjectURL(detailImageFileList[i]!);
        } else {
        }
      }
    }
  }, [detailImageFileList]);

  useEffect(() => {
    for (let i = 0; i < extraImageFileList.length; i++) {
      if (
        extraImageFileList[i] !== undefined &&
        extraImageFileList[i] !== null
      ) {
        const file: any = extraImageFileList[i];
        if (file.size > 3 * 1024 ** 2) {
          setNotice("업로드할 이미지의 크기는 3MB를 넘을 수 없습니다.");
          setIsNoticeModalOpened(true);
          editExtraImage(i, undefined);
          editExtraImageURL(i, undefined);
          return;
        }

        if (file.name.includes("/") || file.name.includes("|")) {
          setNotice(
            "업로드할 이미지의 이름에 '/' 또는 '|'이 들어갈 수 없습니다."
          );
          setIsNoticeModalOpened(true);
          editExtraImage(i, undefined);
          editExtraImageURL(i, undefined);
          return;
        }

        const preview = document.getElementById(
          `extraImagePreview_${i}`
        ) as HTMLImageElement;
        if (preview) {
          preview.src = URL.createObjectURL(extraImageFileList[i]!);
        } else {
        }
      }
    }
  }, [extraImageFileList]);

  // return (<div>WIP <br /> 공사중입니다.</div>)

  return (
    <>
      <LoadingOverlay
        visible={isLoading || navigation.state == "submitting"}
        overlayBlur={2}
      />

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
                onClick={() => {
                  setIsAddProductMenuOpened(false);
                  setIsLoadedProduct(false);
                }}
                style={{
                  cursor: "pointer",
                  width: "40px",
                  objectFit: "contain",
                }}
              />
              <Space w={15} />
              <div
                style={{
                  fontSize: "24px",
                  lineHeight: "35px",
                  color: isLoadedProduct ? "blue" : "black",
                }}
              >
                {isLoadedProduct ? `상품 수정` : `상품 추가`}
              </div>
            </div>
            <div style={{ display: "flex" }}>
              <img
                src="/images/icon_trash.svg"
                style={{ cursor: "pointer" }}
                onClick={async () => {
                  setIsLoading(true);
                  if (isLoadedProduct) {
                    await deleteProduct();
                  } else {
                    setIsAddProductMenuOpened(false);
                  }
                  setIsLoading(false);
                }}
              />
              <Space w={20} />
              <img
                src="/images/icon_save.svg"
                style={{ cursor: "pointer" }}
                onClick={async () => {
                  setIsLoading(true);
                  if (checkRequirements()) {
                    await submitProductData(true);
                  }
                  setIsLoading(false);
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
              <LabelText styleoverrides={{ marginTop: "10px" }}>
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
                        styleoverrides={{ width: "200px" }}
                        value={optionCategoryList[index]}
                        onChange={(e) =>
                          editOptionCategory(index, e.target.value)
                        }
                      />
                      <Space w={10} />
                      <EditInputBox
                        styleoverrides={{ width: "400px" }}
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
              <LabelText styleoverrides={{ textAlign: "left" }}>
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
              <LabelText styleoverrides={{ marginTop: "10px" }}>
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
              <LabelText styleoverrides={{ marginTop: "10px" }}>
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

            <Space h={30} />

            <div
              style={{
                display: "flex",
                alignItems: "top",
              }}
            >
              <LabelText styleoverrides={{ marginTop: "10px" }}>
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
                  onChange={async (e) => {
                    setIsLoading(true);
                    if (e.target.files) {
                      const resizedFile = await resizeFile(e.target.files[0]);
                      const croppedFile = await cropImage(
                        resizedFile,
                        1000,
                        1250
                      );
                      setMainImageFile(croppedFile);
                      submitUploadImage(croppedFile, "main");
                    }
                    setIsLoading(false);
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
                  onChange={async (e) => {
                    setIsLoading(true);
                    if (e.target.files) {
                      const resizedFile = await resizeFile(e.target.files[0]);
                      const croppedFile = await cropImage(
                        resizedFile,
                        1000,
                        1250
                      );
                      setThumbnailImageFile(croppedFile);
                      submitUploadImage(croppedFile, "thumbnail");
                    }
                    setIsLoading(false);
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
              <InfoBox styleoverrides={{ width: "800px" }}>
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
              <LabelText
                styleoverrides={{
                  marginTop: "10px",
                  textAlign: "left",
                  fontSize: "22px",
                }}
              >
                상세페이지 <br />
                좌우슬라이드 이미지
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
                        onChange={async (e) => {
                          setIsLoading(true);
                          if (e.target.files) {
                            const resizedFile = await resizeFile(
                              e.target.files[0]
                            );
                            const croppedFile = await cropImage(
                              resizedFile,
                              1000,
                              1250
                            );
                            editDetailImage(index, croppedFile);
                            submitUploadImage(croppedFile, "detail", index);
                          }
                          setIsLoading(false);
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
                            editDetailImageURL(index, undefined);
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

            <Space h={20} />
            <div
              style={{
                display: "flex",
              }}
            >
              <LabelText
                styleoverrides={{
                  marginTop: "10px",
                  textAlign: "left",
                  fontSize: "22px",
                }}
              >
                상세페이지 <br />
                하단 첨부 이미지
              </LabelText>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto auto auto auto",
                  gap: "10px",
                }}
              >
                {extraImageFileList.map((item, index) => {
                  return (
                    <div
                      key={`ExtraImageItem_${index}`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "left",
                      }}
                    >
                      {extraImageFileList[index] == undefined ? (
                        <PreviewImageAlt>{index + 1}</PreviewImageAlt>
                      ) : (
                        <PreviewImage id={`extraImagePreview_${index}`} />
                      )}
                      <FileUpload
                        type="file"
                        id={`uploadExtraImage_${index}`}
                        accept=".png,.jpg,.jpeg,.svg"
                        onChange={async (e) => {
                          setIsLoading(true);
                          if (e.target.files) {
                            const resizedFile = await resizeFile(
                              e.target.files[0],
                              false
                            );
                            editExtraImage(index, resizedFile);
                            submitUploadImage(resizedFile, "extra", index);
                          }
                          setIsLoading(false);
                        }}
                      />
                      <Space h={12} />
                      <div style={{ display: "flex" }}>
                        <FileUploadButton htmlFor={`uploadExtraImage_${index}`}>
                          추가
                        </FileUploadButton>
                        <Space w={10} />
                        <FileUploadButton
                          onClick={() => {
                            editExtraImage(index, undefined);
                            editExtraImageURL(index, undefined);
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
                styleoverrides={{
                  width: "225px",
                  height: "60px",
                  fontSize: "22px",
                }}
                onClick={async () => {
                  setIsLoading(true);
                  if (checkRequirements()) {
                    await submitProductData(false);
                  }
                  setIsLoading(false);
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
              initializeNewProduct();
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
          key={`PageIndex-${index}`}
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
