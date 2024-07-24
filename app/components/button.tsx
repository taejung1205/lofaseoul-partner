import styled from "styled-components";

export const CommonButton = styled.button<{width?: number, height?: number, fontSize?: number}>`
  background-color: white;
  border: 3px solid black;
  font-size: ${props => props.fontSize ? props.fontSize + "px" : "20px"};
  font-weight: 700;
  width: ${props => props.width ? props.width + "px" : "110px"};
  height: ${props => props.height ? props.height + "px" : "40px"};
  line-height: 1;
  padding: 6px 6px 6px 6px;
  cursor: pointer;
`

export const MobileCommonButton = styled(CommonButton)`
  width: ${props => props.width ? props.width + "px" : "80px"};
  height: ${props => props.height ? props.height + "px" : "30px"};
  font-size: 12px;
`

export const GetListButton = styled.button`
  background-color: white;
  border: 3px solid black;
  font-size: 20px;
  font-weight: 700;
  width: 110px;
  height: 40px;
  line-height: 1;
  margin-left: 20px;
  padding: 6px 6px 6px 6px;
  cursor: pointer;
`;

export const BlackBottomButton = styled.button`
  background-color: black;
  color: white;
  font-size: 24px;
  font-weight: 700;
  width: 100%;
  height: 50px;
  line-height: 1;
  padding: 6px 6px 6px 6px;
  cursor: pointer;
`

export const BlackButton = styled.button`
  background-color: black;
  color: white;
  font-size: 20px;
  font-weight: 700;
  width: 120px;
  height: 40px;
  line-height: 1;
  padding: 6px 6px 6px 6px;
  margin: 10px;
  cursor: pointer;
`;

export const CommonLabel = styled.label<{width?: number, height?: number, fontSize?: number}>`
  background-color: white;
  border: 3px solid black;
  font-size: ${props => props.fontSize ? props.fontSize + "px" : "20px"};
  font-weight: 700;
  width: ${props => props.width ? props.width + "px" : "110px"};
  height: ${props => props.height ? props.height + "px" : "40px"};
  line-height: 1;
  padding: 6px;
  cursor: pointer;
`;