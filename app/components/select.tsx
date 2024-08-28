import { Select } from "@mantine/core";

export function CommonSelect({
  selected,
  setSelected,
  items,
  width = "200px"
}: {
  selected: string;
  setSelected: (value: string) => void;
  items: string[];
  width?: string
}) {
  return (
    <Select
      value={selected}
      onChange={setSelected}
      data={items}
      styles={{
        input: {
          fontSize: "20px",
          fontWeight: "bold",
          borderRadius: 0,
          border: "3px solid black !important",
          height: "40px",
          width: width,
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
