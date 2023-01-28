import { Select } from "@mantine/core";

export const PossibleShippingCompanies = [
  "한진택배",
  "롯데택배",
  "CJ대한통운",
  "우체국",
  "로젠택배",
  "CVS편의점택배",
  "BFG포스트",
  "EMS",
];

export function ShippingCompanySelect({
  shippingCompany,
  setShippingCompany,
}: {
  shippingCompany: string;
  setShippingCompany: (value: string) => void;
}) {
  return (
    <Select
      value={shippingCompany}
      onChange={setShippingCompany}
      data={[
        { value: "", label: "택배사 선택" },
        { value: "한진택배", label: "한진택배" },
        { value: "롯데택배", label: "롯데택배" },
        { value: "CJ대한통운", label: "CJ대한통운" },
        { value: "우체국", label: "우체국" },
        { value: "로젠택배", label: "로젠택배" },
        { value: "CVS편의점택배", label: "CVS편의점택배" },
        { value: "BFG포스트", label: "BFG포스트" },
        { value: "EMS", label: "EMS" },
      ]}
      styles={{
        input: {
          fontSize: "16px",
          fontWeight: "bold",
          borderRadius: 0,
          border: "3px solid black !important",
          height: "40px",
          width: "160px",
          marginLeft: "10px"
        },
        item: {
          "&[data-selected]": {
            backgroundColor: "grey",
          },
        },
      }}
    />
  );
}
