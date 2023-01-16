import { Form } from "@remix-run/react";
import { useState } from "react";
import styled from "styled-components";
import { BasicModal, ModalButton } from "./modal";

export type PartnerProfile = {
  name: string,
  id: string,
  password: string,
  email: string,
  phone: string,
  lofaFee: number,
  otherFee: number,
  shippingFee: number,
};

const PartnerProfileBox = styled.div`
  background-color: #d9d9d9;
  border: 1px solid black;
  width: inherit;
  margin-bottom: 40px;
`;

const ProfileGridContainer = styled.div`
  display: grid;
  grid-template-columns: auto auto;
`;

const ProfileGridItem = styled.div`
  background-color: #f0f0f0;
  border: 0.5px solid black;
  text-align: left;
  display: flex;
`;

const InputBox = styled.input`
  font-size: 20px;
  font-weight: 700;
  margin: 4px;
`;

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
              <Form method="post">
                <input type="hidden" value={"delete"} name="action" required />
                <input type="hidden" value={partnerProfile.name} name="name" required />
                <ModalButton
                  type="submit"
                  style={{ borderColor: "red", color: "red" }}
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
                  src={"/images/icon_edit.png"}
                  onClick={onEditClick}
                  style={{
                    width: "30px",
                    height: "30px",
                    marginRight: "10px",
                    cursor: "pointer",
                  }}
                />
                <img
                  src={"/images/icon_trash.png"}
                  onClick={() => setIsDeleteModalOpened(true)}
                  style={{
                    width: "30px",
                    height: "30px",
                    marginRight: "10px",
                    cursor: "pointer",
                  }}
                />
                {/* <Form method="post">
                  <input
                    type="hidden"
                    value={"delete"}
                    name="action"
                    required
                  />
                  <input type="hidden" value={name} name="name" required />
                  <input
                    type="image"
                    src="/images/icon_trash.png"
                    style={{
                      width: "30px",
                      height: "30px",
                    }}
                  />
                </Form> */}
              </div>
            )}
          </div>
          <ProfileGridContainer>
            <ProfileGridItem>
              <div style={{ padding: "13px", width: "120px" }}>아이디</div>
              <div style={{ padding: "13px" }}>{partnerProfile.id}</div>
            </ProfileGridItem>
            <ProfileGridItem>
              <div style={{ padding: "13px", width: "120px" }}>비밀번호</div>
              <div style={{ padding: "13px" }}>{partnerProfile.password}</div>
            </ProfileGridItem>
            <ProfileGridItem>
              <div style={{ padding: "13px", width: "120px" }}>이메일</div>
              <div style={{ padding: "13px" }}>{partnerProfile.email}</div>
            </ProfileGridItem>
            <ProfileGridItem>
              <div style={{ padding: "13px", width: "120px" }}>연락처</div>
              <div style={{ padding: "13px" }}>{partnerProfile.phone}</div>
            </ProfileGridItem>
            <ProfileGridItem>
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
                <div style={{ padding: "13px" }}>{partnerProfile.lofaFee}%</div>
                <div style={{ fontSize: "15px" }}>타 채널</div>
                <div style={{ padding: "13px" }}>{partnerProfile.otherFee}%</div>
              </div>
            </ProfileGridItem>
            <ProfileGridItem>
              <div style={{ padding: "13px", width: "120px" }}>배송비</div>
              <div style={{ padding: "13px" }}>{partnerProfile.shippingFee}원</div>
            </ProfileGridItem>
          </ProfileGridContainer>
        </PartnerProfileBox>
      </>
    );
  } else {
    const [nameEdit, setNameEdit] = useState(partnerProfile.id);
    const [idEdit, setIdEdit] = useState(partnerProfile.id);
    const [passwordEdit, setPasswordEdit] = useState(partnerProfile.password);
    const [emailEdit, setEmailEdit] = useState(partnerProfile.email);
    const [phoneEdit, setPhoneEdit] = useState(partnerProfile.phone);
    const [lofaFeeEdit, setLofaFeeEdit] = useState(partnerProfile.lofaFee);
    const [otherFeeEdit, setOtherFeeEdit] = useState(partnerProfile.otherFee);
    const [shippingFeeEdit, setShippingFeeEdit] = useState(partnerProfile.shippingFee);
    return (
      <PartnerProfileBox>
        <Form method="post">
          <input type="hidden" value={"add"} name="action" required />
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
                <input type="hidden" value={partnerProfile.name} name="name" required />
              </>
            )}

            <input
              type="image"
              src="/images/icon_save.png"
              style={{
                width: "30px",
                height: "30px",
              }}
            />
          </div>
          <ProfileGridContainer>
            <ProfileGridItem>
              <div style={{ padding: "13px", width: "120px" }}>아이디</div>
              <InputBox
                type="text"
                name="id"
                value={idEdit}
                onChange={(e) => setIdEdit(e.target.value)}
                required
              />
            </ProfileGridItem>
            <ProfileGridItem>
              <div style={{ padding: "13px", width: "120px" }}>비밀번호</div>
              <InputBox
                type="text"
                name="password"
                value={passwordEdit}
                onChange={(e) => setPasswordEdit(e.target.value)}
                required
              />
            </ProfileGridItem>
            <ProfileGridItem>
              <div style={{ padding: "13px", width: "120px" }}>이메일</div>
              <InputBox
                type="email"
                name="email"
                value={emailEdit}
                onChange={(e) => setEmailEdit(e.target.value)}
              />
            </ProfileGridItem>
            <ProfileGridItem>
              <div style={{ padding: "13px", width: "120px" }}>연락처</div>
              <InputBox
                type="phone"
                name="phone"
                value={phoneEdit}
                onChange={(e) => setPhoneEdit(e.target.value)}
                required
              />
            </ProfileGridItem>
            <ProfileGridItem>
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
                <div style={{ fontSize: "15px" }}>타 채널</div>
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
            <ProfileGridItem>
              <div style={{ padding: "13px", width: "120px" }}>배송비</div>
              <InputBox
                type="number"
                name="shippingFee"
                value={shippingFeeEdit}
                onChange={(e) => setShippingFeeEdit(Number(e.target.value))}
                required
              />
            </ProfileGridItem>
          </ProfileGridContainer>
        </Form>
      </PartnerProfileBox>
    );
  }
}
