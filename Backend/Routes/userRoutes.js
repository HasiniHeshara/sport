const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
} = require("../Controllers/userController");

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.delete("/profile", protect, deleteUserProfile);

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;