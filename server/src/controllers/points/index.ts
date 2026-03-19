import PointsRecord from "@/models/pointsRecord";
import User from "@/models/user";
import { sendResponse } from "@/utils/const";
import { Context, DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE, parsePositiveInt } from "./const";

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

    sendResponse.success(ctx, { points: balance, membership });
  } catch (error) {
    sendResponse.error(ctx, "Internal server error");
  }
};

/**
 * 获取积分记录历史（分页）
 */
export const getPointsHistory = async (ctx: Context) => {
    const user = ctx.state.user as any;
    const { page = DEFAULT_PAGE_NUMBER, pageSize = DEFAULT_PAGE_SIZE } = ctx.query;

    try {
        const pageNum = parsePositiveInt(page, DEFAULT_PAGE_NUMBER);
        const limit = parsePositiveInt(pageSize, DEFAULT_PAGE_SIZE);
        const skip = (pageNum - 1) * limit;

        const total = await PointsRecord.countDocuments({ userId: user._id });
        const list = await PointsRecord.find({ userId: user._id })
            .sort({ createdTime: -1 })
            .skip(skip)
            .limit(limit);

        sendResponse.success(ctx, {
            list,
            total,
            page: pageNum,
            pageSize: limit
        });
    } catch (error) {
        sendResponse.error(ctx, "Internal server error");
    }
};
