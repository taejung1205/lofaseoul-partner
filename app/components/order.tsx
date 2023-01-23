export type OrderItem = {
    seller: string;
    orderNumber: string;
    productName: string;
    optionName: string;
    amount: number;
    zipCode: string;
    address: string;
    phone: string;
    ordererPhone: string;
    orderer: string;
    receiver: string;
    customsCode: string;
    deliveryRequest: string;
    managementNumber: string; //관리번호
    shippingCompanyNumber: string;
    waybillNumber: string;
    partnerName: string;
  };