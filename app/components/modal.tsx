interface ButtonProps extends  React.ButtonHTMLAttributes<HTMLButtonElement> {
  styleOverrides?: React.CSSProperties;
}

export function ModalOverlay({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // semi-transparent overlay
    zIndex: 1000, // ensures modal is on top of other elements
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <div style={overlayStyles} {...props}>
      {children}
    </div>
  );
}
export function ModalContent({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const contentStyles: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    fontSize: '20px',
    whiteSpace: 'pre'
  };

  return (
    <div style={contentStyles} {...props}>
      {children}
    </div>
  );
}

export function ModalButton({ children, styleOverrides, ...props }: ButtonProps) {
  const buttonStyles: React.CSSProperties = {
    backgroundColor: 'white',
    border: '2px solid black',
    fontSize: '16px',
    fontWeight: 700,
    width: '80px',
    lineHeight: 1,
    margin: '5px',
    padding: '6px',
    borderRadius: '1px',
    cursor: 'pointer',
    ...styleOverrides
  };

  return (
    <button style={buttonStyles} {...props}>
      {children}
    </button>
  );
}

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

