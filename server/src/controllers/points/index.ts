import { Context } from "koa";
import PointsRecord from "@/models/pointsRecord";

// 1. Get User Points Balance
export const getPointsBalance = async (ctx: Context) => {
  const user = ctx.state.user as any;
  try {
    const record = await PointsRecord.findOne({ userId: user._id });
    const balance = record ? record.points : 0;
    ctx.body = { code: 200, data: { points: balance } };
  } catch (error) {
    ctx.body = { code: 500, msg: "Internal server error", error };
  }
};

// 2. Get Points History (Mock for now, needs PointsDetail model)
export const getPointsHistory = async (ctx: Context) => {
    // In real scenario: query PointsDetail collection
    ctx.body = { 
        code: 200, 
        data: [
            { id: 1, type: 'SIGN_IN', amount: 10, time: new Date() },
            { id: 2, type: 'GENERATION', amount: -5, time: new Date() }
        ]
    };
};
