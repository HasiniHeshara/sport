const Tournament = require("./tournamentModel");
const TeamRegistration = require("./teamRegistrationModel");
const User = require("./userModel");

const participantRegistrationProjection =
  "title sportType venue startDate endDate registrationDeadline status rules";

exports.findParticipantById = (participantId) => User.findById(participantId);

exports.findTournamentById = (tournamentId) => Tournament.findById(tournamentId);

exports.createTeamRegistration = (registrationData) =>
  TeamRegistration.create(registrationData);

exports.findTeamRegistrationForTournament = (tournamentId, leaderId) =>
  TeamRegistration.findOne({ tournamentId, leaderId });

exports.findRegistrationById = (registrationId) => TeamRegistration.findById(registrationId);

exports.findParticipantRegistrationById = (registrationId, leaderId) =>
  TeamRegistration.findOne({ _id: registrationId, leaderId });

exports.findParticipantRegistrations = (leaderId) =>
  TeamRegistration.find({ leaderId })
    .populate("tournamentId", participantRegistrationProjection)
    .sort({ createdAt: -1 });

exports.countActiveParticipantRegistrations = (tournamentId) =>
  TeamRegistration.countDocuments({
    tournamentId,
    status: { $in: ["Pending", "Approved"] },
  });

exports.findDuplicateTeamName = (tournamentId, teamName, excludedRegistrationId = null) =>
  TeamRegistration.findOne({
    ...(excludedRegistrationId ? { _id: { $ne: excludedRegistrationId } } : {}),
    tournamentId,
    teamName: {
      $regex: `^${String(teamName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      $options: "i",
    },
  });

exports.saveRegistration = (registration) => registration.save();