import { AlipaySdk, AlipayFormData } from 'alipay-sdk';
import { ALIPAY_CONFIG } from '@/config';
import Order from '@/models/order';
import MembershipPackage from '@/models/membershipPackage';
import PointsRecord from '@/models/pointsRecord';
import User from '@/models/user';
import { logger } from '@/lib/log4js';

// 初始化支付宝SDK
const alipaySdk = new AlipaySdk({
  appId: ALIPAY_CONFIG.appId,
  privateKey: ALIPAY_CONFIG.privateKey,
  alipayPublicKey: ALIPAY_CONFIG.alipayPublicKey,
  gateway: ALIPAY_CONFIG.gateway,
  signType: ALIPAY_CONFIG.signType as 'RSA2',
});

/**
 * 创建支付宝订单
 * @param userId 用户ID
 * @param packageId 套餐ID
 * @param payType 支付类型（wap或page）
 */
export const createAlipayOrder = async (userId: string, packageId: string, payType: 'wap' | 'page' = 'wap') => {
  const pkg = await MembershipPackage.findById(packageId);
  if (!pkg) {
    throw new Error('Package not found');
  }

  // 创建订单记录
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

  // 准备支付宝表单数据
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

  // 生成支付链接
  const method = payType === 'page' ? 'alipay.trade.page.pay' : 'alipay.trade.wap.pay';
  const result = await alipaySdk.exec(method, {}, { formData: formData });

  return { payUrl: result, orderNo };
};

/**
 * 验证支付宝通知签名
 * @param params 支付宝回调参数
 */
export const verifyAlipaySignature = (params: any) => {
  return alipaySdk.checkNotifySign(params);
};

/**
 * 处理支付成功逻辑
 * @param out_trade_no 商户订单号
 * @param trade_no 支付宝交易号
 * @param total_amount 支付金额
 */
export const handlePaymentSuccess = async (out_trade_no: string, trade_no: string, total_amount: string) => {
  const order = await Order.findOne({ orderNo: out_trade_no });

  if (order && order.status === 'PENDING') {
    // 验证金额
    if (parseFloat(total_amount) === order.amount) {
      // 更新订单状态
      order.status = 'SUCCESS';
      order.tradeNo = trade_no;
      order.payTime = new Date();
      await order.save();

      // 授予权益
      await grantBenefits(order);
      return true;
    } else {
       logger.warn(`订单金额不匹配: ${out_trade_no}, 预期: ${order.amount}, 实际: ${total_amount}`);
       return false;
    }
  }
  return true; // 已处理或未找到（幂等）
};

/**
 * 授予权益的辅助函数
 * @param order 订单对象
 */
const grantBenefits = async (order: any) => {
  try {
    const pkg = await MembershipPackage.findById(order.packageId);
    if (!pkg) return;

    // 1. 添加积分记录（日志）
    const pointsRecord = new PointsRecord({
      userId: order.userId,
      pointType: 'RECHARGE',
      points: pkg.coins,
      level: pkg.level,
      effectiveTime: new Date(),
      expiryDate: pkg.validMonths ? new Date(Date.now() + pkg.validMonths * 30 * 24 * 60 * 60 * 1000) : undefined,
    });
    await pointsRecord.save();

    // 2. 更新用户余额和会员等级
    const updateData: any = {
      $inc: { points: pkg.coins }, // 增加积分
    };

    // 如果套餐有等级，更新会员等级
    if (pkg.level) {
      updateData.membershipLevel = pkg.level;
      if (pkg.validMonths) {
         // 如果用户已有该等级且未过期，从现在开始延长
         // 为简单起见，我们直接从现在 + validMonths 设置
         updateData.membershipExpiry = new Date(Date.now() + pkg.validMonths * 30 * 24 * 60 * 60 * 1000);
      }
    }

    await User.findByIdAndUpdate(order.userId, updateData);

    logger.info(`订单 已授予权益 ${order.orderNo}: ${pkg.coins} 积分, Level ${pkg.level}`);
  } catch (error) {
    logger.error("授予权益错误:", error);
    throw error;
  }
};