const MatchDraw = require("../Models/matchDrawModel");
const Tournament = require("../Models/tournamentModel");
const TeamRegistration = require("../Models/teamRegistrationModel");

const extractObjectId = (value = "") => {
  const str = String(value).trim();
  const match = str.match(/[a-fA-F0-9]{24}/);
  return match ? match[0] : null;
};

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

exports.generateMatchDraw = async (req, res) => {
  try {
    const tournamentId = extractObjectId(req.params.id);
    const organizerId = extractObjectId(req.user?.userId || "");

    if (!tournamentId) {
      return res.status(400).json({ message: "Invalid tournament id" });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (!organizerId || String(tournament.organizerId) !== organizerId) {
      return res.status(403).json({ message: "Forbidden: not owner of this tournament" });
    }

    const approvedTeams = await TeamRegistration.find({
      tournamentId,
      status: "Approved",
    }).sort({ createdAt: 1 });

    if (approvedTeams.length < 2) {
      return res.status(400).json({
        message: "At least 2 approved teams are required to generate a match draw",
      });
    }

    const existingDraw = await MatchDraw.findOne({ tournamentId });
    if (existingDraw) {
      return res.status(400).json({
        message: "Match draw already exists for this tournament",
      });
    }

    const shuffledTeams = shuffleArray(approvedTeams.map((t) => t.teamName));
    const matches = [];

    let matchNumber = 1;
    for (let i = 0; i < shuffledTeams.length; i += 2) {
      const teamA = shuffledTeams[i];
      const teamB = shuffledTeams[i + 1] || "BYE";

      matches.push({
        roundName: "Round 1",
        teamA,
        teamB,
        matchNumber,
        status: "Scheduled",
      });

      matchNumber += 1;
    }

    const matchDraw = await MatchDraw.create({
      tournamentId,
      format: "Knockout",
      matches,
    });

    res.status(201).json({
      message: "Match draw generated successfully",
      matchDraw,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMatchDrawByTournament = async (req, res) => {
  try {
    const tournamentId = extractObjectId(req.params.id);

    if (!tournamentId) {
      return res.status(400).json({ message: "Invalid tournament id" });
    }

    const matchDraw = await MatchDraw.findOne({ tournamentId });

    if (!matchDraw) {
      return res.status(404).json({ message: "No match draw found for this tournament" });
    }

    res.json(matchDraw);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};