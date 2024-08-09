export function FileNameBox({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) {
    const boxStyles: React.CSSProperties = {
      border: "3px solid #000000",
      backgroundColor: "#efefef",
      width: "550px",
      maxWidth: "70%",
      fontSize: "20px",
      lineHeight: "20px",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      overflow: "hidden",
      padding: "6px",
      textAlign: "left",
    };
  
    return (
      <div style={boxStyles} {...props}>
        {children}
      </div>
    );
  }
  
  export function FileUploadButton({
    children,
    ...props
  }: React.LabelHTMLAttributes<HTMLLabelElement>) {
    const buttonStyles: React.CSSProperties = {
      backgroundColor: "white",
      border: "3px solid black",
      fontSize: "20px",
      fontWeight: 700,
      width: "110px",
      lineHeight: "24px",
      padding: "6px",
      cursor: "pointer",
    };
  
    return (
      <label style={buttonStyles} {...props}>
        {children}
      </label>
    );
  }
  
  export function FileUpload(props: React.InputHTMLAttributes<HTMLInputElement>) {
    const inputStyles: React.CSSProperties = {
      width: "0",
      height: "0",
      padding: "0",
      overflow: "hidden",
      border: "0",
    };
  
    return <input type="file" style={inputStyles} {...props} />;
  }