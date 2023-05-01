import Post from "../models/post.js";
import User from "../models/user.js";
import { cloudinary } from "../config/cloudinary.js";
import { protect } from "../middlewares/authentication.js";
import { checkUser, findUserById, ifUserExist } from "../helper/user.js";
import { checkPost } from "../helper/post.js";

//creating a new post
const createPost = async (req, res) => {
  try {
    const { image, content, id } = req.body;

    const { userId } = req.user;
    const user = await findUserById(userId, id);

    if (!image || !content || !userId) {
      throw new Error("This fields are require");
    }

    const uploadedImage = await cloudinary.uploader.upload(image);
    const imageUrl = uploadedImage.secure_url;

    const post = await Post.create({
      image: imageUrl,
      userId: user._id,
      content,
    });

    res.status(200).send({
      message: "Post successfully created",
      post,
    });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

//read post
const getPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      throw new Error("Post not found.");
    }

    res.status(200).send(post);
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

//update a new post
const updatePost = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await findUserById(userId, req.body.userId);

    const { postId } = req.params;

    const post = await checkPost(postId);

    if (user._id !== post.userId) {
      throw new Error("You can only update your post");
    }

    let imageUrl = "";

    if (req.file) {
      const uploadedImage = cloudinary.uploader.upload(req.file.path);
      imageUrl = (await uploadedImage).secure_url;
    }

    const { image, ...others } = req.body;

    const newPost = { ...others };

    if (image) {
      newPost.image = imageUrl;
    }

    const updatedPost = await Post.findByIdAndUpdate(post._id, newPost, {
      new: true,
    });

    res
      .status(200)
      .send({ message: "Post updated Succefullt", post: updatedPost });

    //   const
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

//comment on a post
const commentPost = async (req, res) => {
  try {
    const { userId } = req.user;
    const { postId } = req.params;

    const { userId: id, content } = req.body;

    // const user = await findUserById(userId, );

    const post = await checkPost(postId);
    //   new

    const newComment = {
      userId,
      content,
      date: Date.now(),
    };

    post.comments.push(newComment);

    post.save();

    return res
      .status(201)
      .send({ message: "Comment added successfully", post });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

//like post
const likePost = async (req, res) => {
  try {
    const { userId } = req.user;
    const { postId } = req.params;

    const post = await checkPost(postId);

    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
      await post.save();
    }

    return res.status(200).send({ message: "Post liked successful", post });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

//dislike post
const disLikePost = async (req, res) => {
  try {
    const { userId } = req.user;
    const { postId } = req.params;

    const post = await checkPost(postId);

    if (post.likes.includes(userId)) {
      post.likes.pull(userId);

      post.save();
    }

    return res.status(200).send({ message: "Post disliked successful", post });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

//creating a new post
const deletePost = async (req, res) => {
  try {
    const { userId } = req.user;
    const { postId } = req.params;

    const post = await checkPost(postId);

    const user = await ifUserExist(userId);

    if (post._id !== user._id) {
      throw new Error("You can only delete you post");
    }

    await Post.findByIdAndDelete(post._id);

    return res.status(201).send({ postId: post._id });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

//exportting
export {
  createPost,
  getPost,
  updatePost,
  commentPost,
  likePost,
  disLikePost,
  deletePost,
};
