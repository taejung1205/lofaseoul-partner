import { ActionFunction } from "@remix-run/node";
import { useActionData, useSubmit } from "@remix-run/react";
import { useEffect, useRef } from "react";
import {
  debug_addProviderNameToWaybills,
  debug_timezone,
} from "~/services/firebase/debug.server";
import { getDiscountData } from "~/services/firebase/discount.server";
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

  // Helper function to check if two date ranges overlap
  const isOverlap = (
    range1: { startDate: Date; endDate: Date },
    range2: { startDate: Date; endDate: Date }
  ): boolean => {
    return (
      range1.startDate <= range2.endDate && range1.endDate >= range2.startDate
    );
  };

  // Group by productName
  const groupedByProductName: Record<
    string,
    { id: string; startDate: Date; endDate: Date }[]
  > = searchResult.reduce((acc, item) => {
    const { productName, startDate, endDate } = item.data;
    if (!acc[productName]) {
      acc[productName] = [];
    }
    acc[productName].push({
      id: item.id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
    return acc;
  }, {} as Record<string, { id: string; startDate: Date; endDate: Date }[]>);

  // Check for overlaps in each group
  const overlaps: {
    productName: string;
    items: { id: string; startDate: Date; endDate: Date }[];
  }[] = [];

  for (const [productName, items] of Object.entries(groupedByProductName)) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (isOverlap(items[i], items[j])) {
          overlaps.push({
            productName,
            items: [items[i], items[j]],
          });
        }
      }
    }
  }

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
