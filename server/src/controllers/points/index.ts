import { Context } from "koa";
import PointsRecord from "@/models/pointsRecord";
import User from "@/models/user";

/**
 * 获取用户积分余额和会员信息
 */
export const getPointsBalance = async (ctx: Context) => {
  const user = ctx.state.user as any;
  try {
    const currentUser = await User.findById(user._id);
    const balance = currentUser ? currentUser.points : 0;

    const membership = {
        level: currentUser?.membershipLevel,
        expiry: currentUser?.membershipExpiry
    };

    ctx.body = { code: 200, data: { points: balance, membership } };
  } catch (error) {
    ctx.body = { code: 500, msg: "Internal server error", error };
  }
};

/**
 * 获取积分记录历史（分页）
 */
export const getPointsHistory = async (ctx: Context) => {
    const user = ctx.state.user as any;
    const { page = 1, pageSize = 20 } = ctx.query;

    try {
        const pageNum = Math.max(1, parseInt(page as string));
        const limit = Math.max(1, parseInt(pageSize as string));
        const skip = (pageNum - 1) * limit;

        const total = await PointsRecord.countDocuments({ userId: user._id });
        const list = await PointsRecord.find({ userId: user._id })
            .sort({ createdTime: -1 })
            .skip(skip)
            .limit(limit);

        ctx.body = {
            code: 200,
            data: {
                list,
                total,
                page: pageNum,
                pageSize: limit
            }
        };
    } catch (error) {
        ctx.body = { code: 500, msg: "Internal server error", error };
    }
};