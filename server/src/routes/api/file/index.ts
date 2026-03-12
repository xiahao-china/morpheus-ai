import Router from "koa-router";
import multer from "@koa/multer";
import { uploadFile, getFileUrl, uploadGeneralFile } from "@/controllers/file";
import { authMiddleware } from "@/middleware/auth";

const upload = multer();

export default (router: Router) => {
  router.post('/api/file/upload', authMiddleware, upload.single('file'), uploadFile);
  router.post('/api/v1/files/upload', authMiddleware, upload.single('imageFile'), uploadGeneralFile);
  router.get('/api/file/:filename', getFileUrl);
}
