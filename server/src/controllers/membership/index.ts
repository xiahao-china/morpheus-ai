import { Context } from "koa";
import MembershipPackage from "@/models/membershipPackage";
// import MembershipOrder from "@/models/membershipOrder"; // Need to create this model if order logic is required

// 1. Get Membership Packages
export const getPackages = async (ctx: Context) => {
  try {
    const packages = await MembershipPackage.find({ isEnabled: true }).sort({ levelSort: 1 });
    ctx.body = { code: 200, data: packages };
  } catch (error) {
    ctx.body = { code: 500, msg: "Internal server error", error };
  }
};

// 2. Create Membership Order (Mock)
export const createOrder = async (ctx: Context) => {
  const { packageId } = ctx.request.body as any;
  const user = ctx.state.user as any;

  if (!packageId) {
    ctx.body = { code: 400, msg: "Package ID is required" };
    return;
  }

  try {
    const pkg = await MembershipPackage.findById(packageId);
    if (!pkg) {
      ctx.body = { code: 404, msg: "Package not found" };
      return;
    }

    // Mock Order Creation
    const orderId = `ORDER_${Date.now()}_${user._id}`;
    
    // In real scenario: Save order to DB, call Payment Gateway (WeChat/Alipay)
    
    ctx.body = { 
        code: 200, 
        data: { 
            orderId, 
            amount: pkg.price,
            payUrl: "https://mock-payment-gateway.com/pay/" + orderId 
        } 
    };

  } catch (error) {
    ctx.body = { code: 500, msg: "Internal server error", error };
  }
};
