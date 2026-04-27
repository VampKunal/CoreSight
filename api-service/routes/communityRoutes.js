const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const commentController = require("../controllers/commentController");
const authMiddleware = require("../middleware/authMiddleware");

// All community routes require authentication
router.use(authMiddleware);

// --- Post Routes ---
router.get("/posts", postController.getPosts);
router.get("/posts/:id", postController.getPost);
router.post("/posts", postController.createPost);
router.post("/posts/:id/vote", postController.votePost);
router.delete("/posts/:id", postController.deletePost);

// --- Comment Routes ---
router.post("/posts/:postId/comments", commentController.addComment);
router.delete("/comments/:id", commentController.deleteComment);

module.exports = router;
