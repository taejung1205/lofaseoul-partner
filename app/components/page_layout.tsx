interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  isMobile?: boolean;
  styleOverrides?: React.CSSProperties;
}

export function PageLayout({ isMobile = false, styleOverrides, children, ...props }: PageLayoutProps) {
  const layoutStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    fontSize: '20px',
    fontWeight: 700,
    padding: '30px 40px',
    paddingBottom: isMobile ? '160px' : '30px',
    display: isMobile ? 'block' : 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    overflowY: 'scroll',
    ...styleOverrides
  };

  return (
    <div style={layoutStyles} {...props}>
      {children}
    </div>
  );
}