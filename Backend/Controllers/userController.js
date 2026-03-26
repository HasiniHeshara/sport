const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Models/userModel");
const Tournament = require("../Models/tournamentModel");
const TeamRegistration = require("../Models/teamRegistrationModel");

// Register user
const registerUser = async (req, res) => {
  const { itNumber, name, year, faculty, contactNumber, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const itExists = await User.findOne({ itNumber });
    if (itExists) {
      return res.status(400).json({ message: "IT number already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      itNumber,
      name,
      year,
      faculty,
      contactNumber,
      email,
      password: hashedPassword,
      role,
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        itNumber: user.itNumber,
        name: user.name,
        year: user.year,
        faculty: user.faculty,
        contactNumber: user.contactNumber,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Logged in successfully",
      token,
      user: {
        id: user._id,
        itNumber: user.itNumber,
        name: user.name,
        year: user.year,
        faculty: user.faculty,
        contactNumber: user.contactNumber,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user
const updateUser = async (req, res) => {
  const { itNumber, name, year, faculty, contactNumber, email, role, password } = req.body;

  try {
    let updatedData = {
      itNumber,
      name,
      year,
      faculty,
      contactNumber,
      email,
      role,
    };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatedData.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get logged in user's profile + activities
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let activities = {};

    if (user.role === "organizer") {
      const tournaments = await Tournament.find({ organizerId: user._id }).sort({ createdAt: -1 });

      activities = {
        createdTournaments: tournaments,
        draftCount: tournaments.filter((t) => t.status === "Draft").length,
        publishedCount: tournaments.filter((t) => t.status === "Published").length,
        closedCount: tournaments.filter((t) => t.status === "Closed").length,
      };
    }

    if (user.role === "participant") {
      const registrations = await TeamRegistration.find({ leaderId: user._id })
        .populate("tournamentId", "title sportType venue startDate endDate status registrationDeadline")
        .sort({ createdAt: -1 });

      activities = {
        registrations,
        pendingCount: registrations.filter((r) => r.status === "Pending").length,
        approvedCount: registrations.filter((r) => r.status === "Approved").length,
        rejectedCount: registrations.filter((r) => r.status === "Rejected").length,
      };
    }

    res.json({
      user,
      activities,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update logged in user's profile
const updateUserProfile = async (req, res) => {
  const { itNumber, name, year, faculty, contactNumber, email, password } = req.body;

  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // check email uniqueness
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // check IT number uniqueness
    if (itNumber && itNumber !== user.itNumber) {
      const itExists = await User.findOne({ itNumber });
      if (itExists) {
        return res.status(400).json({ message: "IT number already in use" });
      }
    }

    user.itNumber = itNumber || user.itNumber;
    user.name = name || user.name;
    user.year = year || user.year;
    user.faculty = faculty || user.faculty;
    user.contactNumber = contactNumber || user.contactNumber;
    user.email = email || user.email;

    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        itNumber: updatedUser.itNumber,
        name: updatedUser.name,
        year: updatedUser.year,
        faculty: updatedUser.faculty,
        contactNumber: updatedUser.contactNumber,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete logged in user's account
const deleteUserProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
};