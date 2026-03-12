import Router from "koa-router";
import { getPackages, createOrder } from "@/controllers/membership";
import { authMiddleware } from "@/middleware/auth";

export default (router: Router) => {
  // Get Membership Packages
  router.get('/api/v1/membership/packages', getPackages);

  // Create Membership Order
  router.post('/api/v1/membership/order', authMiddleware, createOrder);
}
