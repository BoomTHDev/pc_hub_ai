import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendPaginated } from "../lib/response.js";
import * as paymentService from "../services/payment.service.js";
import type {
  PaymentReviewInput,
  PaymentQuery,
  MarkCodPaidInput,
} from "../schemas/payment.schema.js";

export async function findAll(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as PaymentQuery;
    const result = await paymentService.findAll(query);
    sendPaginated(
      res,
      result.payments,
      result.total,
      result.page,
      result.limit,
    );
  } catch (e) {
    next(e);
  }
}

export async function findById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, await paymentService.findById(req.params.id as string));
  } catch (e) {
    next(e);
  }
}

export async function uploadSlip(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.file) {
      res
        .status(400)
        .json({
          success: false,
          error: { code: "NO_FILE", message: "No file uploaded" },
        });
      return;
    }
    const result = await paymentService.uploadSlip(
      req.params.id as string,
      req.user!.userId,
      req.file.buffer,
    );
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}

export async function reviewPayment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await paymentService.reviewPayment(
      req.params.id as string,
      req.user!.userId,
      req.body as PaymentReviewInput,
    );
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}

export async function markCodPaid(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { note } = req.body as MarkCodPaidInput;
    const result = await paymentService.markCodPaid(
      req.params.id as string,
      req.user!.userId,
      note,
    );
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}
