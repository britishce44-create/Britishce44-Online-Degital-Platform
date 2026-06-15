import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import aiRouter from "./ai";
import assessmentRouter from "./assessment";
import evalRouter from "./eval";
import reportsRouter from "./reports";
import opsRouter from "./ops";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(aiRouter);
router.use(assessmentRouter);
router.use(evalRouter);
router.use(reportsRouter);
router.use(opsRouter);

export default router;
