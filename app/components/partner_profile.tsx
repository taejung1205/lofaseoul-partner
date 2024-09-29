import { Form } from "@remix-run/react";
import { useMemo, useState } from "react";
import { BasicModal, ModalButton } from "./modal";
import { useViewportSize } from "@mantine/hooks";
import { isMobile } from "~/utils/mobile";
import { Select, Space } from "@mantine/core";
import { CommonButton } from "./button";

export type PartnerProfile = {
  name: string;
  id: string;
  password: string;
  email: string;
  phone: string;
  lofaFee: number;
  gwangjuBiennaleFee: number;
  otherFee: number;
  shippingFee: number;
  brn: string;
  bankAccount: string;
  businessName: string;
  businessTaxStandard: "일반" | "간이" | "비사업자" | "면세";
  providerName: string; //공급처명
  productCategory: string[];
  isAdmin?: boolean;
};

export const PossibleTaxStandard = ["일반", "간이", "비사업자", "면세"];
export type BusinessTaxStandard = "일반" | "간이" | "비사업자" | "면세";

export function getAllProductCategories(partnerProfiles: PartnerProfile[]) {
  const categorySet = new Set<string>();

  partnerProfiles.forEach((profile) => {
    if (profile.productCategory) {
      profile.productCategory.forEach((category) => {
        categorySet.add(category);
      });
    }
  });

  return Array.from(categorySet);
}

function PartnerProfileBox({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const boxStyles: React.CSSProperties = {
    backgroundColor: "#d9d9d9",
    border: "1px solid black",
    width: "100%",
    marginBottom: "40px",
  };

  return (
    <div style={boxStyles} {...props}>
      {children}
    </div>
  );
}
interface ProfileGridContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  isMobile: boolean;
}

function ProfileGridContainer({
  isMobile,
  children,
  ...props
}: ProfileGridContainerProps) {
  const gridStyles: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile ? "auto" : "auto auto",
  };

  return (
    <div style={gridStyles} {...props}>
      {children}
    </div>
  );
}

interface ProfileGridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  isMobile: boolean;
  isDoubleSpan?: boolean;
}

function ProfileGridItem({
  isMobile,
  isDoubleSpan,
  children,
  ...props
}: ProfileGridItemProps) {
  const itemStyles: React.CSSProperties = {
    backgroundColor: "#f0f0f0",
    border: "0.5px solid black",
    textAlign: "left",
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    alignItems: "center",
    gridColumn: isDoubleSpan ? "span 2" : "",
  };

  return (
    <div style={itemStyles} {...props}>
      {children}
    </div>
  );
}

export function ProductCategoryItem({
  item,
  onDeleteClick,
}: {
  item: string;
  onDeleteClick?: () => void;
}) {
  const styles: React.CSSProperties = {
    display: "flex",
    justifyContent: "start",
    alignItems: "center",
    border: "0.5px solid black",
    padding: "5px",
    margin: "3px",
    width: "fit-content",
  };
  return (
    <div style={styles}>
      <div style={{ fontSize: "12px" }}>{item}</div>
      {onDeleteClick ? <Space w={5} /> : <></>}
      {onDeleteClick ? <DeleteButton onClick={onDeleteClick} /> : <></>}
    </div>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <img
      src="/images/icon_trash.svg"
      style={{ cursor: "pointer", width: "10px", height: "10px" }}
      onClick={onClick}
    />
  );
}

function InputBox({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const inputStyles: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 700,
    margin: "4px",
  };

  return <input style={inputStyles} {...props} />;
}

export function PartnerProfile({
  partnerProfile,
  isEdit,
  isNew,
  onEditClick,
  isPartner,
}: {
  partnerProfile: PartnerProfile;
  isEdit: boolean;
  isNew: boolean;
  onEditClick: () => void;
  isPartner: boolean;
}) {
  const [isDeleteModalOpened, setIsDeleteModalOpened] =
    useState<boolean>(false);
  const [nameEdit, setNameEdit] = useState(partnerProfile.id);
  const [idEdit, setIdEdit] = useState(partnerProfile.id);
  const [passwordEdit, setPasswordEdit] = useState(partnerProfile.password);
  const [emailEdit, setEmailEdit] = useState(partnerProfile.email);
  const [phoneEdit, setPhoneEdit] = useState(partnerProfile.phone);
  const [lofaFeeEdit, setLofaFeeEdit] = useState(partnerProfile.lofaFee);
  const [otherFeeEdit, setOtherFeeEdit] = useState(partnerProfile.otherFee);
  const [gwangjuBiennaleFeeEdit, setGwangjuBiennaleFeeEdit] = useState(
    partnerProfile.gwangjuBiennaleFee
  );
  const [shippingFeeEdit, setShippingFeeEdit] = useState(
    partnerProfile.shippingFee
  );
  const [brnEdit, setBrnEdit] = useState(partnerProfile.brn);
  const [bankAccountEdit, setBankAccountEdit] = useState(
    partnerProfile.bankAccount
  );
  const [businessNameEdit, setBusinessNameEdit] = useState(
    partnerProfile.businessName
  );
  const [businessTaxStandardEdit, setBusinessTaxStandardEdit] = useState(
    partnerProfile.businessTaxStandard
  );
  const [providerNameEdit, setProviderNameEdit] = useState(
    partnerProfile.providerName ?? partnerProfile.name
  );
  const [productCategoryAddEdit, setProductCategoryAddEdit] = useState("");
  const [productCategoryEdit, setProductCategoryEdit] = useState(
    partnerProfile.productCategory ?? []
  );

  const viewportSize = useViewportSize();
  const isMobileMemo: boolean = useMemo(() => {
    return isMobile(viewportSize.width);
  }, [viewportSize]);

  function addProductCategory(newItem: string) {
    setProductCategoryEdit((prev) => [...prev, newItem]);
  }

  function deleteProductCategory(index: number) {
    const first1 = productCategoryEdit.slice(0, index);
    const last1 = productCategoryEdit.slice(index + 1);
    setProductCategoryEdit(first1.concat(last1));
  }

  if (!isEdit) {
    return (
      <>
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
            해당 파트너를 삭제하시겠습니까?
            <div style={{ height: "20px" }} />
            <div style={{ display: "flex", justifyContent: "center" }}>
              <ModalButton onClick={() => setIsDeleteModalOpened(false)}>
                취소
              </ModalButton>
              <Form
                method="post"
                onSubmit={() => setIsDeleteModalOpened(false)}
              >
                <input type="hidden" value={"delete"} name="action" required />
                <input
                  type="hidden"
                  value={partnerProfile.name}
                  name="name"
                  required
                />
                <ModalButton
                  type="submit"
                  styleOverrides={{ borderColor: "red", color: "red" }}
                >
                  삭제
                </ModalButton>
              </Form>
            </div>
          </div>
        </BasicModal>
        <PartnerProfileBox>
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
            <div>{partnerProfile.name}</div>
            {isPartner ? (
              <></>
            ) : (
              <div style={{ display: "flex" }}>
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
                <img
                  src={"/images/icon_trash.svg"}
                  onClick={() => setIsDeleteModalOpened(true)}
                  style={{
                    width: "30px",
                    height: "30px",
                    marginRight: "10px",
                    cursor: "pointer",
                  }}
                />
              </div>
            )}
          </div>
          <ProfileGridContainer isMobile={isMobileMemo}>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "120px" }}>아이디</div>
              <div style={{ padding: "13px" }}>{partnerProfile.id}</div>
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "120px" }}>비밀번호</div>
              <div style={{ padding: "13px" }}>{partnerProfile.password}</div>
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "120px" }}>이메일</div>
              <div
                style={{
                  padding: "13px",
                  fontSize: "16px",
                  wordBreak: "break-all",
                }}
              >
                {partnerProfile.email}
              </div>
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "120px" }}>연락처</div>
              <div style={{ padding: "13px" }}>{partnerProfile.phone}</div>
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "120px" }}>수수료</div>
              <div
                style={{
                  justifyContent: "space-between",
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: "13px",
                }}
              >
                <div style={{ fontSize: "12px" }}>로파 공홈 및 쇼룸</div>
                <div style={{ padding: "13px" }}>{partnerProfile.lofaFee}%</div>
                <div style={{ fontSize: "12px" }}>광주비엔날레</div>
                <div style={{ padding: "13px" }}>
                  {partnerProfile.gwangjuBiennaleFee}%
                </div>
                <div style={{ fontSize: "12px" }}>기타 채널</div>
                <div style={{ padding: "13px" }}>
                  {partnerProfile.otherFee}%
                </div>
              </div>
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "120px" }}>배송비</div>
              <div style={{ padding: "13px" }}>
                {partnerProfile.shippingFee}원
              </div>
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "180px" }}>
                사업자등록번호
              </div>
              <div style={{ padding: "13px" }}>{partnerProfile.brn}</div>
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "120px" }}>계좌번호</div>
              <div style={{ padding: "13px", fontSize: "16px" }}>
                {partnerProfile.bankAccount}
              </div>
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "120px" }}>사업자명</div>
              <div style={{ padding: "13px" }}>
                {partnerProfile.businessName}
              </div>
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "180px" }}>
                사업자과세기준
              </div>
              <div style={{ padding: "13px" }}>
                {partnerProfile.businessTaxStandard}
              </div>
            </ProfileGridItem>
            {isPartner ? (
              <></>
            ) : (
              <ProfileGridItem isMobile={isMobileMemo}>
                <div style={{ padding: "13px", width: "120px" }}>공급처명</div>
                <div style={{ padding: "13px" }}>
                  {partnerProfile.providerName ?? partnerProfile.name}
                </div>
              </ProfileGridItem>
            )}

            {isPartner ? (
              <></>
            ) : (
              <ProfileGridItem isMobile={isMobileMemo}>
                <div style={{ padding: "13px", width: "120px" }}>상품분류</div>
                {partnerProfile.productCategory?.map((val) => (
                  <ProductCategoryItem item={val} />
                )) ?? <></>}
              </ProfileGridItem>
            )}
          </ProfileGridContainer>
        </PartnerProfileBox>
      </>
    );
  } else {
    return (
      <PartnerProfileBox>
        <Form method="post">
          <input type="hidden" value={"add"} name="action" required />
          {productCategoryEdit.map((val) => (
            <input type="hidden" value={val} name="productCategory" required />
          ))}

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
            {isNew ? (
              <InputBox
                type="text"
                name="name"
                value={nameEdit}
                onChange={(e) => setNameEdit(e.target.value)}
                required
              />
            ) : (
              <>
                <div>{partnerProfile.name}</div>
                <input
                  type="hidden"
                  value={partnerProfile.name}
                  name="name"
                  required
                />
              </>
            )}

            <input
              type="image"
              src="/images/icon_save.svg"
              style={{
                width: "30px",
                height: "30px",
              }}
            />
          </div>
          <ProfileGridContainer isMobile={isMobileMemo}>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "120px" }}>아이디</div>
              <InputBox
                type="text"
                name="id"
                value={idEdit}
                onChange={(e) => setIdEdit(e.target.value)}
                required
              />
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "120px" }}>비밀번호</div>
              <InputBox
                type="text"
                name="password"
                value={passwordEdit}
                onChange={(e) => setPasswordEdit(e.target.value)}
                required
              />
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "120px" }}>이메일</div>
              <InputBox
                type="email"
                name="email"
                value={emailEdit}
                onChange={(e) => setEmailEdit(e.target.value)}
              />
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "120px" }}>연락처</div>
              <InputBox
                type="phone"
                name="phone"
                value={phoneEdit}
                onChange={(e) => setPhoneEdit(e.target.value)}
              />
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "120px" }}>수수료</div>
              <div
                style={{
                  justifyContent: "space-between",
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: "13px",
                }}
              >
                <div style={{ fontSize: "15px" }}>로파 공홈 및 쇼룸</div>
                <InputBox
                  type="number"
                  name="lofaFee"
                  value={lofaFeeEdit}
                  onChange={(e) => setLofaFeeEdit(Number(e.target.value))}
                  required
                  style={{ width: "50px" }}
                />
                <Space w={10} />
                <div style={{ fontSize: "15px" }}>광주비엔날레</div>
                <InputBox
                  type="number"
                  name="gwangjuBiennaleFee"
                  value={gwangjuBiennaleFeeEdit}
                  onChange={(e) =>
                    setGwangjuBiennaleFeeEdit(Number(e.target.value))
                  }
                  required
                  style={{ width: "50px" }}
                />
                <Space w={10} />
                <div style={{ fontSize: "15px" }}>기타 채널</div>
                <InputBox
                  type="number"
                  name="otherFee"
                  value={otherFeeEdit}
                  onChange={(e) => setOtherFeeEdit(Number(e.target.value))}
                  required
                  style={{ width: "50px" }}
                />
              </div>
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "120px" }}>배송비</div>
              <InputBox
                type="number"
                name="shippingFee"
                value={shippingFeeEdit}
                onChange={(e) => setShippingFeeEdit(Number(e.target.value))}
                required
              />
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "180px" }}>
                사업자등록번호
              </div>
              <InputBox
                type="text"
                name="brn"
                value={brnEdit}
                onChange={(e) => setBrnEdit(e.target.value)}
              />
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "120px" }}>계좌번호</div>
              <InputBox
                type="text"
                name="bankAccount"
                value={bankAccountEdit}
                onChange={(e) => setBankAccountEdit(e.target.value)}
              />
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "180px" }}>사업자명</div>
              <InputBox
                type="text"
                name="businessName"
                value={businessNameEdit}
                onChange={(e) => setBusinessNameEdit(e.target.value)}
              />
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "180px" }}>
                사업자과세기준
              </div>
              <Select
                value={businessTaxStandardEdit}
                onChange={(val: BusinessTaxStandard) => {
                  setBusinessTaxStandardEdit(val);
                }}
                name="businessTaxStandard"
                data={[
                  { value: "일반", label: "일반" },
                  { value: "간이", label: "간이" },
                  { value: "비사업자", label: "비사업자" },
                  { value: "면세", label: "면세" },
                ]}
                styles={{
                  input: {
                    fontSize: "20px",
                    fontWeight: "bold",
                    borderRadius: 0,
                    margin: "4px",
                  },
                  item: {
                    "&[data-selected]": {
                      backgroundColor: "grey",
                    },
                  },
                }}
              />
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "180px" }}>공급처명</div>
              <InputBox
                type="text"
                name="providerName"
                value={providerNameEdit}
                onChange={(e) => setProviderNameEdit(e.target.value)}
              />
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo}>
              <div style={{ padding: "13px", width: "180px" }}>
                상품분류 추가
              </div>
              <InputBox
                type="text"
                name="productCategoryAdd"
                value={productCategoryAddEdit}
                onChange={(e) => setProductCategoryAddEdit(e.target.value)}
              />
              <Space w={10} />
              <CommonButton
                type="button"
                onClick={() => {
                  if (
                    productCategoryAddEdit.length > 0 &&
                    !productCategoryEdit.includes(productCategoryAddEdit)
                  ) {
                    addProductCategory(productCategoryAddEdit);
                    setProductCategoryAddEdit("");
                  }
                }}
                styleOverrides={{ fontSize: "14px", borderWidth: "0.8px" }}
                height={28}
                width={60}
              >
                추가
              </CommonButton>
            </ProfileGridItem>
            <ProfileGridItem isMobile={isMobileMemo} isDoubleSpan>
              <div style={{ padding: "13px", width: "180px" }}>
                상품분류 목록
              </div>
              <Space w={10} />
              {productCategoryEdit.map((val, index) => (
                <ProductCategoryItem
                  item={val}
                  key={`ProductCategoryItem_${val}_${index}`}
                  onDeleteClick={() => deleteProductCategory(index)}
                />
              ))}
            </ProfileGridItem>
          </ProfileGridContainer>
        </Form>
      </PartnerProfileBox>
    );
  }
}
