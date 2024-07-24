import styled from "styled-components";

export const PageLayout = styled.div<{isMobile?: boolean}>`
  width: 100%;
  font-size: 20px;
  font-weight: 700;
  padding: 30px 40px 30px 40px;
  padding-bottom: ${(props) => (props.isMobile ? "100px" : "30px")};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow-y: scroll;
`;