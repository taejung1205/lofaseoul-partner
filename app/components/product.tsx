export type Product = {
  partnerName: string;
  productName: string;
  englishProductName: string;
  explanation: string;
  keyword: string;
  sellerPrice: number;
  isUsingOption: boolean;
  option: string;
  mainImageFile: File;
  thumbnailImageFile: File;
  detailImageFileList: any[];
  memo: string;
  refundExplanation: string;
  serviceExplanation: string;
  status: "승인대기" | "승인거부" | "승인완료" | "임시저장";
};

export type ProductWithoutFile = {
  partnerName: string;
  productName: string;
  englishProductName: string;
  explanation: string;
  keyword: string;
  sellerPrice: number;
  isUsingOption: boolean;
  option: string;
  memo: string;
  refundExplanation: string;
  serviceExplanation: string;
  status: "승인대기" | "승인거부" | "승인완료" | "임시저장";
};

export type LoadedProduct = {
  id: string;
  partnerName: string;
  productName: string;
  englishProductName: string;
  explanation: string;
  keyword: string;
  sellerPrice: number;
  isUsingOption: boolean;
  option: string;
  mainImageURL: string;
  mainImageName: string;
  thumbnailImageURL: string;
  thumbnailImageName: string;
  detailImageURLList: string[];
  detailImageNameList: string[];
  memo: string;
  refundExplanation: string;
  serviceExplanation: string;
  status: "승인대기" | "승인거부" | "승인완료" | "임시저장";
};
