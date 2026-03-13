export const ALIPAY_CONFIG = {
  // 应用ID
  appId: 'your-app-id',
  // 应用私钥
  privateKey: 'your-private-key',
  // 支付宝公钥
  alipayPublicKey: 'your-alipay-public-key',
  // 支付宝网关
  gateway: 'https://openapi.alipay.com/gateway.do',
  // 签名算法类型
  signType: 'RSA2',
  // 支付成功回调地址
  notifyUrl: 'http://your-domain/api/payment/alipay/notify',
  // 支付成功跳转地址
  returnUrl: 'http://your-domain/payment/success',
};
