const Post = require("../models/Post");
const Comment = require("../models/Comment");

const VALID_CATEGORIES = ["exercise", "nutrition", "general", "motivation"];

const formatPost = (post, currentUserId) => {
  const normalized = post.toJSON ? post.toJSON() : post;
  const upvoteIds = normalized.upvotes || [];
  const downvoteIds = normalized.downvotes || [];
  const viewerId = currentUserId?.toString();
  const authorId =
    normalized.author && typeof normalized.author === "object"
      ? normalized.author._id?.toString()
      : normalized.author?.toString();

  return {
    ...normalized,
    commentCount: normalized.commentCount || 0,
    score: upvoteIds.length - downvoteIds.length,
    upvoteCount: upvoteIds.length,
    downvoteCount: downvoteIds.length,
    isOwner: Boolean(viewerId && authorId === viewerId),
    userVote:
      viewerId && upvoteIds.some((id) => id.toString() === viewerId)
        ? "upvote"
        : viewerId && downvoteIds.some((id) => id.toString() === viewerId)
          ? "downvote"
          : null,
  };
};

// Get all posts
exports.getPosts = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = {};

    if (category && VALID_CATEGORIES.includes(category)) {
      filter.category = category;
    }

    const posts = await Post.find(filter)
      .populate("author", "name")
      .populate("commentCount")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json(posts.map((post) => formatPost(post, req.user.userID)));
  } catch (error) {
    next(error);
  }
};

// Get single post
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name")
      .populate("commentCount");

    if (!post) {
      const err = new Error("Post not found");
      err.status = 404;
      return next(err);
    }

    const comments = await Comment.find({ post: req.params.id })
      .populate("author", "name")
      .sort({ createdAt: 1 });

    res.status(200).json({
      post: formatPost(post, req.user.userID),
      comments: comments.map((comment) => {
        const normalized = comment.toJSON ? comment.toJSON() : comment;
        const authorId =
          normalized.author && typeof normalized.author === "object"
            ? normalized.author._id?.toString()
            : normalized.author?.toString();

        return {
          ...normalized,
          isOwner: Boolean(authorId && authorId === req.user.userID),
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};

// Create post
exports.createPost = async (req, res, next) => {
  try {
    const { title, content, category } = req.body;
    const normalizedTitle = title?.trim();
    const normalizedContent = content?.trim();

    if (!normalizedTitle || !normalizedContent) {
      const err = new Error("Title and content are required");
      err.status = 400;
      return next(err);
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
      const err = new Error("Invalid category");
      err.status = 400;
      return next(err);
    }

    const newPost = new Post({
      title: normalizedTitle,
      content: normalizedContent,
      category,
      author: req.user.userID,
    });
    await newPost.save();
    await newPost.populate("author", "name");
    res.status(201).json(formatPost(newPost, req.user.userID));
  } catch (error) {
    next(error);
  }
};

// Vote on post
exports.votePost = async (req, res, next) => {
  try {
    const { type } = req.body; // 'upvote' or 'downvote'
    const post = await Post.findById(req.params.id);

    if (!post) {
      const err = new Error("Post not found");
      err.status = 404;
      return next(err);
    }

    const userID = req.user.userID;
    const currentlyUpvoted = post.upvotes.some(
      (id) => id.toString() === userID,
    );
    const currentlyDownvoted = post.downvotes.some(
      (id) => id.toString() === userID,
    );

    // Remove from both first
    post.upvotes = post.upvotes.filter((id) => id.toString() !== userID);
    post.downvotes = post.downvotes.filter((id) => id.toString() !== userID);

    if (type === "upvote" && !currentlyUpvoted) {
      post.upvotes.push(userID);
    } else if (type === "downvote" && !currentlyDownvoted) {
      post.downvotes.push(userID);
    } else if (type !== "clear") {
      const err = new Error(
        "Vote type must be 'upvote', 'downvote', or 'clear'",
      );
      err.status = 400;
      return next(err);
    }

    await post.save();
    await post.populate("author", "name");
    res.status(200).json(formatPost(post, req.user.userID));
  } catch (error) {
    next(error);
  }
};

// Delete post
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      const err = new Error("Post not found");
      err.status = 404;
      return next(err);
    }

    if (post.author.toString() !== req.user.userID) {
      const err = new Error("Unauthorized");
      err.status = 403;
      return next(err);
    }

    await Post.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ post: req.params.id });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    next(error);
  }
};
