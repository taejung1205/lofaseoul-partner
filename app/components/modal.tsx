import { Modal } from "@mantine/core";
import styled from "styled-components";

export function BasicModal({
  opened,
  onClose,
  children,
}: {
  opened: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal centered opened={opened} onClose={onClose} withCloseButton={false}>
      {children}
    </Modal>
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
