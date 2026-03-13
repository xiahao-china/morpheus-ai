import Router from "koa-router";
import multer from "@koa/multer";
// 导入文件控制器函数
import { uploadFile, getFileUrl, uploadGeneralFile } from "@/controllers/file";
// 导入认证中间件
import { authMiddleware } from "@/middleware/auth";

// 配置 multer 中间件用于处理文件上传
const upload = multer();

/**
 * 文件上传相关路由
 * 负责用户文件上传与获取文件访问URL
 */
export default (router: Router) => {
  // 上传图片文件（需要登录，单文件，字段名为 'file'）
  router.post('/api/file/upload', authMiddleware, upload.single('file'), uploadFile);
  // 通用文件上传（需要登录，单文件，字段名为 'imageFile'）
  router.post('/api/v1/files/upload', authMiddleware, upload.single('imageFile'), uploadGeneralFile);
  // 获取文件访问URL（公开接口）
  router.get('/api/file/:filename', getFileUrl);
}