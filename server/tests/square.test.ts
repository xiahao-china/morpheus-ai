import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

describe('Square API Tests', () => {
    const testPhone = '13900000001';
    let authToken: string;
    let imageId: string;
    let squareId: string;

    it('1. Login to get token', async () => {
        await axios.post(`${BASE_URL}/api/user/send-code`, {
            type: 'phone',
            target: testPhone
        }).catch(() => undefined);

        const loginRes = await axios.post(`${BASE_URL}/api/user/login`, {
            type: 'phone',
            target: testPhone,
            code: '666666'
        });

        const cookies = loginRes.headers['set-cookie'] || [];
        const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
        expect(tokenCookie).toBeDefined();
        authToken = tokenCookie.split(';')[0].split('=')[1];
    });

    it('2. Pick one image from history', async () => {
        const res = await axios.get(`${BASE_URL}/api/image/history`, {
            headers: { Authorization: `Bearer ${authToken}` },
            params: { page: 1, pageSize: 20 }
        });

        expect(res.status).toBe(200);
        expect(res.data.code).toBe(200);
        expect(Array.isArray(res.data.data.list)).toBe(true);
        imageId = res.data.data.list?.[0]?._id ? String(res.data.data.list[0]._id) : '';
    });

    it('3. Publish Square', async () => {
        if (!imageId) {
            return;
        }

        const res = await axios.post(`${BASE_URL}/api/square/publish`, {
            imageId,
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
    });

    it('4. Get Square List', async () => {
        const res = await axios.get(`${BASE_URL}/api/square/list`);
        expect(res.status).toBe(200);
        expect(res.data.code).toBe(200);
        expect(Array.isArray(res.data.data.list)).toBe(true);

        if (!squareId) {
            return;
        }

        const found = res.data.data.list.find((item: any) => String(item._id) === squareId);
        expect(found).toBeTruthy();
        expect(found.title).toBe('Test Square');
    });

    it('5. Like Square', async () => {
        if (!squareId) {
            return;
        }

        const res = await axios.post(`${BASE_URL}/api/square/${squareId}/like`, {
            action: 'like'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        expect(res.status).toBe(200);
        expect(res.data.code).toBe(200);
        expect(typeof res.data.data.likeCount).toBe('number');
    });

    it('6. Unlike Square', async () => {
        if (!squareId) {
            return;
        }

        const res = await axios.post(`${BASE_URL}/api/square/${squareId}/like`, {
            action: 'unlike'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        expect(res.status).toBe(200);
        expect(res.data.code).toBe(200);
        expect(typeof res.data.data.likeCount).toBe('number');
    });

    it('7. Get Generation History', async () => {
        const res = await axios.get(`${BASE_URL}/api/image/history`, {
            headers: { Authorization: `Bearer ${authToken}` },
            params: { page: 1, pageSize: 10 }
        });

        expect(res.status).toBe(200);
        expect(res.data.code).toBe(200);
        expect(Array.isArray(res.data.data.list)).toBe(true);
    });

    it('8. Delete Square', async () => {
        if (!squareId) {
            return;
        }

        const res = await axios.delete(`${BASE_URL}/api/square/${squareId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        expect(res.status).toBe(200);
        expect(res.data.code).toBe(200);
        expect(res.data.data.msg).toBe('Deleted successfully');
    });
});
