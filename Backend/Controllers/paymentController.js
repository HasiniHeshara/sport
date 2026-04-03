const Payment = require("../Models/paymentModel");
const Tournament = require("../Models/tournamentModel");
const Notification = require("../Models/notificationModel");

const getOrganizerIdFromTournament = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId).lean();

  if (!tournament) return null;

  return (
    tournament.organizer ||
    tournament.createdBy ||
    tournament.userId ||
    tournament.organizerId ||
    null
  );
};

const uploadSlipPayment = async (req, res) => {
  try {
    const {
      registrationId,
      tournamentId,
      tournamentTitle,
      teamName,
      amount,
      participantName,
      participantEmail,
      paymentMethod,
    } = req.body;

    if (
      !registrationId ||
      !tournamentId ||
      !tournamentTitle ||
      !teamName ||
      !amount ||
      !participantName ||
      !participantEmail
    ) {
      return res.status(400).json({
        message: "All required fields must be filled",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Payment slip file is required",
      });
    }

    const slipUrl = `/uploads/payments/${req.file.filename}`;

    const payment = await Payment.findOneAndUpdate(
      { registrationId },
      {
        registrationId,
        tournamentId,
        tournamentTitle,
        teamName,
        participantId: req.user.userId,
        participantName,
        participantEmail,
        amount,
        paymentMethod: paymentMethod || "Upload Slip",
        slipUrl,
        slipOriginalName: req.file.originalname,
        status: "Pending",
        adminRemark: "",
        verifiedBy: null,
        verifiedAt: null,
      },
      { new: true, upsert: true }
    );

    res.status(201).json({
      message: "Payment slip uploaded successfully",
      payment,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to upload payment",
    });
  }
};

const createPayHerePayment = async (req, res) => {
  try {
    const {
      registrationId,
      tournamentId,
      tournamentTitle,
      teamName,
      amount,
      participantName,
      participantEmail,
    } = req.body;

    if (
      !registrationId ||
      !tournamentId ||
      !tournamentTitle ||
      !teamName ||
      !amount ||
      !participantName ||
      !participantEmail
    ) {
      return res.status(400).json({
        message: "All required fields must be filled",
      });
    }

    const payment = await Payment.findOneAndUpdate(
      { registrationId },
      {
        registrationId,
        tournamentId,
        tournamentTitle,
        teamName,
        participantId: req.user.userId,
        participantName,
        participantEmail,
        amount,
        paymentMethod: "PayHere",
        slipUrl: "",
        slipOriginalName: "Online Payment",
        status: "Pending",
        adminRemark: "",
        verifiedBy: null,
        verifiedAt: null,
      },
      { new: true, upsert: true }
    );

    res.status(201).json({
      message: "PayHere payment created successfully",
      payment,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to create payment",
    });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      participantId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch payments",
    });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({}).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch payments",
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = "Verified";
    payment.adminRemark = req.body.adminRemark || "";
    payment.verifiedBy = req.user.userId;
    payment.verifiedAt = new Date();

    await payment.save();

    const organizerId = await getOrganizerIdFromTournament(payment.tournamentId);

    if (organizerId) {
      await Notification.create({
        recipientId: organizerId,
        recipientRole: "organizer",
        title: "Payment Verified",
        message: `Payment for tournament "${payment.tournamentTitle}" by team "${payment.teamName}" has been verified by admin.`,
        type: "payment",
        relatedPaymentId: payment._id,
        relatedTournamentId: payment.tournamentId,
      });
    }

    res.json({
      message: "Payment verified successfully",
      payment,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to verify payment",
    });
  }
};

const rejectPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = "Rejected";
    payment.adminRemark =
      req.body.adminRemark || "Please upload a valid payment slip again.";
    payment.verifiedBy = req.user.userId;
    payment.verifiedAt = new Date();

    await payment.save();

    const organizerId = await getOrganizerIdFromTournament(payment.tournamentId);

    if (organizerId) {
      await Notification.create({
        recipientId: organizerId,
        recipientRole: "organizer",
        title: "Payment Rejected",
        message: `Payment for tournament "${payment.tournamentTitle}" by team "${payment.teamName}" has been rejected by admin.`,
        type: "payment",
        relatedPaymentId: payment._id,
        relatedTournamentId: payment.tournamentId,
      });
    }

    res.json({
      message: "Payment rejected successfully",
      payment,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to reject payment",
    });
  }
};

module.exports = {
  uploadSlipPayment,
  createPayHerePayment,
  getMyPayments,
  getAllPayments,
  verifyPayment,
  rejectPayment,
};