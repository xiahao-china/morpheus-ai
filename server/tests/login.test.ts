import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

/**
 * 用户认证 API 测试
 */
describe('用户认证 API 测试', () => {
  const testPhone = '13632958426'; // 测试手机号
  const verifyCode = '666666';     // 接收到的验证码
  let authToken: string;
  let userId: string;

  // 1. 测试使用验证码登录
  it('应该能使用验证码成功登录', async () => {
    try {
      console.log(`正在使用手机号 ${testPhone} 和验证码 ${verifyCode} 登录...`);
      const response = await axios.post(`${BASE_URL}/api/user/login`, {
        type: 'phone',
        target: testPhone,
        code: verifyCode
      });

      console.log('登录响应:', response.data);

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(200);
      const cookies = response.headers['set-cookie'] || [];
      const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
      expect(tokenCookie).toBeDefined();
      authToken = tokenCookie.split(';')[0].split('=')[1];
      userId = response.data.data.user._id;

    } catch (error: any) {
      console.error('登录失败:', error.response?.data || error.message);
      throw error;
    }
  });

  // 2. 测试更新用户信息
  it('应该能更新用户信息', async () => {
    try {
      const newNickname = `测试用户_${Date.now()}`;
      console.log(`正在更新用户昵称为: ${newNickname}...`);

      const response = await axios.put(
        `${BASE_URL}/api/user/info`,
        { nickname: newNickname },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      console.log('更新用户信息响应:', response.data);

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(200);
      expect(response.data.data.nickname).toBe(newNickname);

    } catch (error: any) {
      console.error('更新用户信息失败:', error.response?.data || error.message);
      throw error;
    }
  });

  // 3. 测试获取用户信息
  it('应该能获取用户信息', async () => {
    try {
      console.log('正在获取用户信息...');

      const response = await axios.get(
        `${BASE_URL}/api/user/info`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      console.log('获取用户信息响应:', response.data);

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(200);
      expect(response.data.data._id).toBe(userId);
      expect(response.data.data.phone).toBe(testPhone);

    } catch (error: any) {
      console.error('获取用户信息失败:', error.response?.data || error.message);
      throw error;
    }
  });

});
