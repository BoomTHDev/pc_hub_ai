export type UserRole = "ADMIN" | "STAFF" | "CUSTOMER";
export type AddressType = "HOME" | "WORK" | "OTHER";
export type PaymentMethod = "PROMPTPAY_QR" | "COD";
export type PaymentStatus =
  | "AWAITING_SLIP"
  | "WAITING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "COD_PENDING"
  | "COD_PAID"
  | "CANCELLED";
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "WAITING_PAYMENT_REVIEW"
  | "PAYMENT_REJECTED"
  | "CONFIRMED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";
export type InventoryTransactionType =
  | "RESTOCK"
  | "SALE"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "RETURN_IN"
  | "RETURN_OUT";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    products: number;
  };
}

export interface Brand {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    products: number;
  };
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt?: string;
}

export interface ProductAttribute {
  id?: string;
  name: string;
  value: string;
  createdAt?: string;
}

export interface ProductCard {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string | null;
  price: number | string;
  stockQty: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: Pick<Category, "id" | "name">;
  brand: Pick<Brand, "id" | "name">;
  images: ProductImage[];
}

export interface ProductDetail extends ProductCard {
  category: Category;
  brand: Brand;
  attributes: ProductAttribute[];
  images: ProductImage[];
}

export interface CartItem {
  cartId: string;
  productId: string;
  quantity: number;
  unitPrice: number | string;
  createdAt: string;
  updatedAt: string;
  product: ProductCard;
}

export interface Cart {
  id: string;
  userId: string;
  status: "ACTIVE" | "CHECKED_OUT" | "ABANDONED";
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
  itemCount: number;
  subTotal: number;
}

export interface Address {
  id: string;
  userId: string;
  type: AddressType;
  label: string | null;
  recipientName: string;
  recipientPhone: string;
  line1: string;
  line2: string | null;
  subDistrict: string | null;
  district: string | null;
  province: string;
  postalCode: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productSku: string;
  productName: string;
  unitPrice: number | string;
  quantity: number;
  lineTotal: number | string;
  createdAt: string;
  product?: ProductCard;
}

export interface PaymentSlip {
  id: string;
  paymentId: string;
  imageUrl: string;
  uploadedAt: string;
}

export interface PaymentSummary {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number | string;
  qrCodeUrl: string | null;
  paidAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  slips: PaymentSlip[];
  reviewedBy?: Pick<UserProfile, "id" | "firstName" | "lastName"> | null;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  subTotal: number | string;
  shippingFee: number | string;
  grandTotal: number | string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payment?: PaymentSummary | null;
  user?: Pick<UserProfile, "id" | "firstName" | "lastName" | "email">;
}

export interface PaymentDetail extends PaymentSummary {
  order: OrderSummary & {
    user?: Pick<UserProfile, "id" | "firstName" | "lastName" | "email">;
  };
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  type: InventoryTransactionType;
  quantity: number;
  referenceId: string | null;
  note: string | null;
  createdAt: string;
  product: Pick<ProductCard, "id" | "sku" | "name" | "stockQty">;
}
