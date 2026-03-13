import { AlipaySdk, AlipayFormData } from 'alipay-sdk';
import { ALIPAY_CONFIG } from '@/config';
import Order from '@/models/order';
import MembershipPackage from '@/models/membershipPackage';
import PointsRecord from '@/models/pointsRecord';
import User from '@/models/user';
import { logger } from '@/lib/log4js';

// Initialize Alipay SDK
const alipaySdk = new AlipaySdk({
  appId: ALIPAY_CONFIG.appId,
  privateKey: ALIPAY_CONFIG.privateKey,
  alipayPublicKey: ALIPAY_CONFIG.alipayPublicKey,
  gateway: ALIPAY_CONFIG.gateway,
  signType: ALIPAY_CONFIG.signType as 'RSA2',
});

/**
 * Create Alipay Order
 */
export const createAlipayOrder = async (userId: string, packageId: string, payType: 'wap' | 'page' = 'wap') => {
  const pkg = await MembershipPackage.findById(packageId);
  if (!pkg) {
    throw new Error('Package not found');
  }

  // Create Order Record
  const orderNo = `ORD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const order = new Order({
    userId,
    orderNo,
    amount: pkg.price,
    status: 'PENDING',
    paymentMethod: 'ALIPAY',
    packageId: pkg._id,
    points: pkg.coins,
    description: pkg.name
  });
  await order.save();

  // Prepare Alipay Form Data
  const formData = new AlipayFormData();
  formData.setMethod('get');
  
  const bizContent = {
    out_trade_no: orderNo,
    product_code: payType === 'page' ? 'FAST_INSTANT_TRADE_PAY' : 'QUICK_WAP_WAY',
    total_amount: pkg.price.toFixed(2),
    subject: pkg.name,
    body: pkg.description || `Purchase ${pkg.name}`,
  };
  
  formData.addField('bizContent', bizContent);
  formData.addField('returnUrl', ALIPAY_CONFIG.returnUrl);
  formData.addField('notifyUrl', ALIPAY_CONFIG.notifyUrl);

  // Generate Payment URL
  const method = payType === 'page' ? 'alipay.trade.page.pay' : 'alipay.trade.wap.pay';
  const result = await alipaySdk.exec(method, {}, { formData: formData });

  return { payUrl: result, orderNo };
};

/**
 * Verify Alipay Notification Signature
 */
export const verifyAlipaySignature = (params: any) => {
  return alipaySdk.checkNotifySign(params);
};

/**
 * Handle Payment Success Logic
 */
export const handlePaymentSuccess = async (out_trade_no: string, trade_no: string, total_amount: string) => {
  const order = await Order.findOne({ orderNo: out_trade_no });
        
  if (order && order.status === 'PENDING') {
    // Verify amount
    if (parseFloat(total_amount) === order.amount) {
      // Update Order Status
      order.status = 'SUCCESS';
      order.tradeNo = trade_no;
      order.payTime = new Date();
      await order.save();
      
      // Grant Benefits
      await grantBenefits(order);
      return true;
    } else {
       logger.warn(`Order amount mismatch: ${out_trade_no}, Expected: ${order.amount}, Actual: ${total_amount}`);
       return false;
    }
  }
  return true; // Already processed or not found (idempotent)
};

// Helper: Grant Benefits
const grantBenefits = async (order: any) => {
  try {
    const pkg = await MembershipPackage.findById(order.packageId);
    if (!pkg) return;

    // 1. Add Points Record (Log)
    const pointsRecord = new PointsRecord({
      userId: order.userId,
      pointType: 'RECHARGE',
      points: pkg.coins,
      level: pkg.level,
      effectiveTime: new Date(),
      expiryDate: pkg.validMonths ? new Date(Date.now() + pkg.validMonths * 30 * 24 * 60 * 60 * 1000) : undefined,
    });
    await pointsRecord.save();
    
    // 2. Update User Balance and Membership
    const updateData: any = {
      $inc: { points: pkg.coins }, // Increment points
    };

    // If package has level, update membership
    if (pkg.level) {
      updateData.membershipLevel = pkg.level;
      if (pkg.validMonths) {
         // If user already has this level and it's not expired, extend it?
         // For simplicity, we just set it from now + validMonths
         updateData.membershipExpiry = new Date(Date.now() + pkg.validMonths * 30 * 24 * 60 * 60 * 1000);
      }
    }

    await User.findByIdAndUpdate(order.userId, updateData);

    logger.info(`Benefits granted for order ${order.orderNo}: ${pkg.coins} coins, Level ${pkg.level}`);
  } catch (error) {
    logger.error("Grant Benefits Error:", error);
    throw error;
  }
};
