const Tournament = require("../Models/tournamentModel");
const TeamRegistration = require("../Models/teamRegistrationModel");
const User = require("../Models/userModel");

/**
 * Extract first valid 24-hex Mongo ObjectId from any string.
 * (Fixes hidden \ or " problems from Postman)
 * ✅ Bulletproof ObjectId extractor:
 * - extracts the first 24-hex chars anywhere inside the string
 */
const extractObjectId = (value = "") => {
  const str = String(value).trim();
  const match = str.match(/[a-fA-F0-9]{24}/);
  return match ? match[0] : null;
};

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    // ✅ only allow update by owner organizer
    const updated = await Tournament.findOneAndUpdate(
      { _id: cleanId, ...(cleanOrganizerId ? { organizerId: cleanOrganizerId } : {}) },
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Tournament not found" });

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
    console.log("PUBLISH rawId:", req.params.id, "cleanId:", cleanId);

    if (!cleanId) {
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    const tournament = await Tournament.findById(cleanId);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

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
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    const tournament = await Tournament.findById(cleanId);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

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
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    const tournament = await Tournament.findById(cleanId);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

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

// ✅ Delete Tournament (any status)
exports.deleteTournament = async (req, res) => {
  try {
    const cleanId = extractObjectId(req.params.id);
    const cleanOrganizerId = extractObjectId(req.user?.userId || "");
    if (!cleanId) {
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    const tournament = await Tournament.findById(cleanId);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

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
    const tournaments = await Tournament.find({ status: "Published" }).sort({ createdAt: -1 });
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get My Tournaments (using organizerId query for now)
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

// ✅ Participant: register team to a tournament
exports.registerTeam = async (req, res) => {
  try {
    const cleanTournamentId = extractObjectId(req.params.id);
    const cleanLeaderId = extractObjectId(req.user?.userId || "");

    if (!cleanTournamentId) {
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    if (!cleanLeaderId) {
      return res.status(401).json({ message: "Invalid participant identity" });
    }

    const tournament = await Tournament.findById(cleanTournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (tournament.status !== "Published") {
      return res.status(400).json({ message: "Tournament is not open for registrations" });
    }

    if (new Date() > new Date(tournament.registrationDeadline)) {
      return res.status(400).json({ message: "Registration deadline has passed" });
    }

    const leader = await User.findById(cleanLeaderId);
    if (!leader || leader.role !== "participant") {
      return res.status(403).json({ message: "Only participants can register teams" });
    }

    const { teamName, contactNumber, members } = req.body;

    if (!teamName || !contactNumber || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: "teamName, contactNumber and members are required" });
    }

    const cleanMembers = members
      .map((m) => ({
        name: String(m?.name || "").trim(),
        itNumber: String(m?.itNumber || "").trim(),
        contactNumber: String(m?.contactNumber || "").trim(),
      }))
      .filter((m) => m.name && m.itNumber);

    if (cleanMembers.length === 0) {
      return res.status(400).json({ message: "At least one valid member is required" });
    }

    const uniqueMemberItNumbers = new Set(cleanMembers.map((m) => m.itNumber.toLowerCase()));
    if (uniqueMemberItNumbers.size !== cleanMembers.length) {
      return res.status(400).json({ message: "Duplicate member IT numbers are not allowed" });
    }

    const alreadyRegistered = await TeamRegistration.findOne({
      tournamentId: cleanTournamentId,
      leaderId: cleanLeaderId,
    });

    if (alreadyRegistered) {
      return res.status(400).json({ message: "You have already registered a team for this tournament" });
    }

    const duplicateTeamName = await TeamRegistration.findOne({
      tournamentId: cleanTournamentId,
      teamName: { $regex: `^${escapeRegex(String(teamName).trim())}$`, $options: "i" },
    });

    if (duplicateTeamName) {
      return res.status(400).json({ message: "Team name already exists for this tournament" });
    }

    const currentCount = await TeamRegistration.countDocuments({
      tournamentId: cleanTournamentId,
      status: { $in: ["Pending", "Approved"] },
    });

    if (currentCount >= Number(tournament.teamLimit || 0)) {
      return res.status(400).json({ message: "Tournament team limit reached" });
    }

    const registration = await TeamRegistration.create({
      tournamentId: cleanTournamentId,
      leaderId: cleanLeaderId,
      leaderEmail: leader.email,
      teamName: String(teamName).trim(),
      contactNumber: String(contactNumber).trim(),
      members: cleanMembers,
      status: "Pending",
    });

    res.status(201).json({
      message: "Team registration submitted for approval",
      registration,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "You have already registered a team for this tournament" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Participant: get my registration for a tournament
exports.getMyTeamRegistration = async (req, res) => {
  try {
    const cleanTournamentId = extractObjectId(req.params.id);
    const cleanLeaderId = extractObjectId(req.user?.userId || "");

    if (!cleanTournamentId) {
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    if (!cleanLeaderId) {
      return res.status(401).json({ message: "Invalid participant identity" });
    }

    const registration = await TeamRegistration.findOne({
      tournamentId: cleanTournamentId,
      leaderId: cleanLeaderId,
    });

    if (!registration) {
      return res.status(404).json({ message: "No registration found for this tournament" });
    }

    res.json(registration);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Participant: get all my registrations
exports.getMyRegistrations = async (req, res) => {
  try {
    const cleanLeaderId = extractObjectId(req.user?.userId || "");
    if (!cleanLeaderId) {
      return res.status(401).json({ message: "Invalid participant identity" });
    }

    const registrations = await TeamRegistration.find({ leaderId: cleanLeaderId })
      .populate("tournamentId", "title sportType venue startDate endDate registrationDeadline status")
      .sort({ createdAt: -1 });

    res.json(registrations);
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

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Participant: update rejected registration and resubmit
exports.updateMyRejectedRegistration = async (req, res) => {
  try {
    const cleanRegistrationId = extractObjectId(req.params.registrationId);
    const cleanLeaderId = extractObjectId(req.user?.userId || "");

    if (!cleanRegistrationId) {
      return res.status(400).json({ message: "Invalid registration id" });
    }

    const registration = await TeamRegistration.findOne({
      _id: cleanRegistrationId,
      leaderId: cleanLeaderId,
    });

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.status !== "Rejected") {
      return res.status(400).json({ message: "Only rejected registrations can be updated" });
    }

    const tournament = await Tournament.findById(registration.tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (new Date() > new Date(tournament.registrationDeadline)) {
      return res.status(400).json({ message: "Registration deadline has passed" });
    }

    const { teamName, contactNumber, members } = req.body;
    if (!teamName || !contactNumber || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: "teamName, contactNumber and members are required" });
    }

    const cleanMembers = members
      .map((m) => ({
        name: String(m?.name || "").trim(),
        itNumber: String(m?.itNumber || "").trim(),
        contactNumber: String(m?.contactNumber || "").trim(),
      }))
      .filter((m) => m.name && m.itNumber);

    if (cleanMembers.length === 0) {
      return res.status(400).json({ message: "At least one valid member is required" });
    }

    const duplicateTeamName = await TeamRegistration.findOne({
      _id: { $ne: cleanRegistrationId },
      tournamentId: registration.tournamentId,
      teamName: { $regex: `^${escapeRegex(String(teamName).trim())}$`, $options: "i" },
    });

    if (duplicateTeamName) {
      return res.status(400).json({ message: "Team name already exists for this tournament" });
    }

    registration.teamName = String(teamName).trim();
    registration.contactNumber = String(contactNumber).trim();
    registration.members = cleanMembers;
    registration.status = "Pending";
    registration.rejectionReason = "";

    await registration.save();

    res.json({ message: "Registration updated and submitted for approval", registration });
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