import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

/**
 * 生图 API 测试
 */
describe('生图 API 测试', () => {
  const testPhone = '13632958426';
  const verifyCode = '783284';
  let authToken: string;

  // 1. 先登录
  beforeAll(async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/user/login`, {
        type: 'phone',
        target: testPhone,
        code: verifyCode
      });
      authToken = response.data.data.token;
    } catch (error) {
      console.error('登录失败，测试可能会失败');
    }
  });

  // 2. 测试提示词优化
  it('应该能优化提示词', async () => {
    try {
      const originalPrompt = "a cute cat";
      console.log(`正在优化提示词: ${originalPrompt}...`);

      const response = await axios.post(
        `${BASE_URL}/api/v1/generation/prompt/optimize`,
        { prompt: originalPrompt },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      console.log('优化提示词响应:', response.data);

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(200);
      expect(response.data.data.optimizedPrompt).toContain(originalPrompt);
      expect(response.data.data.optimizedPrompt).toContain('Masterpiece');

    } catch (error: any) {
      console.error('优化提示词失败:', error.response?.data || error.message);
      throw error;
    }
  });

  // 3. 测试反馈功能（需要先创建图片记录，此处暂时跳过或使用真实流程）
  // 由于目前还没有完整的图片生成流程测试，这里只测试提示词优化功能

});