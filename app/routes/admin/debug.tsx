import { ActionFunction } from "@remix-run/node";
import { useActionData, useSubmit } from "@remix-run/react";
import { useEffect, useRef } from "react";
import {
  debug_addProviderNameToWaybills,
  debug_timezone,
} from "~/services/firebase/debug.server";
import { deleteDiscountData, getDiscountData } from "~/services/firebase/discount.server";
import { addLog } from "~/services/firebase/firebase.server";

export const action: ActionFunction = async ({ request }) => {
  console.log("request submitted");
  const searchResult = await getDiscountData({
    startDate: new Date("2024-12-01"),
    endDate: new Date("2024-12-31"),
    seller: "",
    providerName: "",
    productName: "",
  });
  //TODO

  interface DiscountData {
    startDate: Date;
    endDate: Date;
    productName: string;
  }

  const isOverlap = (
    range1: { startDate: Date; endDate: Date },
    range2: { startDate: Date; endDate: Date }
  ): boolean => {
    return (
      range1.startDate <= range2.endDate && range1.endDate >= range2.startDate
    );
  };
  
  // Group by productName and seller
  const groupedByProductNameAndSeller: Record<
    string,
    { seller: string; id: string; startDate: Date; endDate: Date }[]
  > = searchResult.reduce((acc, item) => {
    const { productName, seller, startDate, endDate } = item.data;
    const key = `${productName}_${seller}`; // Combine productName and seller as the key
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push({
      seller,
      id: item.id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
    return acc;
  }, {} as Record<string, { seller: string; id: string; startDate: Date; endDate: Date }[]>);
  
  // Check for overlaps in each group
  const overlaps: {
    productName: string;
    seller: string;
    items: { id: string; startDate: Date; endDate: Date }[];
  }[] = [];
  
  for (const [key, items] of Object.entries(groupedByProductNameAndSeller)) {
    const [productName, seller] = key.split("_"); // Extract productName and seller from the key
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (isOverlap(items[i], items[j])) {
          overlaps.push({
            productName,
            seller,
            items: [items[i], items[j]],
          });
        }
      }
    }
  }

  // Collect IDs from overlaps, excluding one item per group
const excludedIds: string[] = overlaps.flatMap((overlap) => {
  // Keep all items except one (e.g., the first item)
  return overlap.items.slice(1).map((item) => item.id);
});

const ids = JSON.stringify(excludedIds);
const result = await deleteDiscountData({
  data: ids,
});
  
  if (overlaps.length > 0) {
    console.log("Overlapping items found:", overlaps);

    return overlaps;
  } else {
    console.log("No overlapping items found.");
    return null;
  }
 
};

export default function Debug() {
  const submit = useSubmit();
  const actionData = useActionData();
  
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (actionData !== undefined && actionData !== null) {
      console.log(actionData);
    }
  }, [actionData]);
  return (
    <>
      <button
        onClick={() => {
          const formData = new FormData(formRef.current ?? undefined);
          submit(formData, { method: "post" });
        }}
      >
        {"DEBUG"}
      </button>
    </>
  );
}
