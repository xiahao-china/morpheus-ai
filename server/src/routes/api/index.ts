import Router from "koa-router";
import userRoutes from "./user";
import squareRoutes from "./square";
import taskRoutes from "./task";
import fileRoutes from "./file";
import imageRoutes from "./image";

export default (router: Router) => {
  userRoutes(router);
  squareRoutes(router);
  taskRoutes(router);
  fileRoutes(router);
  imageRoutes(router);
}
