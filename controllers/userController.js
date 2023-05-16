import User from "../models/user.js";
import { hash, compare } from "bcrypt";
import jwt from "jsonwebtoken";
import { cloudinary } from "../config/cloudinary.js";
import { checkUser, findUserById } from "../helper/user.js";

const createUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    await checkUser(username, email);

    if (!password) {
      throw new Error("Password required");
    }

    const hashedPassword = await hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    res
      .status(200)
      .json({ message: "User created successfully", user: savedUser });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }

    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      throw new Error("Incorrect password");
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(200).json({
      token,
      id: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    if (userId.toString() !== id) {
      throw new Error("Can update only your user");
    }

    let profileUrl = "";

    if (req.file) {
      // Check if the profile picture was provided
      const image = await cloudinary.uploader.upload(req.file.path); // Upload the image to Cloudinary
      profileUrl = image.secure_url; // Get the secure URL of the uploaded image
    }

    const { profilePic, ...others } = req.body;

    const updatedFields = { ...others }; // Create a copy of others fields

    if (profileUrl) {
      // Add the profile URL to the updated fields
      updatedFields.profile = profileUrl;
    }

    // Update the user in the database
    const updatedUser = await User.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { userId } = req.user;
    const { id } = req.params;

    if (userId.toString() !== id) {
      throw new Error("Can update only your user");
    }

    const user = await User.findById(userId);

    const isMatch = await compare(currentPassword, user.password);

    if (!isMatch) {
      throw new Error("Incorrect password");
    }

    const hashedPassword = await hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user details by user ID
const getUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Remove sensitive fields before sending user object
    const { password, friendRequests, ...userData } = user.toObject();

    res.status(200).json({ user: userData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const { id } = req.params //Id of the recipient user
    const { userId } = req.user//id of the sender user

    //check if the send and recipient are the same user
    if (userId.toString() === id) {
      throw new Error("You cant send a friend request to yourself")
    }

    //checking if the recipient user exist
    const recipient = await User.findById(id)

    if (!recipient) {
      throw new Error("the recipient user not found")
    }

    //checking if the sender use exists
    const sender = await User.findById(userId)

    if (!sender) {
      throw new Error("the sender user not found")
    }

    //check if the sender has already sent a frient request to the recipient
    const existingFriendRequest = sender.friendRequests.find((friendRequest) => friendRequest.friendUser === id)

    if (existingFriendRequest) {
      throw new Error("You have already sent a friend request to this user")
    }

    //check if the sender is already a friend with the user 
    const existingFriend = sender.friends.find((friend) => friend.friendUser === id)

    if (existingFriend) {
      throw new Error("You are already friend to this user")
    }

    //add the friend request to the recipient friendrequests
    recipient.friendRequests.push({ friendUser: userId })

    await recipient.save()

    res.status(200).send({ message: "Friend request succcessfully sent" })
  } catch (error) {
    res.status(500).send(error.message)
  }
}
//accepting a user friend request
const acceptFriendRequest = async (req, res) => {
  try {
    const { id } = req.params //Id of of the user who sent the friend request to be accepted
    const { userId } = req.user//id of the current user

    const currentUser = await User.findById(userId)
    const sender = await User.findById(id)

    if (!currentUser && !sender) {
      throw new Error("User not found")
    }

    console.log(sender._id.toString());

    const friendRequest = currentUser.friendRequests.find((friendRequest) => friendRequest.friendUser === sender._id.toString())

    if (!friendRequest) {
      throw new Error("There is no friend request from this users")
    }

    const existingFriend = currentUser.friends.find((friend) => friend.friendUser === sender._id.toString())

    if (existingFriend) {
      throw new Error("You're arlready friends with this user")
    }
    //Accept the friend request by adding both users to each other's friends array
    currentUser.friends.push({ friendUser: id })
    sender.friends.push({ friendUser: userId })


    //Update the friend request to approved
    friendRequest.isApproved = true

    //save the changes to sender and current user documents
    await Promise.all([sender.save(), currentUser.save()])

    return res
      .status(200)
      .send({ message: "Friend request accepted successfully!" });
  } catch (error) {
    res.status(500).send(error.message)
  }
}

//
const getAllFriendRequests = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId).populate({
      path: "friendRequests.friendUser",
      select: "username profile",
    });
    const friendRequests = user.friendRequests || []; // Check if friendRequests is not null, otherwise initialize it as an empty array
    const pendingRequests = friendRequests.filter(
      (request) => !request.isApproved
    );
    res.status(200).json({ friendRequests: pendingRequests });
  } catch (error) {
    res.status(500).json({ message: error.message });
    // console.log("me");
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.user;

    const { id } = req.params;

    const user = await findUserById(userId, id);

    await User.findByIdAndDelete(user?._id);

    return res.status(200).send({ message: " Account deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  createUser, loginUser, updateUser, updatePassword, getUser, deleteUser, sendFriendRequest, acceptFriendRequest, getAllFriendRequests,
};
