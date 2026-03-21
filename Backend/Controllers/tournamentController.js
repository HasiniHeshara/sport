const Tournament = require("../Models/tournamentModel");

/**
 * Extract first valid 24-hex Mongo ObjectId from any string.
 * (Fixes hidden \ or " problems from Postman)
 */
const extractObjectId = (value = "") => {
  const str = String(value).trim();
  const match = str.match(/[a-fA-F0-9]{24}/);
  return match ? match[0] : null;
};

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

    if (
      !organizerId ||
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

    const cleanOrganizerId = extractObjectId(organizerId);
    if (!cleanOrganizerId) {
      return res.status(400).json({ message: "Invalid organizerId", received: organizerId });
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

// ✅ Update Tournament
exports.updateTournament = async (req, res) => {
  try {
    const cleanId = extractObjectId(req.params.id);
    if (!cleanId) {
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    const updated = await Tournament.findByIdAndUpdate(cleanId, req.body, { new: true });
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
    if (!cleanId) {
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    const tournament = await Tournament.findById(cleanId);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

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
    if (!cleanId) {
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    const tournament = await Tournament.findById(cleanId);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

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
    if (!cleanId) {
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    const tournament = await Tournament.findById(cleanId);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

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
    if (!cleanId) {
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    const tournament = await Tournament.findById(cleanId);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

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
    const cleanOrganizerId = extractObjectId(req.query.organizerId);
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