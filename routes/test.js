import User from "../models/user.js";

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
