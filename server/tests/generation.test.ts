import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

describe('Generation API', () => {
  const testPhone = '13632958426';
  const verifyCode = '783284';
  let authToken: string;

  // 1. Login first
  beforeAll(async () => {
    try {
        const response = await axios.post(`${BASE_URL}/api/user/login`, {
            type: 'phone',
            target: testPhone,
            code: verifyCode
        });
        authToken = response.data.data.token;
    } catch (error) {
        console.error('Login failed, tests might fail');
    }
  });

  // 2. Test Prompt Optimization
  it('should optimize prompt', async () => {
    try {
      const originalPrompt = "a cute cat";
      console.log(`Optimizing prompt: ${originalPrompt}...`);
      
      const response = await axios.post(
        `${BASE_URL}/api/v1/generation/prompt/optimize`,
        { prompt: originalPrompt },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      console.log('Optimize Prompt Response:', response.data);
      
      expect(response.status).toBe(200);
      expect(response.data.code).toBe(200);
      expect(response.data.data.optimizedPrompt).toContain(originalPrompt);
      expect(response.data.data.optimizedPrompt).toContain('Masterpiece');
      
    } catch (error: any) {
      console.error('Optimize Prompt Error:', error.response?.data || error.message);
      throw error;
    }
  });

  // 3. Test Feedback (Need to create an image record first, mock it here or use real flow if possible)
  // Since we don't have image generation flow fully tested yet, we might skip this or mock DB entry if we could.
  // For now, let's just test the prompt optimization which is standalone.

});
