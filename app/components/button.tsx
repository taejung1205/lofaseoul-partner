interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  styleOverrides?: React.CSSProperties;
}

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  styleOverrides?: React.CSSProperties;
}

interface CommonButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  width?: number;
  height?: number;
  fontSize?: number;
  styleOverrides?: React.CSSProperties;
}

export function CommonButton({
  width,
  height,
  fontSize,
  styleOverrides,
  children,
  ...props
}: CommonButtonProps) {
  const defaultStyles: React.CSSProperties = {
    backgroundColor: "white",
    border: "3px solid black",
    fontSize: fontSize ? `${fontSize}px` : "20px",
    fontWeight: 700,
    width: width ? `${width}px` : "110px",
    height: height ? `${height}px` : "40px",
    lineHeight: 1,
    padding: "6px",
    cursor: "pointer",
    ...styleOverrides,
  };

  return (
    <button style={defaultStyles} {...props}>
      {children}
    </button>
  );
}

export function BlackBottomButton({
  children,
  styleOverrides,
  ...props
}: ButtonProps) {
  const buttonStyle: React.CSSProperties = {
    backgroundColor: "black",
    color: "white",
    fontSize: "24px",
    fontWeight: 700,
    width: "100%",
    height: "50px",
    lineHeight: 1,
    padding: "6px",
    cursor: "pointer",
    ...styleOverrides,
  };

  return (
    <button style={buttonStyle} {...props}>
      {children}
    </button>
  );
}

export function BlackButton({
  children,
  styleOverrides,
  ...props
}: ButtonProps) {
  const buttonStyle: React.CSSProperties = {
    backgroundColor: "black",
    color: "white",
    fontSize: "20px",
    fontWeight: 700,
    minWidth: "120px",
    height: "40px",
    lineHeight: 1,
    padding: "6px",
    margin: "10px",
    cursor: "pointer",
    ...styleOverrides
  };

  return (
    <button style={buttonStyle} {...props}>
      {children}
    </button>
  );
}

export function CommonLabel({
  styleOverrides,
  children,
  ...props
}: LabelProps) {
  const defaultStyles: React.CSSProperties = {
    backgroundColor: "white",
    border: "3px solid black",
    fontSize: "20px",
    fontWeight: 700,
    width: "110px",
    height: "40px",
    lineHeight: 1,
    padding: "6px",
    cursor: "pointer",
    ...styleOverrides,
  };

  return (
    <label style={defaultStyles} {...props}>
      {children}
    </label>
  );
}
