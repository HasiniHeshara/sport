const Tournament = require("../Models/tournamentModel");
const TeamRegistration = require("../Models/teamRegistrationModel");

/**
 * Extract first valid 24-hex Mongo ObjectId from any string.
 */
const extractObjectId = (value = "") => {
  const str = String(value).trim();
  const match = str.match(/[a-fA-F0-9]{24}/);
  return match ? match[0] : null;
};

// Create Tournament (Organizer)
exports.createTournament = async (req, res) => {
  try {
    const {
      organizerId,
      sportType,
      title,
      venue,
      startDate,
      endDate,
      registrationDeadline,
      teamLimit,
      registrationFee,
    } = req.body;

    const cleanOrganizerId = extractObjectId(req.user?.userId || organizerId || "");

    if (
      !cleanOrganizerId ||
      !sportType ||
      !title ||
      !venue ||
      !startDate ||
      !endDate ||
      !registrationDeadline ||
      !teamLimit
    ) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const tournament = await Tournament.create({
      organizerId: cleanOrganizerId,
      sportType,
      title,
      venue,
      startDate,
      endDate,
      registrationDeadline,
      teamLimit,
      registrationFee: registrationFee || 0,
      status: "Draft",
    });

    return res.status(201).json({ message: "Tournament created", tournament });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Tournament (Organizer)
exports.updateTournament = async (req, res) => {
  try {
    const cleanId = extractObjectId(req.params.id);
    const cleanOrganizerId = extractObjectId(
      req.user?.userId || req.query.organizerId || req.body.organizerId || ""
    );

    if (!cleanId) {
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    const updated = await Tournament.findOneAndUpdate(
      { _id: cleanId, ...(cleanOrganizerId ? { organizerId: cleanOrganizerId } : {}) },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    return res.json({ message: "Tournament updated", tournament: updated });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Publish Tournament
exports.publishTournament = async (req, res) => {
  try {
    const cleanId = extractObjectId(req.params.id);
    const cleanOrganizerId = extractObjectId(req.user?.userId || "");

    if (!cleanId) {
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    const tournament = await Tournament.findById(cleanId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (!cleanOrganizerId || String(tournament.organizerId) !== cleanOrganizerId) {
      return res.status(403).json({ message: "Forbidden: not owner of this tournament" });
    }

    tournament.status = "Published";
    await tournament.save();

    return res.json({ message: "Tournament published", tournament });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Unpublish Tournament
exports.unpublishTournament = async (req, res) => {
  try {
    const cleanId = extractObjectId(req.params.id);
    const cleanOrganizerId = extractObjectId(req.user?.userId || "");

    if (!cleanId) {
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    const tournament = await Tournament.findById(cleanId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (!cleanOrganizerId || String(tournament.organizerId) !== cleanOrganizerId) {
      return res.status(403).json({ message: "Forbidden: not owner of this tournament" });
    }

    tournament.status = "Draft";
    await tournament.save();

    return res.json({ message: "Tournament unpublished", tournament });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Close Tournament
exports.closeTournament = async (req, res) => {
  try {
    const cleanId = extractObjectId(req.params.id);
    const cleanOrganizerId = extractObjectId(req.user?.userId || "");

    if (!cleanId) {
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    const tournament = await Tournament.findById(cleanId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (!cleanOrganizerId || String(tournament.organizerId) !== cleanOrganizerId) {
      return res.status(403).json({ message: "Forbidden: not owner of this tournament" });
    }

    tournament.status = "Closed";
    await tournament.save();

    return res.json({ message: "Tournament closed", tournament });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Tournament (Organizer)
exports.deleteTournament = async (req, res) => {
  try {
    const cleanId = extractObjectId(req.params.id);
    const cleanOrganizerId = extractObjectId(req.user?.userId || "");

    if (!cleanId) {
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    const tournament = await Tournament.findById(cleanId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (!cleanOrganizerId || String(tournament.organizerId) !== cleanOrganizerId) {
      return res.status(403).json({ message: "Forbidden: not owner of this tournament" });
    }

    await Tournament.findByIdAndDelete(cleanId);
    return res.json({ message: "Tournament deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Published Tournaments
exports.getPublishedTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find({ status: "Published" }).sort({ createdAt: -1 });
    return res.json(tournaments);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get My Tournaments (Organizer)
exports.getMyTournaments = async (req, res) => {
  try {
    const cleanOrganizerId = extractObjectId(req.user?.userId || req.query.organizerId || "");
    if (!cleanOrganizerId) {
      return res.status(400).json({
        message: "Invalid organizerId",
        received: req.query.organizerId,
      });
    }

    const tournaments = await Tournament.find({ organizerId: cleanOrganizerId }).sort({
      createdAt: -1,
    });

    return res.json(tournaments);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Organizer: get registrations for a tournament
exports.getTournamentRegistrations = async (req, res) => {
  try {
    const cleanTournamentId = extractObjectId(req.params.id);
    const cleanOrganizerId = extractObjectId(req.user?.userId || "");

    if (!cleanTournamentId) {
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    const tournament = await Tournament.findById(cleanTournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (!cleanOrganizerId || String(tournament.organizerId) !== cleanOrganizerId) {
      return res.status(403).json({ message: "Forbidden: not owner of this tournament" });
    }

    const registrations = await TeamRegistration.find({ tournamentId: cleanTournamentId })
      .populate("leaderId", "name email itNumber contactNumber")
      .sort({ createdAt: -1 });

    return res.json(registrations);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Organizer: approve registration
exports.approveRegistration = async (req, res) => {
  try {
    const cleanRegistrationId = extractObjectId(req.params.registrationId);
    const cleanOrganizerId = extractObjectId(req.user?.userId || "");

    if (!cleanRegistrationId) {
      return res.status(400).json({ message: "Invalid registration id" });
    }

    const registration = await TeamRegistration.findById(cleanRegistrationId);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const tournament = await Tournament.findById(registration.tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (!cleanOrganizerId || String(tournament.organizerId) !== cleanOrganizerId) {
      return res.status(403).json({ message: "Forbidden: not owner of this tournament" });
    }

    registration.status = "Approved";
    registration.rejectionReason = "";
    registration.pendingAction = "None";
    registration.pendingMembers = [];
    await registration.save();

    return res.json({ message: "Registration approved", registration });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Organizer: reject registration
exports.rejectRegistration = async (req, res) => {
  try {
    const cleanRegistrationId = extractObjectId(req.params.registrationId);
    const cleanOrganizerId = extractObjectId(req.user?.userId || "");

    if (!cleanRegistrationId) {
      return res.status(400).json({ message: "Invalid registration id" });
    }

    const registration = await TeamRegistration.findById(cleanRegistrationId);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const tournament = await Tournament.findById(registration.tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (!cleanOrganizerId || String(tournament.organizerId) !== cleanOrganizerId) {
      return res.status(403).json({ message: "Forbidden: not owner of this tournament" });
    }

    const reason = String(req.body?.reason || "").trim();
    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    registration.status = "Rejected";
    registration.rejectionReason = reason;
    await registration.save();

    return res.json({ message: "Registration rejected", registration });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
