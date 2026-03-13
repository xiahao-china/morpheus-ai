import request from 'supertest';
import mongoose from 'mongoose';

// Mock ioredis BEFORE importing app to avoid connection errors
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    // Add other methods if needed
  }));
});

// Mock uuid to avoid ESM issues
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-1234'
}));

import app from '../src/index'; // Adjust path if needed
// import { connectMongoDB } from '../src/lib/mongodb';
import User from '../src/models/user';
import UserTaskRecord from '../src/models/userTaskRecord';
import PointsRecord from '../src/models/pointsRecord';
import { signToken } from '../src/utils/token';

let server: any;
let token: string;
let userId: string;

beforeAll(async () => {
  // Connect to a test database
  // connectMongoDB();
  
  // Wait for connection? Mongoose buffers commands, but better to wait if possible
  // Or just rely on mongoose buffering
  
  server = app.listen(3001); // Run on different port for testing

  // Create Test User
  const user = new User({
    username: `test_user_${Date.now()}`,
    points: 0
  });
  await user.save();
  userId = user._id.toString();
  token = signToken(user);
});

afterAll(async () => {
  // Cleanup
  await User.findByIdAndDelete(userId);
  await UserTaskRecord.deleteMany({ userId });
  await PointsRecord.deleteMany({ userId });
  await mongoose.connection.close();
  server.close();
});

describe('Task Reward System API', () => {

  // 1. Get Task List
  test('GET /api/v1/tasks - Should return task list', async () => {
    const res = await request(server)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    
    // Check for 'daily_sign_in' task
    const signInTask = res.body.data.find((t: any) => t.code === 'daily_sign_in');
    expect(signInTask).toBeDefined();
    expect(signInTask.status).toBe(0); // Should be IN_PROGRESS initially
  });

  // 2. Perform Sign In Task
  test('POST /api/v1/tasks/perform - Should perform Sign In', async () => {
    const res = await request(server)
      .post('/api/v1/tasks/perform')
      .set('Authorization', `Bearer ${token}`)
      .send({ taskCode: 'daily_sign_in' });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);

    // Verify Task Status is now Completed (Claimable)
    const listRes = await request(server)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`);
    
    const signInTask = listRes.body.data.find((t: any) => t.code === 'daily_sign_in');
    expect(signInTask.status).toBe(1); // COMPLETED (Claimable)
    expect(signInTask.progress).toBe(1);
  });

  // 3. Claim Reward
  test('POST /api/v1/tasks/claim - Should claim reward for Sign In', async () => {
    const res = await request(server)
      .post('/api/v1/tasks/claim')
      .set('Authorization', `Bearer ${token}`)
      .send({ taskId: 'daily_sign_in' });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.data.rewardPoints).toBe(66);

    // Verify Task Status is now Claimed
    const listRes = await request(server)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`);
    
    const signInTask = listRes.body.data.find((t: any) => t.code === 'daily_sign_in');
    expect(signInTask.status).toBe(2); // CLAIMED
  });

  // 4. Verify User Points
  test('GET /api/v1/points/balance - Should reflect claimed points', async () => {
    const res = await request(server)
      .get('/api/v1/points/balance') // Assuming this endpoint exists from previous context
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.points).toBe(66);
  });

  // 5. Verify Points Record
  test('PointsRecord should exist', async () => {
    const record = await PointsRecord.findOne({ userId, pointType: 'TASK_REWARD' });
    expect(record).toBeDefined();
    expect(record?.points).toBe(66);
  });
  
  // 6. Test Newcomer Task Auto-Completion
  test('Newcomer Task should be claimable or completed', async () => {
      const listRes = await request(server)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`);
        
      const newcomerTask = listRes.body.data.find((t: any) => t.code === 'newcomer_report');
      // Should be at least COMPLETED (1) because user is registered
      expect(newcomerTask.status).toBeGreaterThanOrEqual(1);
  });

});
