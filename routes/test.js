import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cloudinary } from "../config/cloudinary.js"



const createUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      throw new Error("This Fields are required");
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      throw new Error("User already exists with this credentials");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(200).send({ message: "User created succesfully." });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new Error("This Fields are required");
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("User not found");
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new Error("Incorrect password");
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(200).send({ token: token, id: user._id });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const { userId: id } = req.params;

    if (userId !== id) {
      throw new Error("You can update only your account.")
    }

    let profileUrl = ""

    if (req.file) {
      const image = await cloudinary.uploader.upload(req.file.path)
      profileUrl = image.secure_url
    }

    const { profilePicture, ...others } = req.body

    const updatedFields = { ...others }

    if (profileUrl) {
      updatedFields.profileImageUrl = profileUrl
    }

    const updatedUser = await User.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });

    res.status(200).send({ user: updatedUser })

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};


const updateUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const { userId } = req.user
    const { userId: id } = req.params

    if (userId !== id) {
      throw new Error("You can update only your account.")
    }

    const user = await User.findById(userId)

    if (!user) {
      throw new Error("User not found.")
    }

    const isValid = await bcrypt.compare(currentPassword, user.password)

    if (!isValid) {
      throw new Error("Passwords don't match")
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    user.password = hashedPassword

    await user.save()

    res.status(200).send({ message: "Password updated succefully" })

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
}


const getUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      throw new Error("user not found");
    }

    const { password, friendRequests, ...others } = user.toObject()

    return res.status(200).send({ user: others });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const deleteUser = async (req, res) => {
  try {
    const { userId } = req.user
    const { userId: id } = req.params


    if (userId !== id) {
      throw new Error("You can delete only your account.")
    }

    const user = await User.findById(userId)


    if (!user) {
      throw new Error("User not found.")
    }

    if (userId !== userId) {
      throw new Error("You can delete only your account.")
    }

    await User.findByIdAndDelete(userId)

    res.status(200).send({ message: "Account deleted succesfully." })

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


const sendFriendRequest = async (req, res) => {
  try {

    const { userId: senderId } = req.user
    const { userId: recipientId } = req.params

    if (senderId === recipientId) {
      throw new Error("You can't send a friend request to yourself.")
    }

    const sender = await User.findById(senderId)
    const recipient = await User.findById(recipientId)

    if (!sender) {
      throw new Error("User not found.")
    }

    if (!recipient) {
      throw new Error("User not found.")
    }

    const existingFriend = sender.friends.find(friend => friend.friendUser === senderId)

    if (existingFriend) {
      throw new Error("You are already friends with this user")
    }

    const existingFriendRequest = sender.friendRequests.find(request => request.friendUser === senderId)

    if (existingFriendRequest) {
      throw new Error("You have already sent a friend request with this user")
    }




  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export { getUser }