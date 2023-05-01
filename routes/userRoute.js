import express from "express";
import {
  acceptFriendRequest,
  createUser,
  deleteUser,
  getAllFriendRequests,
  // getAllUsers,
  getUser,
  loginUser,
  sendFriendRequest,
  updatePassword,
  updateUser,
} from "../controllers/userController.js";
import { protect } from "../middlewares/authentication.js";

const router = express.Router();

//register route
router.post("/register", createUser);

//login route
router.post("/login", loginUser);

//updating the user profile or user Data route
router.put("/:id", protect, updateUser);

//delete user route
router.delete("/:id", protect, deleteUser);

//getUser data route
router.get("/:userId", getUser);

//update user password route
router.put("/updatePass/:id", protect, updatePassword);

//get all users route
// router.get("/all", getAllUsers);

//send a user friend request route
router.post("/:id/friend-request", protect, sendFriendRequest);

//acepts user friend request route
router.post("/:id/friend-request/accept", protect, acceptFriendRequest);

//all user friend request route
router.get("/friend-request", getAllFriendRequests);

router.get("/me", async (req, res) => {
  try {
    res.send("this is the route");
  } catch (error) {}
});

export default router;
