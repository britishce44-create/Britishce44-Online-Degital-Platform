import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import aiRouter from "./ai";
import assessmentRouter from "./assessment";
import evalRouter from "./eval";
import reportsRouter from "./reports";
import opsRouter from "./ops";
import attendanceRouter from "./attendance";
import resultsRouter from "./results";
import usersRouter from "./users";
import contactsRouter from "./contacts";
import classroomAssessmentRouter from "./classroom-assessment";
import quizzesRouter from "./quizzes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(aiRouter);
router.use(assessmentRouter);
router.use(evalRouter);
router.use(reportsRouter);
router.use(opsRouter);
router.use(attendanceRouter);
router.use(resultsRouter);
router.use(usersRouter);
router.use(contactsRouter);
router.use(classroomAssessmentRouter);
router.use(quizzesRouter);

export default router;
