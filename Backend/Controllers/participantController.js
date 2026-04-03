const participantModel = require("../Models/participantModel");
const Payment = require("../Models/paymentModel");

const extractObjectId = (value = "") => {
  const str = String(value).trim();
  const match = str.match(/[a-fA-F0-9]{24}/);
  return match ? match[0] : null;
};

const isDeadlinePassed = (tournament) =>
  new Date() > new Date(tournament?.registrationDeadline);

const normalizeMembers = (members = []) =>
  (Array.isArray(members) ? members : [])
    .map((m) => ({
      name: String(m?.name || "").trim(),
      itNumber: String(m?.itNumber || "").trim(),
      contactNumber: String(m?.contactNumber || "").trim(),
    }))
    .filter((m) => m.name && m.itNumber);

const hasDuplicateMemberItNumbers = (members = []) => {
  const unique = new Set(members.map((m) => m.itNumber.toLowerCase()));
  return unique.size !== members.length;
};

exports.registerTeam = async (req, res) => {
  try {
    const cleanTournamentId = extractObjectId(req.params.id);
    const cleanLeaderId = extractObjectId(req.user?.userId || "");

    if (!cleanTournamentId) {
      return res.status(400).json({
        message: "Invalid tournament id",
        received: req.params.id,
      });
    }

    if (!cleanLeaderId) {
      return res.status(401).json({ message: "Invalid participant identity" });
    }

    const tournament = await participantModel.findTournamentById(cleanTournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (tournament.status !== "Published") {
      return res.status(400).json({ message: "Tournament is not open for registrations" });
    }

    if (new Date() > new Date(tournament.registrationDeadline)) {
      return res.status(400).json({ message: "Registration deadline has passed" });
    }

    const leader = await participantModel.findParticipantById(cleanLeaderId);
    if (!leader || leader.role !== "participant") {
      return res.status(403).json({ message: "Only participants can register teams" });
    }

    const { teamName, contactNumber, members } = req.body;

    if (!teamName || !contactNumber || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        message: "teamName, contactNumber and members are required",
      });
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

    const uniqueMemberItNumbers = new Set(
      cleanMembers.map((m) => m.itNumber.toLowerCase())
    );

    if (uniqueMemberItNumbers.size !== cleanMembers.length) {
      return res.status(400).json({
        message: "Duplicate member IT numbers are not allowed",
      });
    }

    const alreadyRegistered = await participantModel.findTeamRegistrationForTournament(
      cleanTournamentId,
      cleanLeaderId
    );

    if (alreadyRegistered) {
      return res.status(400).json({
        message: "You have already registered a team for this tournament",
      });
    }

    const duplicateTeamName = await participantModel.findDuplicateTeamName(
      cleanTournamentId,
      String(teamName).trim()
    );

    if (duplicateTeamName) {
      return res.status(400).json({
        message: "Team name already exists for this tournament",
      });
    }

    const currentCount = await participantModel.countActiveParticipantRegistrations(
      cleanTournamentId
    );

    if (currentCount >= Number(tournament.teamLimit || 0)) {
      return res.status(400).json({ message: "Tournament team limit reached" });
    }

    const registration = await participantModel.createTeamRegistration({
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
      return res.status(400).json({
        message: "You have already registered a team for this tournament",
      });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMyTeamRegistration = async (req, res) => {
  try {
    const cleanTournamentId = extractObjectId(req.params.id);
    const cleanLeaderId = extractObjectId(req.user?.userId || "");

    if (!cleanTournamentId) {
      return res.status(400).json({
        message: "Invalid tournament id",
        received: req.params.id,
      });
    }

    if (!cleanLeaderId) {
      return res.status(401).json({ message: "Invalid participant identity" });
    }

    const registration = await participantModel.findTeamRegistrationForTournament(
      cleanTournamentId,
      cleanLeaderId
    );

    if (!registration) {
      return res.status(404).json({
        message: "No registration found for this tournament",
      });
    }

    res.json(registration);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMyRegistrations = async (req, res) => {
  try {
    const cleanLeaderId = extractObjectId(req.user?.userId || "");

    if (!cleanLeaderId) {
      return res.status(401).json({ message: "Invalid participant identity" });
    }

    const registrations = await participantModel.findParticipantRegistrations(cleanLeaderId);

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMyRegistrationById = async (req, res) => {
  try {
    const cleanRegistrationId = extractObjectId(req.params.registrationId);
    const cleanLeaderId = extractObjectId(req.user?.userId || "");

    if (!cleanRegistrationId) {
      return res.status(400).json({ message: "Invalid registration id" });
    }

    if (!cleanLeaderId) {
      return res.status(401).json({ message: "Invalid participant identity" });
    }

    const registration = await participantModel.findParticipantRegistrationById(
      cleanRegistrationId,
      cleanLeaderId
    );

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    res.json(registration);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateMyRegistration = async (req, res) => {
  try {
    const cleanRegistrationId = extractObjectId(req.params.registrationId);
    const cleanLeaderId = extractObjectId(req.user?.userId || "");

    if (!cleanRegistrationId) {
      return res.status(400).json({ message: "Invalid registration id" });
    }

    const registration = await participantModel.findParticipantRegistrationById(
      cleanRegistrationId,
      cleanLeaderId
    );

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (!["Approved", "Rejected"].includes(registration.status)) {
      return res.status(400).json({
        message: "Only approved or rejected registrations can be updated",
      });
    }

    const tournament = await participantModel.findTournamentById(registration.tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (isDeadlinePassed(tournament)) {
      return res.status(400).json({ message: "Registration deadline has passed" });
    }

    const { teamName, contactNumber, members } = req.body;

    const cleanMembers = normalizeMembers(members);

    if (cleanMembers.length === 0) {
      return res.status(400).json({ message: "At least one valid member is required" });
    }

    if (hasDuplicateMemberItNumbers(cleanMembers)) {
      return res.status(400).json({
        message: "Duplicate member IT numbers are not allowed",
      });
    }

    if (registration.status === "Approved") {
      registration.members = cleanMembers;
      await participantModel.saveRegistration(registration);

      return res.json({
        message: "Registration members updated successfully",
        registration,
      });
    }

    if (!teamName || !contactNumber) {
      return res.status(400).json({
        message: "teamName, contactNumber and members are required",
      });
    }

    const duplicateTeamName = await participantModel.findDuplicateTeamName(
      registration.tournamentId,
      String(teamName).trim(),
      cleanRegistrationId
    );

    if (duplicateTeamName) {
      return res.status(400).json({
        message: "Team name already exists for this tournament",
      });
    }

    registration.teamName = String(teamName).trim();
    registration.contactNumber = String(contactNumber).trim();
    registration.members = cleanMembers;
    registration.status = "Pending";
    registration.rejectionReason = "";

    await participantModel.saveRegistration(registration);

    res.json({
      message: "Registration updated and submitted for approval",
      registration,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteMyRegistration = async (req, res) => {
  try {
    const cleanRegistrationId = extractObjectId(req.params.registrationId);
    const cleanLeaderId = extractObjectId(req.user?.userId || "");

    if (!cleanRegistrationId) {
      return res.status(400).json({ message: "Invalid registration id" });
    }

    if (!cleanLeaderId) {
      return res.status(401).json({ message: "Invalid participant identity" });
    }

    const registration = await participantModel.findParticipantRegistrationById(
      cleanRegistrationId,
      cleanLeaderId
    );

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.status !== "Approved") {
      return res.status(400).json({
        message: "Only approved registrations can be deleted",
      });
    }

    const tournament = await participantModel.findTournamentById(registration.tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (isDeadlinePassed(tournament)) {
      return res.status(400).json({ message: "Registration deadline has passed" });
    }

    await Payment.deleteMany({ registrationId: registration._id });
    await registration.deleteOne();

    res.json({
      message: "Team registration deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};