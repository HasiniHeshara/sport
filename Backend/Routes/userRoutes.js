const router = require("express").Router();
const userController = require("../Controllers/userController");

router.post("/register", userController.register);
router.post("/login", userController.login);

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;