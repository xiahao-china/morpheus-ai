import Router from "koa-router";
import multer from "@koa/multer";
import { uploadFile, getFileUrl } from "@/controllers/file";
import { authMiddleware } from "@/middleware/auth";

const upload = multer();

export default (router: Router) => {
  router.post('/api/file/upload', authMiddleware, upload.single('file'), uploadFile);
  router.get('/api/file/:filename', getFileUrl);
}
