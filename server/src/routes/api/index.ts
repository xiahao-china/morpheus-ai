import Router from "koa-router";
import userRoutes from "./user/index";
import squareRoutes from "./square/index";
import taskRoutes from "./task/index";
import fileRoutes from "./file/index";
import imageRoutes from "./image/index";
import generationRoutes from "./generation/index";
import membershipRoutes from "./membership/index";
import pointsRoutes from "./points/index";
import taskRewardRoutes from "./task-reward/index";

export default (router: Router) => {
  userRoutes(router);
  squareRoutes(router);
  taskRoutes(router);
  fileRoutes(router);
  imageRoutes(router);
  generationRoutes(router);
  membershipRoutes(router);
  pointsRoutes(router);
  taskRewardRoutes(router);
}
