const Tournament = require("../Models/tournamentModel");
const TeamRegistration = require("../Models/teamRegistrationModel");
const User = require("../Models/userModel");

const extractObjectId = (value = "") => {
  const str = String(value).trim();
  const match = str.match(/[a-fA-F0-9]{24}/);
  return match ? match[0] : null;
};

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isTenDigitNumber = (value = "") => /^\d{10}$/.test(String(value).trim());

// Participant: register team to a tournament
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

    if (!isTenDigitNumber(contactNumber)) {
      return res.status(400).json({ message: "Leader contact number must be exactly 10 digits" });
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

    const invalidMemberContact = cleanMembers.find(
      (m) => m.contactNumber && !isTenDigitNumber(m.contactNumber)
    );
    if (invalidMemberContact) {
      return res.status(400).json({ message: "Each member contact number must be exactly 10 digits" });
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
      editDeadline: tournament.registrationDeadline,
      deleteDeadline: tournament.registrationDeadline,
    });

    return res.status(201).json({
      message: "Team registration submitted for approval",
      registration,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "You have already registered a team for this tournament" });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Participant: get my registration for a tournament
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

    return res.json(registration);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Participant: get all my registrations
exports.getMyRegistrations = async (req, res) => {
  try {
    const cleanLeaderId = extractObjectId(req.user?.userId || "");
    if (!cleanLeaderId) {
      return res.status(401).json({ message: "Invalid participant identity" });
    }

    const registrations = await TeamRegistration.find({ leaderId: cleanLeaderId })
      .populate("tournamentId", "title sportType venue startDate endDate registrationDeadline status organizerId")
      .sort({ createdAt: -1 });

    return res.json(registrations);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Participant: update rejected registration and resubmit
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

    if (!isTenDigitNumber(contactNumber)) {
      return res.status(400).json({ message: "Leader contact number must be exactly 10 digits" });
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

    const invalidMemberContact = cleanMembers.find(
      (m) => m.contactNumber && !isTenDigitNumber(m.contactNumber)
    );
    if (invalidMemberContact) {
      return res.status(400).json({ message: "Each member contact number must be exactly 10 digits" });
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

    return res.json({ message: "Registration updated and submitted for approval", registration });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Participant: update members for registered teams before deadline
exports.requestEditApprovedMembers = async (req, res) => {
  try {
    const cleanRegistrationId = extractObjectId(req.params.registrationId);
    const cleanLeaderId = extractObjectId(req.user?.userId || "");

    if (!cleanRegistrationId) {
      return res.status(400).json({ message: "Invalid registration id" });
    }

    const registration = await TeamRegistration.findOne({
      _id: cleanRegistrationId,
      leaderId: cleanLeaderId,
    }).populate("tournamentId", "registrationDeadline");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (!["Pending", "Approved"].includes(String(registration.status || ""))) {
      return res.status(400).json({ message: "Only registered teams can edit members" });
    }

    const deadline = registration.editDeadline || registration?.tournamentId?.registrationDeadline;
    if (deadline && new Date() > new Date(deadline)) {
      return res.status(400).json({ message: "Edit deadline has passed" });
    }

    const { members } = req.body;
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: "members are required" });
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

    const invalidMemberContact = cleanMembers.find(
      (m) => m.contactNumber && !isTenDigitNumber(m.contactNumber)
    );
    if (invalidMemberContact) {
      return res.status(400).json({ message: "Each member contact number must be exactly 10 digits" });
    }

    registration.members = cleanMembers;
    registration.pendingMembers = [];
    registration.pendingAction = "None";
    await registration.save();

    return res.json({
      message: "Team members updated",
      registration,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Participant: delete registered team before deadline
exports.requestDeleteApprovedTeam = async (req, res) => {
  try {
    const cleanRegistrationId = extractObjectId(req.params.registrationId);
    const cleanLeaderId = extractObjectId(req.user?.userId || "");

    if (!cleanRegistrationId) {
      return res.status(400).json({ message: "Invalid registration id" });
    }

    const registration = await TeamRegistration.findOne({
      _id: cleanRegistrationId,
      leaderId: cleanLeaderId,
    }).populate("tournamentId", "registrationDeadline");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (!["Pending", "Approved"].includes(String(registration.status || ""))) {
      return res.status(400).json({ message: "Only registered teams can be deleted" });
    }

    const deadline = registration.deleteDeadline || registration?.tournamentId?.registrationDeadline;
    if (deadline && new Date() > new Date(deadline)) {
      return res.status(400).json({ message: "Delete deadline has passed" });
    }

    await TeamRegistration.findByIdAndDelete(registration._id);

    return res.json({
      message: "Team deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
