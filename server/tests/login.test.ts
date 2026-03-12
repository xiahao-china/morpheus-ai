import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

describe('User Authentication API', () => {
  const testPhone = '13632958426'; // User's phone number
  const verifyCode = '783284'; // Received verification code
  let authToken: string;
  let userId: string;

  // 1. Test Send Verification Code
  // it('should send SMS verification code', async () => { ... });

  // 2. Test Login with Verification Code
  it('should login successfully with verification code', async () => {
    try {
      console.log(`Logging in with phone ${testPhone} and code ${verifyCode}...`);
      const response = await axios.post(`${BASE_URL}/api/user/login`, {
        type: 'phone',
        target: testPhone,
        code: verifyCode
      });

      console.log('Login Response:', response.data);
      
      expect(response.status).toBe(200);
      expect(response.data.code).toBe(200);
      expect(response.data.data).toHaveProperty('token');
      
      authToken = response.data.data.token;
      userId = response.data.data.user._id;

    } catch (error: any) {
      console.error('Login Error:', error.response?.data || error.message);
      throw error;
    }
  });

  // 3. Test Update User Info
  it('should update user info', async () => {
    try {
      const newNickname = `TestUser_${Date.now()}`;
      console.log(`Updating user info with nickname: ${newNickname}...`);
      
      const response = await axios.put(
        `${BASE_URL}/api/user/info`, 
        { nickname: newNickname },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      console.log('Update User Info Response:', response.data);
      
      expect(response.status).toBe(200);
      expect(response.data.code).toBe(200);
      expect(response.data.data.nickname).toBe(newNickname);
      
    } catch (error: any) {
      console.error('Update User Info Error:', error.response?.data || error.message);
      throw error;
    }
  });

  // 4. Test Get User Info
  it('should get user info', async () => {
    try {
      console.log('Getting user info...');
      
      const response = await axios.get(
        `${BASE_URL}/api/user/info`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      console.log('Get User Info Response:', response.data);
      
      expect(response.status).toBe(200);
      expect(response.data.code).toBe(200);
      expect(response.data.data._id).toBe(userId);
      expect(response.data.data.phone).toBe(testPhone);
      
    } catch (error: any) {
      console.error('Get User Info Error:', error.response?.data || error.message);
      throw error;
    }
  });

});
