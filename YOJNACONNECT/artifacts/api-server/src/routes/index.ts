import { Router, type IRouter } from "express";
import healthRouter from "./health";
import schemesRouter from "./schemes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(schemesRouter);

export default router;
