import { Modal } from "@mantine/core";
import styled from "styled-components";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* semi-transparent overlay */
  z-index: 1000; /* ensures modal is on top of other elements */
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  font-size: 20px;
`;
export function BasicModal({
  opened,
  onClose,
  children,
}: {
  opened: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // return (
  //   <Modal centered opened={opened} onClose={onClose} withCloseButton={false} size={size}>
  //     {children}
  //   </Modal>
  // );

  if (!opened) {
    return null;
  }

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e)=>e.stopPropagation()}>
        {children}
      </ModalContent>
    </ModalOverlay>
  );
}

export const ModalButton = styled.button`
  background-color: white;
  border: 2px solid black;
  font-size: 16px;
  font-weight: 700;
  width: 80px;
  line-height: 1;
  margin: 5px;
  padding: 6px 6px 6px 6px;
  border-radius: 1px;
  cursor: pointer;
`;
