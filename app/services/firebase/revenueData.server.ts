// Import the functions you need from the SDKs you need
import {
  collection,
  doc,
  DocumentData,
  getDocs,
  query,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { PartnerProfile } from "~/components/partner_profile";
import { dateToDayStr } from "~/utils/date";
import { sendAligoMessage } from "../aligo.server";
import {
  PossibleCS,
  PossibleOrderStatus,
  RevenueData,
} from "~/components/revenue_data";
import { PartnerRevenueStat } from "~/components/revenue_stat";
import { LofaSellers, NormalPriceStandardSellers } from "~/components/seller";
import { firestore } from "./firebaseInit.server";
import { addLog, getAllPartnerProfiles } from "./firebase.server";

/**
 * 수익통계자료를 업로드합니다.
 * @param settlements: JSON string of settlement items list
 * @returns
 *
 */
export async function addRevenueData({ data }: { data: string }) {
  try {
    const time = new Date().getTime();
    await setDoc(doc(firestore, `revenue-data-add/data`), {
      json: data,
      updateTime: time,
    });

    addLog("addRevenueData", {
      json: data,
      updateTime: time,
    });

    return true;
  } catch (error: any) {
    sendAligoMessage({
      text: `[로파파트너] ${error.message ?? error}`,
      receiver: "01023540973",
    });
    return error.message ?? error;
  }
}

/**
 * 조건을 만족하는 수익통계 데이터를 불러옵니다
 * @param partnerName: 파트너명, monthStr: 월
 * @returns
 *  Array of RevenueData
 */
export async function getRevenueData({
  startDate,
  endDate,
  partnerName,
  productName,
  seller,
  orderStatus,
  cs,
  filterDiscount,
  productCategory,
}: {
  startDate: Date;
  endDate: Date;
  partnerName: string;
  productName: string;
  seller: string;
  orderStatus: string;
  cs: string;
  filterDiscount: string;
  productCategory: string[];
}) {
  console.log(startDate, endDate);
  let orderStatusQueryArray: string[];
  switch (orderStatus) {
    case "전체":
      orderStatusQueryArray = PossibleOrderStatus;
      break;
    case "접수+송장":
      orderStatusQueryArray = ["접수", "송장"];
      break;
    case "접수+배송":
      orderStatusQueryArray = ["접수", "배송"];
      break;
    case "송장+배송":
      orderStatusQueryArray = ["송장", "배송"];
      break;
    default:
      orderStatusQueryArray = [orderStatus];
      break;
  }

  let csQueryArray: string[];

  switch (cs) {
    case "전체":
      csQueryArray = PossibleCS;
      break;
    case "정상":
      csQueryArray = ["정상"];
      break;
    case "정상+교환":
      csQueryArray = [
        "정상",
        "배송전 부분 교환",
        "배송전 전체 교환",
        "배송후 부분 교환",
        "배송후 전체 교환",
      ];
      break;
    case "취소(배송전+배송후)":
      csQueryArray = [
        "배송전 부분 취소",
        "배송전 전체 취소",
        "배송후 부분 취소",
        "배송후 전체 취소",
      ];
      break;
    case "교환(배송전+배송후)":
      csQueryArray = [
        "배송전 부분 교환",
        "배송전 전체 교환",
        "배송후 부분 교환",
        "배송후 전체 교환",
        "맞교환",
        "배송후교환C",
      ];
      break;
    case "배송전 취소":
      csQueryArray = ["배송전 부분 취소", "배송전 전체 취소"];
      break;
    case "배송후 취소":
      csQueryArray = ["배송후 부분 취소", "배송후 전체 취소"];
      break;
    case "배송전 교환":
      csQueryArray = ["배송전 부분 교환", "배송전 전체 교환"];
      break;
    case "배송후 교환":
      csQueryArray = ["배송후 부분 교환", "배송후 전체 교환", "배송후교환C"];
      break;
    case "보류":
    case "맞교환":
    case "배송후교환C":
      csQueryArray = [cs];
      break;
    case "부분취소":
      csQueryArray = ["배송전 부분 취소", "배송후 부분 취소"];
      break;
    case "부분취소 제외":
      csQueryArray = [
        "정상",
        "배송전 부분 교환",
        "배송전 전체 취소",
        "배송전 전체 교환",
        "배송후 부분 교환",
        "배송후 전체 취소",
        "배송후 전체 교환",
        "보류",
        "맞교환",
        "배송후교환C",
      ];
      break;
    default:
      csQueryArray = [cs];
      break;
  }

  let filterDiscountQueryArray: boolean[] = [];
  switch (filterDiscount) {
    case "전체":
      filterDiscountQueryArray = [true, false];
      break;
    case "할인 있음":
      filterDiscountQueryArray = [true];
      break;
    case "할인 없음":
      filterDiscountQueryArray = [false];
      break;
  }

  //OR Query 한도때문에 query array의 길이의 곱이 30을 넘을 수 없음
  const revenueDataRef = collection(firestore, `revenue-db`);
  let revenueDataQuery = query(
    revenueDataRef,
    where("orderDate", ">=", Timestamp.fromDate(startDate)),
    where("orderDate", "<=", Timestamp.fromDate(endDate)),
    where("orderStatus", "in", orderStatusQueryArray), // Max 3
    //where("cs", "in", csQueryArray), //Max 12, 사용 불가, 불러온 후 직접 필터해서 확인
    where("isDiscounted", "in", filterDiscountQueryArray) //Max 2
  );

  if (partnerName.length > 0) {
    revenueDataQuery = query(
      revenueDataQuery,
      where("partnerName", "==", partnerName)
    );
  }

  if (seller !== "all") {
    revenueDataQuery = query(revenueDataQuery, where("seller", "==", seller));
  }

  const partnerProfiles = await getAllPartnerProfiles(true);

  const querySnap = await getDocs(revenueDataQuery);
  const searchResult: { data: DocumentData; id: string }[] = [];
  querySnap.docs.forEach((doc) => {
    const data = doc.data();
    if (
      data.productName.includes(productName) &&
      csQueryArray.includes(data.cs)
    ) {
      //상품분류 검색한게 없으면 따로 검사 안함
      if (productCategory.length == 0) {
        data.orderDate = data.orderDate.toDate();
        searchResult.push({ data: data, id: doc.id });
      } else {
        //상품분류 검색이 있는데, 데이터의 상품분류 항목이 없으면 포함X
        const partnerProfile = partnerProfiles.get(data.partnerName);
        const productCategories = partnerProfile.productCategory;
        if (productCategories) {
          for (let i = 0; i < productCategory.length; i++) {
            if (productCategories.includes(productCategory[i])) {
              data.orderDate = data.orderDate.toDate();
              searchResult.push({ data: data, id: doc.id });
              break;
            }
          }
        }
      }
    }
  });
  return searchResult;
}

/**
 * 수익통계자료를 삭제합니다.
 * @param JSON string of {data: RevenueData, id: string}[]
 *
 */
export async function deleteRevenueData({ data }: { data: string }) {
  try {
    const time = new Date().getTime();

    await setDoc(doc(firestore, `revenue-data-delete/data`), {
      json: data,
      updateTime: time,
    });

    addLog("deleteRevenueData", {
      json: data,
      updateTime: time,
    });
    return true;
  } catch (error: any) {
    sendAligoMessage({
      text: `[로파파트너] ${error.message ?? error}`,
      receiver: "01023540973",
    });
    return error.message ?? error;
  }
}

export async function getRevenueStats({
  startDate,
  endDate,
}: {
  startDate: Date;
  endDate: Date;
}) {
  const partnerProfiles = await getAllPartnerProfiles(true);
  const revenueDataRef = collection(firestore, `revenue-db`);
  let revenueDataQuery = query(
    revenueDataRef,
    where("orderDate", ">=", Timestamp.fromDate(startDate)),
    where("orderDate", "<=", Timestamp.fromDate(endDate))
  );

  const querySnap = await getDocs(revenueDataQuery);
  const searchResult = new Map<string, PartnerRevenueStat>();

  try {
    querySnap.docs.forEach((doc) => {
      const data = doc.data() as RevenueData;
      const isLofa = LofaSellers.includes(data.seller);
      const isCsOK = data.cs == "정상";
      const isOrderStatusDeliver = data.orderStatus == "배송";

      const partnerProfile: PartnerProfile = partnerProfiles.get(
        data.partnerName
      );

      if (!searchResult.has(data.partnerName)) {
        let partnerStat: PartnerRevenueStat = {
          startDateStr: dateToDayStr(startDate),
          endDateStr: dateToDayStr(endDate),
          partnerName: data.partnerName,
          lofaSalesAmount: 0,
          otherSalesAmount: 0,
          totalSalesAmount: 0,
          partnerSettlement: 0,
          platformFee: 0,
          lofaDiscountLevy: 0,
          proceeds: 0,
          netProfitAfterTax: 0,
          returnRate: 0,
          productCategory: [], //TODO: add product category
        };

        searchResult.set(data.partnerName, partnerStat);
      }

      let lofaSalesAmount;
      let otherSalesAmount;
      let totalSalesAmount;
      let partnerSettlement;
      let platformFee;
      let lofaDiscountLevy;
      let proceeds;
      let netProfitAfterTax;

      let platformSettlement;

      if (!data.isDiscounted) {
        lofaSalesAmount =
          isCsOK && isLofa && isOrderStatusDeliver
            ? data.price * data.amount
            : 0;
        otherSalesAmount =
          isCsOK && !isLofa && isOrderStatusDeliver
            ? data.price * data.amount
            : 0;
        totalSalesAmount = lofaSalesAmount + otherSalesAmount;
        partnerSettlement =
          (totalSalesAmount * (100 - (data.commonFeeRate ?? NaN))) / 100;
        platformSettlement = isLofa
          ? totalSalesAmount
          : (totalSalesAmount * (100 - (data.platformFeeRate ?? NaN))) / 100; //플랫폼정산금
        platformFee = totalSalesAmount - platformSettlement;
        lofaDiscountLevy = 0;
        if (!isCsOK || !isOrderStatusDeliver) {
          netProfitAfterTax = 0;
        }
      } else {
        //TODO
        if (
          data.lofaDiscountLevyRate == undefined ||
          data.partnerDiscountLevyRate == undefined ||
          data.platformDiscountLevyRate == undefined ||
          data.lofaAdjustmentFeeRate == undefined ||
          data.platformAdjustmentFeeRate == undefined
        ) {
          throw Error(
            `해당 상품의 할인내역을 불러오는 과정에서 문제가 발생했습니다. (${data.productName})`
          );
        }
        const totalDiscountRate =
          data.lofaDiscountLevyRate +
          data.partnerDiscountLevyRate +
          data.platformDiscountLevyRate;
        lofaSalesAmount =
          isCsOK && isLofa && isOrderStatusDeliver
            ? ((data.price * (100 - totalDiscountRate)) / 100.0) * data.amount
            : 0;
        otherSalesAmount =
          isCsOK && !isLofa && isOrderStatusDeliver
            ? ((data.price * (100 - totalDiscountRate)) / 100.0) * data.amount
            : 0;
        totalSalesAmount = lofaSalesAmount + otherSalesAmount;
        const normalPriceTotalSalesAmount = data.price * data.amount;
        partnerSettlement =
          (normalPriceTotalSalesAmount *
            (100 -
              (data.commonFeeRate ?? NaN) -
              data.partnerDiscountLevyRate +
              data.lofaAdjustmentFeeRate)) /
          100;
        const platformSettlementStandard: "정상판매가" | "할인판매가" =
          NormalPriceStandardSellers.includes(data.seller)
            ? "정상판매가"
            : "할인판매가";
        platformSettlement = isLofa
          ? totalSalesAmount
          : platformSettlementStandard == "정상판매가"
          ? (normalPriceTotalSalesAmount *
              (100 -
                (data.platformFeeRate ?? NaN) -
                data.lofaDiscountLevyRate -
                data.partnerDiscountLevyRate +
                data.platformAdjustmentFeeRate)) /
            100
          : (((normalPriceTotalSalesAmount *
              (100 -
                data.lofaDiscountLevyRate -
                data.partnerDiscountLevyRate)) /
              100) *
              (100 -
                (data.platformFeeRate ?? NaN) +
                data.platformAdjustmentFeeRate)) /
            100; //플랫폼정산금
        platformFee = totalSalesAmount - platformSettlement;
        lofaDiscountLevy =
          (normalPriceTotalSalesAmount * data.lofaDiscountLevyRate) / 100;
      }

      proceeds = totalSalesAmount - partnerSettlement - platformFee;
      switch (data.businessTaxStandard) {
        case "일반":
          netProfitAfterTax = proceeds * 0.9;
          break;
        case "간이":
        case "비사업자":
          netProfitAfterTax = platformSettlement * 0.9 - partnerSettlement;
          break;
        case "면세":
        default:
          netProfitAfterTax = proceeds;
          break;
      }

      const stat = searchResult.get(data.partnerName) as PartnerRevenueStat;
      stat.lofaSalesAmount += lofaSalesAmount;
      stat.otherSalesAmount += otherSalesAmount;
      stat.totalSalesAmount += totalSalesAmount;
      stat.partnerSettlement += partnerSettlement;
      stat.platformFee += platformFee;
      stat.lofaDiscountLevy += lofaDiscountLevy;
      stat.proceeds += proceeds;
      stat.netProfitAfterTax += netProfitAfterTax;
      if (partnerProfile) {
        stat.productCategory = partnerProfile.productCategory ?? [];
      } else {
        stat.productCategory = [];
      }
    });
  } catch (error: any) {
    return error.message as string;
  }

  searchResult.forEach((stat: PartnerRevenueStat) => {
    if (stat.totalSalesAmount != 0) {
      stat.returnRate = (stat.netProfitAfterTax / stat.totalSalesAmount) * 100;
    } else {
      stat.returnRate = 0;
    }
  });

  return Array.from(searchResult.values());
}
