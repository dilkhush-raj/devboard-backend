import {Router} from "express";
import {getLeaderboard} from "../controllers/leaderboard.controller.ts";

const router = Router();

router.get("/", getLeaderboard);

export default router;
