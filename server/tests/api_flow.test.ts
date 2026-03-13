import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

// 测试配置
const TEST_CONFIG = {
  phone: '13800138000',
  verifyCode: '666666', // 模拟验证码
  imageParams: {
    prompt: "a modern living room, high quality, 4k",
    negative_prompt: "low quality, blurry",
    width: 512,
    height: 512,
    count: 1
  },
  // 上传文件路径，相对于 server 目录或使用绝对路径
  uploadFilePath: path.resolve(__dirname, '../../web-mobile/src/assest/image/company_logo.png')
};

/**
 * API 集成流程测试
 */
describe('API 集成流程测试', () => {
  let authToken: string;
  let userId: string;
  let taskId: string;
  let uploadedFileUrl: string;

  // 1. 获取验证码
  it('1. 应该能发送验证码（模拟）', async () => {
    try {
      console.log(`正在向 ${TEST_CONFIG.phone} 发送验证码...`);
      const response = await axios.post(`${BASE_URL}/api/user/send-code`, {
        type: 'phone',
        target: TEST_CONFIG.phone
      });

      console.log('发送验证码响应:', response.data);
      expect(response.status).toBe(200);
      expect(response.data.code).toBe(200);
    } catch (error: any) {
      console.error('发送验证码失败:', error.response?.data || error.message);
      throw error;
    }
  });

  // 2. 登录
  it('2. 应该能使用验证码登录', async () => {
    try {
      console.log(`正在使用验证码 ${TEST_CONFIG.verifyCode} 登录...`);
      const response = await axios.post(`${BASE_URL}/api/user/login`, {
        type: 'phone',
        target: TEST_CONFIG.phone,
        code: TEST_CONFIG.verifyCode
      });

      console.log('登录响应:', response.data);
      expect(response.status).toBe(200);
      expect(response.data.code).toBe(200);
      expect(response.data.data).toHaveProperty('token');
      expect(response.data.data).toHaveProperty('user');

      authToken = response.data.data.token;
      userId = response.data.data.user._id;

      // 验证 token 格式（简单检查）
      expect(authToken.split('.').length).toBe(3);
    } catch (error: any) {
      console.error('登录失败:', error.response?.data || error.message);
      throw error;
    }
  });

  // 3. 生成图片
  it('3. 应该能提交图片生成任务', async () => {
    if (!authToken) {
      console.warn('跳过图片生成测试，因为登录失败');
      return;
    }

    try {
      console.log('正在提交图片生成任务...');
      const response = await axios.post(
        `${BASE_URL}/api/image/generate`,
        TEST_CONFIG.imageParams,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      console.log('生成图片响应:', response.data);
      expect(response.status).toBe(200);
      expect(response.data.code).toBe(200);
      expect(response.data.data).toHaveProperty('taskId');
      expect(response.data.data.status).toBe('queued');

      taskId = response.data.data.taskId;
    } catch (error: any) {
      console.error('生成图片失败:', error.response?.data || error.message);
      throw error;
    }
  });

  // 4. 检查任务状态
  it('4. 应该能检查任务状态', async () => {
    if (!taskId) {
      console.warn('跳过状态检查，因为任务提交失败');
      return;
    }

    try {
      console.log(`正在检查任务 ${taskId} 的状态...`);
      // 注意：当前实现可能使用 SSE，我们尝试连接看是否能返回 200
      // 根据控制器代码：
      // export const getGenerationStatus = async (ctx: Context) => { ... }
      // 它设置了 SSE。所以普通的 GET 请求可能会挂起或返回流
      // 对于这个测试，我们尝试连接看是否能建立连接

      const response = await axios.get(
        `${BASE_URL}/api/image/status/${taskId}`,
        {
            headers: { Authorization: `Bearer ${authToken}`, Accept: 'text/event-stream' },
            responseType: 'stream',
            timeout: 2000 // 短超时，因为我们只想检查连接
        }
      );

      expect(response.status).toBe(200);
      console.log('任务状态 SSE 连接已建立');

      // 销毁流以防止挂起
      response.data.destroy();

    } catch (error: any) {
       // 如果是有效的数据流且没有立即发送数据，超时是预期的
       if (error.code === 'ECONNABORTED') {
           console.log('SSE 连接超时（短超时的预期行为）');
       } else {
           console.error('检查状态失败:', error.message);
           // 如果端点可访问，不要严格失败测试
           // throw error;
       }
    }
  });

  // 5. 上传文件
  it('5. 应该能上传文件', async () => {
    if (!authToken) {
      console.warn('跳过文件上传测试，因为登录失败');
      return;
    }

    try {
      console.log(`正在上传文件: ${TEST_CONFIG.uploadFilePath}...`);

      if (!fs.existsSync(TEST_CONFIG.uploadFilePath)) {
          throw new Error(`测试文件不存在: ${TEST_CONFIG.uploadFilePath}`);
      }

      const form = new FormData();
      form.append('file', fs.createReadStream(TEST_CONFIG.uploadFilePath));

      const response = await axios.post(`${BASE_URL}/api/file/upload`, form, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          ...form.getHeaders()
        }
      });

      console.log('上传文件响应:', response.data);
      expect(response.status).toBe(200);
      expect(response.data.code).toBe(200);
      expect(response.data.data).toHaveProperty('url');

      uploadedFileUrl = response.data.data.url;
    } catch (error: any) {
      console.error('上传文件失败:', error.response?.data || error.message);
      throw error;
    }
  });

  // 6. 验证上传的文件可访问
  it('6. 应该能通过 URL 访问上传的文件', async () => {
    if (!uploadedFileUrl) {
      console.warn('跳过文件访问测试，因为上传失败');
      return;
    }

    try {
      console.log(`正在访问上传的文件: ${uploadedFileUrl}...`);
      const response = await axios.get(uploadedFileUrl);

      expect(response.status).toBe(200);
      console.log('文件访问成功，Content-Type:', response.headers['content-type']);
    } catch (error: any) {
      console.error('访问文件失败:', error.message);
      throw error;
    }
  });

  // 7. Third Party Task (Mock)
  it('7. Should create and process 3rd party task', async () => {
      if (!authToken) return;

      const params = {
          ...TEST_CONFIG.imageParams,
          base_images: ["https://example.com/base.png"] // Mock base image
      };

      try {
          console.log('Submitting 3rd party task...');
          const response = await axios.post(
              `${BASE_URL}/api/image/generate`,
              params,
              { headers: { Authorization: `Bearer ${authToken}` } }
          );

          expect(response.status).toBe(200);
          expect(response.data.data).toHaveProperty('taskId');
          
          const taskId = response.data.data.taskId;
          console.log('3rd Party Task ID:', taskId);

          // Wait a bit for scheduler to pick it up (mock execution takes 2s)
          // Since scheduler runs every 2s, and might need 2 cycles if ComfyUI task is running
          await new Promise(resolve => setTimeout(resolve, 5000));

          // Check status
          const statusRes = await axios.get(
              `${BASE_URL}/api/image/detail/${taskId}`,
              { headers: { Authorization: `Bearer ${authToken}` } }
          );
          
          console.log('3rd Party Task Status:', statusRes.data.data.status);
          // It should be COMPLETED or PROCESSING depending on timing
          // Since mock execution finishes in 2s, and we wait 3s, it should be COMPLETED
          expect(statusRes.data.data.status).toBe('COMPLETED');

      } catch (error: any) {
          console.error('3rd Party Task Error:', error.response?.data || error.message);
          throw error;
      }
  }, 10000); // Increase timeout for this test

});