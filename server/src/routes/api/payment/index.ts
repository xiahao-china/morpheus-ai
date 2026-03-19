import Router from "koa-router";
import * as alipayController from "@/controllers/payment";
import { authMiddleware } from "@/middleware/auth";

export default (router: Router) => {
  // Create Payment (Require Login)
  router.post("/payment/alipay/create", authMiddleware, alipayController.createPayment);
  
  // Alipay Notify (No Login)
  router.post("/payment/alipay/notify", alipayController.notify);
};
