import { sendSuccess, sendPaginated } from "../lib/response.js";
import type { TypedHandler, IdParam } from "../lib/typed-request.js";
import * as paymentService from "../services/payment.service.js";
import type {
  PaymentReviewInput,
  PaymentQuery,
  MarkCodPaidInput,
} from "../schemas/payment.schema.js";

export const findAll: TypedHandler<
  Record<string, string>,
  unknown,
  PaymentQuery
> = async (req, res, next) => {
  try {
    const result = await paymentService.findAll(req.query);
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
};

export const findById: TypedHandler<IdParam> = async (req, res, next) => {
  try {
    sendSuccess(res, await paymentService.findById(req.params.id));
  } catch (e) {
    next(e);
  }
};

export const uploadSlip: TypedHandler<IdParam> = async (req, res, next) => {
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
    sendSuccess(
      res,
      await paymentService.uploadSlip(
        req.params.id,
        req.user!.userId,
        req.file.buffer,
      ),
    );
  } catch (e) {
    next(e);
  }
};

export const reviewPayment: TypedHandler<IdParam, PaymentReviewInput> = async (
  req,
  res,
  next,
) => {
  try {
    sendSuccess(
      res,
      await paymentService.reviewPayment(
        req.params.id,
        req.user!.userId,
        req.body,
      ),
    );
  } catch (e) {
    next(e);
  }
};

export const markCodPaid: TypedHandler<IdParam, MarkCodPaidInput> = async (
  req,
  res,
  next,
) => {
  try {
    sendSuccess(
      res,
      await paymentService.markCodPaid(
        req.params.id,
        req.user!.userId,
        req.body.note,
      ),
    );
  } catch (e) {
    next(e);
  }
};
