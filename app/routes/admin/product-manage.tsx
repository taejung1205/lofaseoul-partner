import { Checkbox, LoadingOverlay, Modal } from "@mantine/core";
import { ActionFunction, LoaderFunction, json } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BasicModal, ModalButton } from "~/components/modal";
import { PageLayout } from "~/components/page_layout";
import { LoadedProduct } from "~/components/product";
import writeXlsxFile from "write-excel-file";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  acceptProducts,
  declineProducts,
  deleteProducts,
  getAllProducts,
} from "~/services/firebase/product.server";

function EmptyProductsBox({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const boxStyles: React.CSSProperties = {
    display: "flex",
    textAlign: "center",
    fontSize: "24px",
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

function DetailButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const buttonStyles: React.CSSProperties = {
    fontSize: "16px",
    backgroundColor: "black",
    width: "60px",
    height: "32px",
    margin: "4px",
    color: "white",
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
  };

  return (
    <button style={buttonStyles} {...props}>
      {children}
    </button>
  );
}

function FunctionButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const buttonStyles: React.CSSProperties = {
    backgroundColor: "black",
    color: "white",
    fontSize: "24px",
    fontWeight: 700,
    width: "210px",
    height: "50px",
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

function DetailTitle({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const titleStyles: React.CSSProperties = {
    width: "160px",
    display: "flex",
    justifyContent: "center",
  };

  return (
    <div style={titleStyles} {...props}>
      {children}
    </div>
  );
}

function DetailBody({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const bodyStyles: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 700,
    width: "568px",
    margin: "4px",
    minHeight: "30px",
    textAlign: "center",
  };

  return (
    <div style={bodyStyles} {...props}>
      {children}
    </div>
  );
}

function DetailImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const imageStyles: React.CSSProperties = {
    objectFit: "contain",
    width: "200px",
    height: "200px",
    margin: "4px",
  };

  return <img style={imageStyles} {...props} />;
}

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const actionType = body.get("action")?.toString();
  if (actionType === "delete") {
    const productNameList = body.get("productNameList")?.toString();
    if (productNameList !== undefined) {
      const jsonArr: string[] = JSON.parse(productNameList);
      deleteProducts({
        productNameList: jsonArr,
      });
      {
        return json({
          message:
            "해당 상품들을 삭제하였습니다. 잠시 후 해당 상품들이 삭제될 예정입니다.",
        });
      }
    }
  } else if (actionType === "accept") {
    const productNameList = body.get("productNameList")?.toString();
    if (productNameList !== undefined) {
      const jsonArr: string[] = JSON.parse(productNameList);
      acceptProducts({
        productNameList: jsonArr,
      });
      {
        return json({
          message:
            "해당 상품들을 승인하였습니다. 잠시 후 해당 상품들이 승인될 예정입니다.",
        });
      }
    }
  } else if (actionType === "decline") {
    const productNameList = body.get("productNameList")?.toString();
    if (productNameList !== undefined) {
      const jsonArr: string[] = JSON.parse(productNameList);
      declineProducts({
        productNameList: jsonArr,
      });
      {
        return json({
          message:
            "해당 상품들을 거부하였습니다. 잠시 후 해당 상품들이 거부될 예정입니다.",
        });
      }
    }
  }

  return null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const products = await getAllProducts();
  if (typeof products == "string") {
    return json({ products: [], error: products });
  }

  return json({ products: products });
};

export default function AdminProductManage() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);

  //불러온 상품 목록
  const [products, setProducts] = useState<LoadedProduct[]>([]); //로딩된 전체 주문건 아이템 리스트

  //자세히 볼 상품
  const [detailProduct, setDetailProduct] = useState<LoadedProduct>();

  const [selectedItems, setSelectedItems] = useState<LoadedProduct[]>([]); // 체크박스로 선택된 아이템 목록. 삭제, 수정, 다운로드 등 버튼 눌렀을 때 업데이트됨
  const [itemsCheckedList, setItemsCheckedList] = useState<boolean[]>([]); //체크된 주문건 index 배열
  const [isAllChecked, setIsAllChecked] = useState<boolean>(false); // 모두 선택용

  //안내 메세지
  const [notice, setNotice] = useState<string>("");

  //모달 열림 여부
  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);
  const [isDeleteModalOpened, setIsDeleteModalOpened] =
    useState<boolean>(false);
  const [isDetailModalOpened, setIsDetailModalOpened] =
    useState<boolean>(false);

  //로딩 중 오버레이
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (loaderData.error == undefined) {
      setProducts(loaderData.products);
    } else {
      setNotice(
        `상품 등록 정보를 불러오는 도중 오류가 발생했습니다. ${loaderData.error}`
      );
      setIsNoticeModalOpened(true);
    }
  }, [loaderData]);

  useEffect(() => {
    if (actionData !== undefined && actionData !== null) {
      setNotice(actionData.message);
      setIsNoticeModalOpened(true);
    }
  }, [actionData]);

  useEffect(() => {
    onCheckAll(false);
  }, [products]);

  //loaderData에서 불러온 에러 정보를 바탕으로 한 에러 메세지
  const errorOrderStr = useMemo(() => {
    if (loaderData.error == undefined) {
      return null;
    }

    switch (loaderData.error) {
    }
    return "알 수 없는 오류입니다.";
  }, [loaderData]);

  //체크박스로 선택된 주문내역을 업뎃합니다. (삭제, 수정 버튼 클릭시 발생)
  // 수정된 리스트를 반환합니다.
  function updateCheckedItems() {
    let productList = [];
    for (let i = 0; i < products.length; i++) {
      if (itemsCheckedList[i]) {
        productList.push(products[i]);
      }
    }
    setSelectedItems(productList);
    return productList;
  }

  function onItemCheck(index: number, isChecked: boolean) {
    const newCheckedList = itemsCheckedList.map((item, i) => {
      if (i == index) {
        return isChecked;
      } else {
        return item;
      }
    });
    setItemsCheckedList(newCheckedList);
  }

  function onCheckAll(isChecked: boolean) {
    setItemsCheckedList(Array(products.length ?? 0).fill(isChecked));
  }

  //주문건 삭제를 post합니다.
  function submitDelete(productNameList: string[]) {
    const json = JSON.stringify(productNameList);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("productNameList", json);
    formData.set("action", "delete");
    submit(formData, { method: "post" });
  }

  //주문건 승인을 post합니다.
  function submitAccept(productNameList: string[]) {
    const json = JSON.stringify(productNameList);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("productNameList", json);
    formData.set("action", "accept");
    submit(formData, { method: "post" });
  }

  //주문건 거부를 post합니다.
  function submitDecline(productNameList: string[]) {
    const json = JSON.stringify(productNameList);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("productNameList", json);
    formData.set("action", "decline");
    submit(formData, { method: "post" });
  }

  //엑셀 파일을 생성합니다
  async function writeExcel(products: LoadedProduct[]) {
    const date = new Date();
    const year = date.getFullYear().toString().substring(2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    await writeXlsxFile(products, {
      schema,
      headerStyle: {
        fontWeight: "bold",
        align: "center",
      },
      fileName: `상품내역_${year}${month}${day}.xlsx`,
      fontFamily: "맑은 고딕",
      fontSize: 10,
    });
  }

  //압축파일을 생성합니다
  async function downloadImageZip(products: LoadedProduct[]) {
    const zip = new JSZip();
    for (let i = 0; i < products.length; i++) {
      const mainFile = await downloadFile(
        products[i].mainImageURL,
        makeFileName(
          products[i].partnerName,
          products[i].productName,
          "메인썸네일",
          1,
          products[i].mainImageName.split(".").pop() ?? "jpg"
        )
      );

      zip.file(mainFile.name, mainFile);

      const thumbnailFile = await downloadFile(
        products[i].thumbnailImageURL,
        makeFileName(
          products[i].partnerName,
          products[i].productName,
          "마우스후버이미지",
          1,
          products[i].thumbnailImageName.split(".").pop() ?? "jpg"
        )
      );

      zip.file(thumbnailFile.name, thumbnailFile);

      for (let j = 0; j < products[i].detailImageURLList.length; j++) {
        const detailFile = await downloadFile(
          products[i].detailImageURLList[j],
          makeFileName(
            products[i].partnerName,
            products[i].productName,
            "상세페이지_좌우슬라이드이미지",
            j + 1,
            products[i].detailImageNameList[j].split(".").pop() ?? "jpg"
          )
        );
        zip.file(detailFile.name, detailFile);
      }

      for (let j = 0; j < products[i].extraImageURLList.length; j++) {
        const extraFile = await downloadFile(
          products[i].extraImageURLList[j],
          makeFileName(
            products[i].partnerName,
            products[i].productName,
            "상세페이지_하단추가이미지",
            j + 1,
            products[i].extraImageNameList[j].split(".").pop() ?? "jpg"
          )
        );
        zip.file(extraFile.name, extraFile);
      }
    }
    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "이미지 모음.zip");
    });
  }

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

      {/* 주문내역 삭제 모달 */}
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
          {`선택된 상품 ${selectedItems.length}건을 삭제하시겠습니까?`}
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsDeleteModalOpened(false)}>
              취소
            </ModalButton>
            <ModalButton
              onClick={async () => {
                const productNamesList = selectedItems.map(
                  (product) => product.productName
                );
                submitDelete(productNamesList);
                setIsDeleteModalOpened(false);
              }}
            >
              삭제
            </ModalButton>
          </div>
        </div>
      </BasicModal>

      {/* 상품 자세히 보기를 위한 모달 */}
      <Modal
        opened={isDetailModalOpened}
        onClose={() => setIsDetailModalOpened(false)}
        size={"xl"}
        withCloseButton={false}
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
            <DetailTitle>상품명</DetailTitle>
            <DetailBody>{detailProduct?.productName}</DetailBody>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <DetailTitle>영문 상품명</DetailTitle>
            <DetailBody>{detailProduct?.englishProductName}</DetailBody>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <DetailTitle>상품 간략설명</DetailTitle>
            <DetailBody>{detailProduct?.explanation}</DetailBody>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <DetailTitle>검색어</DetailTitle>
            <DetailBody>{detailProduct?.keyword}</DetailBody>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <DetailTitle>판매가</DetailTitle>
            <DetailBody>{detailProduct?.sellerPrice}</DetailBody>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <DetailTitle>옵션 사용여부</DetailTitle>
            <DetailBody>{detailProduct?.isUsingOption ? "T" : "F"}</DetailBody>
          </div>
          {detailProduct?.isUsingOption ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <DetailTitle>옵션</DetailTitle>
              <DetailBody>{detailProduct?.option}</DetailBody>
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
            <DetailTitle>상품 이미지</DetailTitle>
            <DetailImage src={detailProduct?.mainImageURL} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <DetailTitle>마우스 호버 이미지</DetailTitle>
            <DetailImage src={detailProduct?.thumbnailImageURL} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <DetailTitle>
              상세 페이지 <br /> 좌우슬라이드 이미지
            </DetailTitle>
            <div
              style={{
                width: "568px",
                overflowX: "auto",
                display: "flex",
                justifyContent: "start",
              }}
            >
              {detailProduct?.detailImageURLList.map((url) => (
                <DetailImage src={url} />
              ))}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <DetailTitle>
              상세 페이지 <br /> 하단추가 이미지
            </DetailTitle>
            <div
              style={{
                width: "568px",
                overflowX: "auto",
                display: "flex",
                justifyContent: "start",
              }}
            >
              {detailProduct?.extraImageURLList.map((url) => (
                <DetailImage src={url} />
              ))}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <DetailTitle>옵션 별 가격 설정 및 관리자 전달 메모</DetailTitle>
            <DetailBody>{detailProduct?.memo}</DetailBody>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <DetailTitle>교환/반품 안내</DetailTitle>
            <DetailBody>{detailProduct?.refundExplanation}</DetailBody>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <DetailTitle>서비스 문의/안내</DetailTitle>
            <DetailBody>{detailProduct?.serviceExplanation}</DetailBody>
          </div>
        </div>
      </Modal>
      <PageLayout>
        <div
          style={{
            fontSize: "28px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div>신청된 상품 목록</div>

          <div style={{ width: "20px" }} />
          <FunctionButton
            onClick={() => {
              onCheckAll(!isAllChecked);
              setIsAllChecked((prev) => !prev);
            }}
          >
            모두 선택
          </FunctionButton>
          <div style={{ width: "20px" }} />
          <FunctionButton
            onClick={async () => {
              const updatedList = updateCheckedItems();
              if (updatedList.length > 0) {
                setIsLoading(true);
                await writeExcel(updatedList);
                setIsLoading(false);
              } else {
                setNotice("선택된 주문건이 없습니다.");
                setIsNoticeModalOpened(true);
              }
            }}
          >
            엑셀 다운로드
          </FunctionButton>
          <div style={{ width: "20px" }} />
          <FunctionButton
            onClick={async () => {
              const updatedList = updateCheckedItems();
              if (updatedList.length > 0) {
                setIsLoading(true);
                await downloadImageZip(updatedList);
                setIsLoading(false);
              } else {
                setNotice("선택된 주문건이 없습니다.");
                setIsNoticeModalOpened(true);
              }
            }}
          >
            이미지 다운로드
          </FunctionButton>
        </div>
        <div style={{ height: "10px" }} />
        {loaderData.error == undefined ? (
          products.length > 0 ? (
            <>
              <div
                style={{
                  overflowY: "auto",
                  width: "inherit",
                  maxHeight: "70%",
                }}
              >
                {products.map((item, index) => {
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
                      <Checkbox
                        color={"gray"}
                        size={"sm"}
                        checked={itemsCheckedList[index]}
                        onChange={(event) => {
                          onItemCheck(index, event.currentTarget.checked);
                        }}
                      />
                      <div
                        style={{
                          width: "calc(100% - 250px)",
                          marginLeft: "10px",
                          lineHeight: "16px",
                          textAlign: "left",
                        }}
                      >
                        {item.productName}
                      </div>
                      <div style={{ width: "10px" }} />
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
                      <div style={{ width: "10px" }} />
                      <DetailButton
                        onClick={() => {
                          setDetailProduct(item);
                          setIsDetailModalOpened(true);
                        }}
                      >
                        자세히
                      </DetailButton>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyProductsBox>주문내역이 존재하지 않습니다.</EmptyProductsBox>
          )
        ) : (
          <EmptyProductsBox>{errorOrderStr}</EmptyProductsBox>
        )}
        <div style={{ height: "30px" }} />
        <div style={{ display: "flex" }}>
          <FunctionButton
            onClick={() => {
              const updatedList = updateCheckedItems();
              if (updatedList.length > 0) {
                setIsDeleteModalOpened(true);
              } else {
                setNotice("선택된 주문건이 없습니다.");
                setIsNoticeModalOpened(true);
              }
            }}
          >
            항목 삭제
          </FunctionButton>

          <div style={{ width: "10px" }} />
          <FunctionButton
            onClick={() => {
              const updatedList = updateCheckedItems();
              const productNamesList = updatedList.map(
                (product) => product.productName
              );
              submitAccept(productNamesList);
            }}
          >
            상품 승인
          </FunctionButton>
          <div style={{ width: "10px" }} />
          <FunctionButton
            onClick={() => {
              const updatedList = updateCheckedItems();
              const productNamesList = updatedList.map(
                (product) => product.productName
              );
              submitDecline(productNamesList);
            }}
          >
            상품 거부
          </FunctionButton>
        </div>
      </PageLayout>
    </>
  );
}

const schema = [
  {
    column: "진열상태",
    type: String,
    value: (item: LoadedProduct) => "N",
    width: 20,
  },
  {
    column: "판매상태",
    type: String,
    value: (item: LoadedProduct) => "Y",
    width: 20,
  },
  {
    column: "상품분류 번호",
    type: Number,
    value: (item: LoadedProduct) => 143,
    width: 20,
  },
  {
    column: "상품분류 신상품영역",
    type: String,
    value: (item: LoadedProduct) => "Y",
    width: 20,
  },
  {
    column: "상품분류 추천상품영역",
    type: String,
    value: (item: LoadedProduct) => "N",
    width: 20,
  },
  {
    column: "상품명",
    type: String,
    value: (item: LoadedProduct) => item.productName,
    width: 20,
  },
  {
    column: "영문 상품명",
    type: String,
    value: (item: LoadedProduct) => item.englishProductName,
    width: 20,
  },
  {
    column: "상품 간략설명",
    type: String,
    value: (item: LoadedProduct) => item.explanation,
    width: 20,
  },
  {
    column: "검색어설정",
    type: String,
    value: (item: LoadedProduct) => item.keyword,
    width: 20,
  },
  {
    column: "공급가",
    type: Number,
    value: (item: LoadedProduct) => item.sellerPrice,
    width: 20,
  },
  {
    column: "판매가",
    type: Number,
    value: (item: LoadedProduct) => item.sellerPrice,
    width: 20,
  },
  {
    column: "최소 주문수량(이상)",
    type: Number,
    value: (item: LoadedProduct) => 1,
    width: 20,
  },
  {
    column: "옵션사용",
    type: String,
    value: (item: LoadedProduct) => (item.isUsingOption ? "Y" : "N"),
    width: 20,
  },
  {
    column: "품목 구성방식",
    type: String,
    value: (item: LoadedProduct) => {
      const option = item.option;
      const optionArr = option.split("//");
      return item.isUsingOption ? (optionArr.length > 1 ? "T" : "F") : "";
    },
    width: 20,
  },
  {
    column: "옵션 표시방식",
    type: String,
    value: (item: LoadedProduct) => {
      const option = item.option;
      const optionArr = option.split("//");
      return optionArr.length > 1 ? "C" : "";
    },
    width: 20,
  },
  {
    column: "옵션입력",
    type: String,
    value: (item: LoadedProduct) => item.option,
    width: 20,
  },
  {
    column: "옵션 스타일",
    type: String,
    value: (item: LoadedProduct) =>
      //   {
      //   let str = "";
      //   if (item.option.length > 0) {
      //     const optionList = item.option.split("//");
      //     for (let i = 0; i < optionList.length - 1; i++) {
      //       str += "S,";
      //     }
      //     str += "S";
      //   }
      //   return str;
      // },
      {
        const option = item.option;
        const optionArr = option.split("//");
        return optionArr.length > 1 ? "S" : "";
      },
    width: 20,
  },
  {
    column: "필수여부",
    type: String,
    value: (item: LoadedProduct) => "T",
    width: 20,
  },
  {
    column: "품절표시 문구",
    type: String,
    value: (item: LoadedProduct) => "품절",
    width: 20,
  },
  {
    column: "이미지등록(상세)",
    type: String,
    value: (item: LoadedProduct) => "",
    // `big1/${makeFileName(item.id, undefined, item.mainImageName.split('.').pop() ?? ".jpg","main")}`,
    width: 20,
  },
  {
    column: "이미지등록(목록)",
    type: String,
    value: (item: LoadedProduct) => "",
    // `medium1/${makeFileName(item.id, undefined, item.mainImageName.split('.').pop() ?? ".jpg", "main")}`,
    width: 20,
  },
  {
    column: "이미지등록(작은목록)",
    type: String,
    value: (item: LoadedProduct) => "",
    //`tiny1/${makeFileName(item.id, undefined, item.mainImageName.split('.').pop() ?? ".jpg", "main")}`,
    width: 20,
  },
  {
    column: "이미지등록(축소)",
    type: String,
    value: (item: LoadedProduct) => "",
    // `small1/${makeFileName(item.id, undefined, item.thumbnailImageName.split('.').pop() ?? ".jpg", "thumbnail")}`,
    width: 20,
  },
  {
    column: "이미지등록(추가)",
    type: String,
    value: (item: LoadedProduct) => "",
    // {
    //   let str = "";
    //   for (let i = 0; i < item.detailImageNameList.length; i++) {
    //     str += `big/${makeFileName(item.id, i, item.detailImageNameList[i].split('.').pop() ?? ".jpg", "detail")}`;
    //     if (i < item.detailImageNameList.length - 1) {
    //       str += "|";
    //     }
    //   }
    //   return str;
    // },
    width: 20,
  },
  {
    column: "교환/반품안내",
    type: String,
    value: (item: LoadedProduct) => item.refundExplanation,
    width: 20,
  },
  {
    column: "서비스문의/안내",
    type: String,
    value: (item: LoadedProduct) => item.serviceExplanation,
    width: 20,
  },
];

function makeFileName(
  partnerName: string,
  productName: string,
  usage: string,
  index: number,
  type: string
) {
  return `${partnerName}_${productName}_${usage}_${index}.${type}`;
}

async function downloadFile(url: string, fileName: string) {
  let file: File = await fetch(url)
    .then((response) => response.blob())
    .then((blob) => new File([blob], fileName));
  return file;
}
