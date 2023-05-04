import User from "../models/user.js";
import bcrypt from "bcrypt";

export const getUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      throw new Error("user not found");
    }

    return res.status(200).send(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
