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
  refundExplanation: string;
  serviceExplanation: string;
};

export type LoadedProduct = {
  partnerName: string;
  productName: string;
  englishProductName: string;
  explanation: string;
  keyword: string;
  sellerPrice: number;
  isUsingOption: boolean;
  option: string;
  mainImageURL: string;
  thumbnailImageURL: string;
  detailImageURLList: string[];
  refundExplanation: string;
  serviceExplanation: string;
};