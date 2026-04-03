const Tournament = require("../Models/tournamentModel");
const TeamRegistration = require("../Models/teamRegistrationModel");

/**
 * Extract first valid 24-hex Mongo ObjectId from any string.
 * (Fixes hidden \ or " problems from Postman)
 */
const extractObjectId = (value = "") => {
  const str = String(value).trim();
  const match = str.match(/[a-fA-F0-9]{24}/);
  return match ? match[0] : null;
};

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ✅ Create Tournament (Organizer)
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
      rules,
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
      sportType: String(sportType).trim(),
      title: String(title).trim(),
      venue: String(venue).trim(),
      startDate,
      endDate,
      registrationDeadline,
      teamLimit: Number(teamLimit),
      registrationFee: Number(registrationFee || 0),
      rules: String(rules || "").trim(),
      status: "Draft",
    });

    res.status(201).json({ message: "Tournament created", tournament });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update Tournament (Organizer)
exports.updateTournament = async (req, res) => {
  try {
    const cleanId = extractObjectId(req.params.id);
    const cleanOrganizerId = extractObjectId(
      req.user?.userId || req.query.organizerId || req.body.organizerId || ""
    );

    if (!cleanId) {
      return res.status(400).json({
        message: "Invalid tournament id",
        received: req.params.id,
      });
    }

    const updateData = {
      ...req.body,
    };

    if (typeof updateData.sportType === "string") {
      updateData.sportType = updateData.sportType.trim();
    }

    if (typeof updateData.title === "string") {
      updateData.title = updateData.title.trim();
    }

    if (typeof updateData.venue === "string") {
      updateData.venue = updateData.venue.trim();
    }

    if (typeof updateData.rules === "string") {
      updateData.rules = updateData.rules.trim();
    }

    if (updateData.teamLimit !== undefined) {
      updateData.teamLimit = Number(updateData.teamLimit);
    }

    if (updateData.registrationFee !== undefined) {
      updateData.registrationFee = Number(updateData.registrationFee);
    }

    const updated = await Tournament.findOneAndUpdate(
      { _id: cleanId, ...(cleanOrganizerId ? { organizerId: cleanOrganizerId } : {}) },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    res.json({ message: "Tournament updated", tournament: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Publish Tournament
exports.publishTournament = async (req, res) => {
  try {
    const cleanId = extractObjectId(req.params.id);
    const cleanOrganizerId = extractObjectId(req.user?.userId || "");

    if (!cleanId) {
      return res.status(400).json({
        message: "Invalid tournament id",
        received: req.params.id,
      });
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

    res.json({ message: "Tournament published", tournament });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Unpublish Tournament
exports.unpublishTournament = async (req, res) => {
  try {
    const cleanId = extractObjectId(req.params.id);
    const cleanOrganizerId = extractObjectId(req.user?.userId || "");

    if (!cleanId) {
      return res.status(400).json({
        message: "Invalid tournament id",
        received: req.params.id,
      });
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

    res.json({ message: "Tournament unpublished", tournament });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ✅ Close Tournament
exports.closeTournament = async (req, res) => {
  try {
    const cleanId = extractObjectId(req.params.id);
    const cleanOrganizerId = extractObjectId(req.user?.userId || "");

    if (!cleanId) {
      return res.status(400).json({
        message: "Invalid tournament id",
        received: req.params.id,
      });
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

    res.json({ message: "Tournament closed", tournament });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Delete Tournament
exports.deleteTournament = async (req, res) => {
  try {
    const cleanId = extractObjectId(req.params.id);
    const cleanOrganizerId = extractObjectId(req.user?.userId || "");

    if (!cleanId) {
      return res.status(400).json({
        message: "Invalid tournament id",
        received: req.params.id,
      });
    }

    const tournament = await Tournament.findById(cleanId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (!cleanOrganizerId || String(tournament.organizerId) !== cleanOrganizerId) {
      return res.status(403).json({ message: "Forbidden: not owner of this tournament" });
    }

    await Tournament.findByIdAndDelete(cleanId);
    res.json({ message: "Tournament deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get Published Tournaments
exports.getPublishedTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find({ status: "Published" }).sort({
      createdAt: -1,
    });

    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get My Tournaments
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

    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get one tournament by id
exports.getTournamentById = async (req, res) => {
  try {
    const cleanId = extractObjectId(req.params.id);

    if (!cleanId) {
      return res.status(400).json({
        message: "Invalid tournament id",
        received: req.params.id,
      });
    }

    const tournament = await Tournament.findById(cleanId).populate(
      "organizerId",
      "name email"
    );

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    res.json(tournament);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Organizer: get registrations for a tournament
exports.getTournamentRegistrations = async (req, res) => {
  try {
    const cleanTournamentId = extractObjectId(req.params.id);
    const cleanOrganizerId = extractObjectId(req.user?.userId || "");

    if (!cleanTournamentId) {
      return res.status(400).json({
        message: "Invalid tournament id",
        received: req.params.id,
      });
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

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Organizer: approve registration
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
    await registration.save();

    res.json({ message: "Registration approved", registration });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Organizer: reject registration
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

    res.json({ message: "Registration rejected", registration });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};