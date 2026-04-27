const Comment = require("../models/Comment");
const Post = require("../models/Post");

// Add comment to a post
exports.addComment = async (req, res, next) => {
  try {
    const content = req.body.content?.trim();

    if (!content) {
      const err = new Error("Comment content is required");
      err.status = 400;
      return next(err);
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      const err = new Error("Post not found");
      err.status = 404;
      return next(err);
    }

    const comment = new Comment({
      content,
      author: req.user.userID,
      post: req.params.postId,
    });

    await comment.save();
    await comment.populate("author", "name");

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

// Delete a comment
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      const err = new Error("Comment not found");
      err.status = 404;
      return next(err);
    }

    if (comment.author.toString() !== req.user.userID) {
      const err = new Error("Unauthorized");
      err.status = 403;
      return next(err);
    }

    await Comment.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ message: "Comment deleted successfully", id: req.params.id });
  } catch (error) {
    next(error);
  }
};
