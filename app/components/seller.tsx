import { Select } from "@mantine/core";

export const PossibleSellers = [
  "29cm",
  "EQL",
  "로파공홈",
  "용산쇼룸",
  "오늘의집",
  "카카오",
];

export const LofaSellers = ["로파공홈", "용산쇼룸"];

export function SellerSelect({
  seller,
  setSeller,
}: {
  seller: string;
  setSeller: (value: string) => void;
}) {
  return (
    <Select
      value={seller}
      onChange={setSeller}
      data={[
        { value: "all", label: "전체 판매처" },
        { value: "29cm", label: "29cm" },
        { value: "EQL", label: "EQL" },
        { value: "로파공홈", label: "로파 홈페이지" },
        { value: "용산쇼룸", label: "용산쇼룸" },
        { value: "오늘의집", label: "오늘의집" },
        { value: "카카오", label: "카카오" },
        { value: "etc", label: "기타" },
      ]}
      styles={{
        input: {
          fontSize: "20px",
          fontWeight: "bold",
          borderRadius: 0,
          border: "3px solid black !important",
          height: "40px",
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
