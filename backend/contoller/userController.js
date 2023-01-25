const asyncHandler = require("express-async-handler");
const generateToken = require("../config/generateToken");
const userModel = require("../models/userModel");

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please enter all the fields!");
  }

  const userExists = await userModel.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists!!");
  }

  const user = await userModel.create({
    name,
    email,
    password,
    pic,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(500);
    throw new Error("Failed to create the user");
  }
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please enter all the fields!");
  }

  const user = await userModel.findOne({ email });

  if (user && (await user.verifyPassword(password))) {
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid username or password!!");
  }
});

const userController = { registerUser, authUser };
module.exports = userController;