import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  UserRole,
} from "../models/domain.models";

export type Tone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";

export function orderStatusLabel(status: OrderStatus): string {
  return status.replaceAll("_", " ");
}

export function paymentStatusLabel(status: PaymentStatus): string {
  return status.replaceAll("_", " ");
}

export function paymentMethodLabel(method: PaymentMethod): string {
  return method === "PROMPTPAY_QR" ? "PromptPay QR" : "Cash on Delivery";
}

export function roleLabel(role: UserRole): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export function orderStatusTone(status: OrderStatus): Tone {
  switch (status) {
    case "CONFIRMED":
    case "DELIVERED":
      return "success";
    case "PENDING_PAYMENT":
    case "WAITING_PAYMENT_REVIEW":
    case "PREPARING":
    case "SHIPPED":
      return "warning";
    case "PAYMENT_REJECTED":
    case "CANCELLED":
      return "danger";
    default:
      return "neutral";
  }
}

export function paymentStatusTone(status: PaymentStatus): Tone {
  switch (status) {
    case "APPROVED":
    case "COD_PAID":
      return "success";
    case "AWAITING_SLIP":
    case "WAITING_REVIEW":
    case "COD_PENDING":
      return "warning";
    case "REJECTED":
    case "CANCELLED":
      return "danger";
    default:
      return "neutral";
  }
}
