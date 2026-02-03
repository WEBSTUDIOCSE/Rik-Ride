// UPI Payment Types - Simple cash/UPI payment system for drivers

export interface DriverPaymentInfo {
  driverId: string;
  paymentMethod: PaymentMethod;
  upiId?: string;
  qrCodeUrl?: string;  // Firebase Storage URL for QR image
  qrCodeBase64?: string; // Optional base64 for quick display
  updatedAt: Date;
  isActive: boolean;
}

export enum PaymentMethod {
  CASH_ONLY = 'CASH_ONLY',
  UPI = 'UPI',
  CASH_AND_UPI = 'CASH_AND_UPI'
}

export interface PaymentDisplay {
  showQR: boolean;
  qrCodeUrl?: string;
  upiId?: string;
  driverName: string;
  fare: number;
  paymentMethod: PaymentMethod;
}

export interface RidePayment {
  bookingId: string;
  studentId: string;
  driverId: string;
  fare: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt?: Date;
  createdAt: Date;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CASH_COLLECTED = 'CASH_COLLECTED'
}
