import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sourcesRouter from "./sources";
import collectionsRouter from "./collections";
import repositoriesRouter from "./repositories";
import projectsRouter from "./projects";
import claimsRouter from "./claims";
import forumRouter from "./forum";
import membershipRouter from "./membership";
import conciergeRouter from "./concierge";
import translationsRouter from "./translations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sourcesRouter);
router.use(collectionsRouter);
router.use(repositoriesRouter);
router.use(projectsRouter);
router.use(claimsRouter);
router.use(forumRouter);
router.use(membershipRouter);
router.use(conciergeRouter);
router.use(translationsRouter);

export default router;
