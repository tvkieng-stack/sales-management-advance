export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
export type Status = 'ACTIVE' | 'INACTIVE';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type InvoiceStatus = 'DRAFT' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD';
export type PurchaseStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED';
export type StockTransactionType = 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN';

export interface User {
  id: number;
  username: string;
  passwordHash?: string;
  roleId: number;
  roleName: Role;
  employeeId?: number | null;
  employeeName?: string;
  status: Status;
  createdAt: string;
}

export interface Employee {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  position: string;
  salary: number;
  status: Status;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  status: Status;
}

export interface Product {
  id: number;
  barcode: string;
  name: string;
  categoryId: number | null;
  categoryName?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minimumStock: number;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export type CustomerTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
export type LoyaltyTransactionType = 'EARN' | 'REDEEM' | 'ADJUSTMENT' | 'INITIAL';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  loyaltyPoints: number;
  tier?: CustomerTier;
  totalEarnedPoints?: number;
  totalRedeemedPoints?: number;
  createdAt: string;
}

export interface LoyaltyTransaction {
  id: number;
  customerId: number;
  customerName?: string;
  type: LoyaltyTransactionType;
  points: number; // positive = earned/added, negative = redeemed/deducted
  balanceAfter: number;
  invoiceId?: number;
  invoiceCode?: string;
  note?: string;
  createdAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: Status;
}

export interface InvoiceDetail {
  id: number;
  invoiceId: number;
  productId: number;
  productName: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface Invoice {
  id: number;
  invoiceCode: string;
  employeeId: number;
  employeeName?: string;
  customerId: number | null;
  customerName?: string;
  subtotal: number;
  discount: number;
  pointsEarned?: number;
  pointsRedeemed?: number;
  pointsDiscount?: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: InvoiceStatus;
  createdAt: string;
  items?: InvoiceDetail[];
}

export interface PurchaseDetail {
  id: number;
  purchaseId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface Purchase {
  id: number;
  purchaseCode: string;
  supplierId: number;
  supplierName?: string;
  employeeId: number;
  employeeName?: string;
  totalCost: number;
  status: PurchaseStatus;
  createdAt: string;
  items?: PurchaseDetail[];
}

export interface StockTransaction {
  id: number;
  productId: number;
  productName: string;
  employeeId?: number | null;
  employeeName?: string;
  type: StockTransactionType;
  quantity: number; // positive = stock in, negative = stock out
  referenceType?: string;
  referenceId?: number;
  note?: string;
  createdAt: string;
}

export interface Promotion {
  id: number;
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: string;
  endDate: string;
  status: Status;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface PosTab {
  id: string;
  title: string;
  cart: CartItem[];
  customerId: number | null;
  promotionId: number | null;
  customDiscount: number;
  redeemPoints?: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export type ActivityActionType =
  | 'STOCK_ADJUSTMENT'
  | 'PRODUCT_DELETE'
  | 'PRODUCT_CREATE'
  | 'PRODUCT_UPDATE'
  | 'CATEGORY_DELETE'
  | 'CATEGORY_CREATE'
  | 'CATEGORY_UPDATE'
  | 'REPORT_EXPORT'
  | 'USER_LOGIN'
  | 'USER_CREATE'
  | 'USER_STATUS_CHANGE'
  | 'USER_PASSWORD_CHANGE'
  | 'EMPLOYEE_CREATE'
  | 'EMPLOYEE_UPDATE'
  | 'EMPLOYEE_DEACTIVATE'
  | 'BACKUP_EXPORT'
  | 'BACKUP_RESTORE'
  | 'SYSTEM_RESET'
  | 'PROMOTION_DELETE'
  | 'PROMOTION_CREATE'
  | 'PROMOTION_UPDATE'
  | 'SUPPLIER_DELETE'
  | 'SUPPLIER_CREATE'
  | 'SUPPLIER_UPDATE'
  | 'PURCHASE_CONFIRM'
  | 'INVOICE_CHECKOUT'
  | 'CUSTOMER_CREATE'
  | 'CUSTOMER_UPDATE'
  | 'CUSTOMER_POINTS_ADJUST'
  | 'LOGS_CLEARED';

export type ActivitySeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type ActivityTargetType =
  | 'PRODUCT'
  | 'INVENTORY'
  | 'FINANCE'
  | 'USER'
  | 'EMPLOYEE'
  | 'CATEGORY'
  | 'SUPPLIER'
  | 'PROMOTION'
  | 'SYSTEM'
  | 'INVOICE'
  | 'CUSTOMER';

export interface ActivityLog {
  id: number;
  userId?: number;
  username: string;
  userRole: Role;
  employeeName?: string;
  action: ActivityActionType;
  actionTitle: string;
  targetType: ActivityTargetType;
  targetId?: string | number;
  targetName?: string;
  details: string;
  metadata?: Record<string, any>;
  severity: ActivitySeverity;
  ipAddress?: string;
  createdAt: string;
}
