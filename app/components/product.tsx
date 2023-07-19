export type Product = {
    productName: string;
    englishProductName: string;
    explanation: string;
    keyword: string;
    sellerPrice: number;
    isUsingOption: boolean;
    option: string;
    optionCount: number;
    mainImageFile: File;
    thumbnailImageFile: File;
    detailImageFileList: any[];
    refundExplanation: string;
    serviceExplanation: string;
  };
  