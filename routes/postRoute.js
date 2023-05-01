import { Router } from "express";

import { protect } from "../middlewares/authentication.js";
import {
  createPost,
  getPost,
  updatePost,
  commentPost,
  likePost,
  disLikePost,
  deletePost,
} from "../controllers/postController.js";

const router = Router();

//create post
router.post("/create", protect, createPost);

//getPost route
router.get("/:postId", getPost);

//update post
router.put("/:postId", protect, updatePost);

//delete post
router.delete("/:postId", protect, deletePost);

// Add a comment to a post by ID
router.post("/posts/:postId/comments", commentPost);

// Like a post by ID
router.post("/posts/:postId/likes", likePost);

// Dislike a post by ID
router.post("/posts/:postId/dislikes", disLikePost);

export default router;
