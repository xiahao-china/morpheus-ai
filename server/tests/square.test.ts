import axios from 'axios';
import mongoose from 'mongoose';
import { Schema, Document } from 'mongoose';

const BASE_URL = 'http://localhost:3000';
const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/morpheus-ai';

// Define minimal schemas for test setup
interface IImageGenInfo extends Document {
    userId: string;
    imageUrl: string;
    imageGenTaskId: string;
    params: any;
    createdAt: Date;
}

const ImageGenInfoSchema = new Schema({
    userId: { type: String, required: true },
    imageUrl: { type: String, required: true },
    imageGenTaskId: { type: String },
    params: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
});

const ImageGenInfo = mongoose.model<IImageGenInfo>('ImageGenInfo', ImageGenInfoSchema);

interface ISquare extends Document {
    userId: string;
    imageId: string;
    title?: string;
    caption?: string;
    styleTags?: string[];
    sceneTags?: string[];
    publishedTime: Date;
    viewCount: number;
    likeCount: number;
    collectCount: number;
    imageUrl?: string;
}

const SquareSchema = new Schema({
    userId: { type: String, required: true },
    imageId: { type: String, required: true },
    title: { type: String },
    caption: { type: String },
    styleTags: [String],
    sceneTags: [String],
    publishedTime: { type: Date, default: Date.now },
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    collectCount: { type: Number, default: 0 },
    imageUrl: { type: String }
});

const Square = mongoose.model<ISquare>('Square', SquareSchema);

describe('Square API Tests', () => {
    const testPhone = '13900000001';
    const verifyCode = '123456'; // Assuming this works if we don't check real code, or we rely on mock
    // Note: The server likely checks code. In dev mode, maybe any code works?
    // Let's check login.test.ts, it uses '783284'.
    // If we can't get a valid code, we might fail login.
    // However, api_flow.test.ts sends a code request first.
    // In dev mode (which tests run against), maybe we can intercept or just use a known code?
    // Let's assume sending code first is required.

    let authToken: string;
    let userId: string;
    let imageId: string;
    let squareId: string;

    beforeAll(async () => {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URL);
    });

    afterAll(async () => {
        // Cleanup
        if (imageId) {
            await ImageGenInfo.deleteOne({ _id: imageId });
        }
        if (squareId) {
            await Square.deleteOne({ _id: squareId });
        }
        await mongoose.disconnect();
    });

    it('1. Login to get token', async () => {
        // 1. Send verify code
        try {
            await axios.post(`${BASE_URL}/api/user/send-code`, {
                type: 'phone',
                target: testPhone
            });
        } catch (e) {
            // Ignore error if it fails due to frequency limit, but might fail login if no code sent
            console.log('Send code result:', e.message);
        }

        // 2. Login
        const loginRes = await axios.post(`${BASE_URL}/api/user/login`, {
            type: 'phone',
            target: testPhone,
            code: '666666'
        });

        console.log('Login Headers:', JSON.stringify(loginRes.headers, null, 2));
        
        if (loginRes.data.data.token) {
            authToken = loginRes.data.data.token;
        } else {
             const cookies = loginRes.headers['set-cookie'];
             if (cookies) {
                 const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
                 if (tokenCookie) {
                     authToken = tokenCookie.split(';')[0].split('=')[1];
                 }
             }
        }
        
        userId = loginRes.data.data.user._id;
        console.log('Logged in as:', userId);
        console.log('Token:', authToken);
    });

    it('2. Setup dummy image for publishing', async () => {
        const image = new ImageGenInfo({
            userId: userId,
            imageUrl: 'http://example.com/test.jpg',
            imageGenTaskId: 'test_task_' + Date.now(),
            params: { prompt: 'test' }
        });
        await image.save();
        imageId = image._id.toString();
        console.log('Created dummy image:', imageId);
    });

    it('3. Publish Square', async () => {
        try {
            const res = await axios.post(`${BASE_URL}/api/square/publish`, {
                imageId: imageId,
                title: 'Test Square',
                caption: 'This is a test square',
                styleTags: ['modern'],
                sceneTags: ['indoor']
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            expect(res.status).toBe(200);
            expect(res.data.code).toBe(200);
            expect(res.data.data).toHaveProperty('_id');
            squareId = res.data.data._id;
            console.log('Published square:', squareId);
        } catch (error: any) {
            console.error('Publish Square Error:', error.response?.data || error.message);
            throw error;
        }
    });

    it('4. Get Square List', async () => {
        const res = await axios.get(`${BASE_URL}/api/square/list`);
        expect(res.status).toBe(200);
        expect(res.data.code).toBe(200);
        expect(res.data.data.list).toBeInstanceOf(Array);
        expect(res.data.data.list.length).toBeGreaterThan(0);
        
        // Check if our published square is in the list
        const found = res.data.data.list.find((item: any) => item._id === squareId);
        expect(found).toBeTruthy();
        expect(found.title).toBe('Test Square');
    });

    it('5. Like Square', async () => {
        const res = await axios.post(`${BASE_URL}/api/square/${squareId}/like`, {
            action: 'like'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        expect(res.status).toBe(200);
        expect(res.data.code).toBe(200);
        expect(res.data.data.likeCount).toBe(1);
    });

    it('6. Unlike Square', async () => {
        const res = await axios.post(`${BASE_URL}/api/square/${squareId}/like`, {
            action: 'unlike'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        expect(res.status).toBe(200);
        expect(res.data.code).toBe(200);
        expect(res.data.data.likeCount).toBe(0);
    });

    it('7. Get Generation History', async () => {
        const res = await axios.get(`${BASE_URL}/api/image/history`, {
            headers: { Authorization: `Bearer ${authToken}` },
            params: { page: 1, pageSize: 10 }
        });

        expect(res.status).toBe(200);
        expect(res.data.code).toBe(200);
        expect(res.data.data.list).toBeInstanceOf(Array);
        // Should find at least the dummy image we created
        const found = res.data.data.list.find((item: any) => item._id === imageId);
        expect(found).toBeTruthy();
    });

    it('8. Delete Square', async () => {
        const res = await axios.delete(`${BASE_URL}/api/square/${squareId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        expect(res.status).toBe(200);
        expect(res.data.code).toBe(200);
        expect(res.data.msg).toBe('Deleted successfully');

        // Verify it's gone
        const listRes = await axios.get(`${BASE_URL}/api/square/list`);
        const found = listRes.data.data.list.find((item: any) => item._id === squareId);
        expect(found).toBeFalsy();
    });
});
