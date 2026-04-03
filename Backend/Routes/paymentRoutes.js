const express = require("express");
const router = express.Router();

const {
  uploadSlipPayment,
  createPayHerePayment,
  getMyPayments,
  getAllPayments,
  verifyPayment,
  rejectPayment,
} = require("../Controllers/paymentController");

const { uploadPaymentSlip } = require("../middleware/uploadMiddleware");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.post(
  "/upload-slip",
  protect,
  uploadPaymentSlip.single("slip"),
  uploadSlipPayment
);

router.post("/payhere", protect, createPayHerePayment);
router.get("/my", protect, getMyPayments);
router.get("/", protect, authorizeRoles("admin"), getAllPayments);
router.patch("/:id/verify", protect, authorizeRoles("admin"), verifyPayment);
router.patch("/:id/reject", protect, authorizeRoles("admin"), rejectPayment);

module.exports = router;