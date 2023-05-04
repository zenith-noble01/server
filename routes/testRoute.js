import { Router } from "express";
import { getUser } from "./test.js";
import { protect } from "../middlewares/authentication.js";

const router = Router();

router.get("/:userId", protect, getUser);

export default router;
