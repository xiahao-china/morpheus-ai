import crypto from 'crypto';

/**
 * 微信小程序数据解密工具类
 */
export class WXBizDataCrypt {
  appId: string;
  sessionKey: string;

  constructor(appId: string, sessionKey: string) {
    this.appId = appId;
    this.sessionKey = sessionKey;
  }

  decryptData(encryptedData: string, iv: string) {
    // base64 decode
    const sessionKey = Buffer.from(this.sessionKey, 'base64');
    const _encryptedData = Buffer.from(encryptedData, 'base64');
    const _iv = Buffer.from(iv, 'base64');

    try {
      // 解密
      const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, _iv);
      // 设置自动填充为 true，默认就是 true
      decipher.setAutoPadding(true);
      let decoded = decipher.update(_encryptedData, 'binary', 'utf8');
      decoded += decipher.final('utf8');

      const decodedObj = JSON.parse(decoded);

      if (decodedObj.watermark.appid !== this.appId) {
        throw new Error('Illegal Buffer');
      }

      return decodedObj;
    } catch (err: any) {
      throw new Error('Illegal Buffer');
    }
  }
}
