const Tournament = require("../Models/tournamentModel");

/**
 * ✅ Bulletproof ObjectId extractor:
 * - extracts the first 24-hex chars anywhere inside the string
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

// ✅ Update Tournament (Organizer)
exports.updateTournament = async (req, res) => {
  try {
    const cleanId = extractObjectId(req.params.id);
    const cleanOrganizerId = extractObjectId(req.query.organizerId || req.body.organizerId || "");

    console.log("UPDATE rawId:", req.params.id, "cleanId:", cleanId);
    console.log("UPDATE organizerId:", cleanOrganizerId);

    if (!cleanId) {
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    // ✅ only allow update by owner organizer (temporary security)
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
    console.log("PUBLISH rawId:", req.params.id, "cleanId:", cleanId);

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

// ✅ Unpublish Tournament (back to Draft)
exports.unpublishTournament = async (req, res) => {
  try {
    const id = String(req.params.id).trim().replace(/["'\\]/g, "");
    console.log("UNPUBLISH id:", id);

    const tournament = await Tournament.findById(id);
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
    const cleanOrganizerId = extractObjectId(req.query.organizerId || "");

    console.log("CLOSE rawId:", req.params.id, "cleanId:", cleanId);
    console.log("CLOSE organizerId:", cleanOrganizerId);

    if (!cleanId) {
      return res.status(400).json({ message: "Invalid tournament id", received: req.params.id });
    }

    const tournament = await Tournament.findOne({
      _id: cleanId,
      ...(cleanOrganizerId ? { organizerId: cleanOrganizerId } : {}),
    });

    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    tournament.status = "Closed";
    await tournament.save();

    res.json({ message: "Tournament closed", tournament });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get all Published tournaments
exports.getPublishedTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find({ status: "Published" }).sort({ createdAt: -1 });
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get tournaments created by organizer
exports.getMyTournaments = async (req, res) => {
  try {
    const cleanOrganizerId = extractObjectId(req.query.organizerId);
    console.log("MINE organizerId:", req.query.organizerId, "clean:", cleanOrganizerId);

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