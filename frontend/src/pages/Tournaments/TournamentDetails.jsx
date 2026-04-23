import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import api from "../../services/api";
import "./Tournaments.css";

const emptyMember = { name: "", itNumber: "", contactNumber: "" };
const formatDate = (v) => String(v || "").slice(0, 10);
const tournamentResName = (t) => t?.title || "selected tournament";

const addParticipantNotification = (user, text) => {
  const userId = user?.id || user?._id || "guest";
  const key = `sportix_notifications_${userId}`;

  try {
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const safeExisting = Array.isArray(existing) ? existing : [];
    const next = [
      {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        text,
        createdAt: new Date().toISOString(),
      },
      ...safeExisting,
    ].slice(0, 20);

    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Ignore storage failures
  }
};

const addOrganizerNotification = (tournament, text) => {
  const organizerId =
    tournament?.organizerId?._id ||
    tournament?.organizerId ||
    tournament?.createdBy?._id ||
    tournament?.createdBy ||
    "organizer";

  const key = `sportix_organizer_notifications_${organizerId}`;

  try {
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const safeExisting = Array.isArray(existing) ? existing : [];
    const next = [
      {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        text,
        createdAt: new Date().toISOString(),
        tournamentId: tournament?._id || "",
      },
      ...safeExisting,
    ].slice(0, 20);

    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Ignore storage failures
  }
};

export default function TournamentDetails() {
  const { id } = useParams();
  const location = useLocation();

  const [tournament, setTournament] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [payment, setPayment] = useState(null);
  const [matchDraw, setMatchDraw] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [drawMsg, setDrawMsg] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [form, setForm] = useState({
    teamName: "",
    contactNumber: user?.contactNumber || "",
    members: [{ ...emptyMember }],
  });

  const load = async () => {
    try {
      setLoading(true);
      setMsg("");
      setDrawMsg("");
      setPayment(null);
      setMatchDraw(null);

      const tournamentRes = await api.get(`/api/tournaments/${id}`);
      setTournament(tournamentRes.data);

      let loadedRegistration = null;

      if (user?.role === "participant") {
        try {
          const editRegistrationId = location.state?.editRegistrationId;

          let myRes;
          if (editRegistrationId) {
            myRes = await api.get(`/api/registrations/${editRegistrationId}`);
            setIsEditMode(true);
          } else {
            myRes = await api.get(`/api/tournaments/${id}/my-registration`);
            setIsEditMode(false);
          }

          const reg = myRes.data;
          loadedRegistration = reg;
          setRegistration(reg);

          setForm({
            teamName: reg.teamName || "",
            contactNumber: reg.contactNumber || user?.contactNumber || "",
            members:
              Array.isArray(reg.members) && reg.members.length > 0
                ? reg.members
                : [{ ...emptyMember }],
          });
        } catch (err) {
          if (err.response?.status !== 404) {
            throw err;
          }
          setRegistration(null);
          setIsEditMode(false);
        }
      } else {
        setRegistration(null);
      }

      if (loadedRegistration?._id) {
        try {
          const paymentsRes = await api.get("/api/payments/my");
          const myPayments = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];

          const matchedPayment = myPayments.find(
            (p) =>
              String(p.registrationId?._id || p.registrationId) ===
              String(loadedRegistration._id)
          );

          setPayment(matchedPayment || null);

          if (
            loadedRegistration.status === "Approved" &&
            matchedPayment?.status === "Verified"
          ) {
            try {
              const drawRes = await api.get(`/api/tournaments/${id}/match-draw`);
              setMatchDraw(drawRes.data);
            } catch (err) {
              setMatchDraw(null);
              if (err.response?.status !== 404) {
                setDrawMsg(err.response?.data?.message || "Failed to load match draw");
              }
            }
          }
        } catch (err) {
          console.error("Failed to load payments", err);
          setPayment(null);
        }
      }
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to load tournament details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id, location.state?.editRegistrationId]);

  const isClosed = useMemo(() => {
    if (!tournament) {
      return true;
    }
    return (
      new Date() > new Date(tournament.registrationDeadline) ||
      tournament.status !== "Published"
    );
  }, [tournament]);

  const paymentStatusLabel = payment?.status || "Not Paid Yet";

  const canViewMatchDraw =
    registration?.status === "Approved" && payment?.status === "Verified";

  const canResubmitRejected = registration?.status === "Rejected" && !isClosed;
  const canNewRegister = !registration && !isClosed;
  const canEditMembers = isEditMode && registration?.status === "Approved" && !isClosed;

  const setMember = (index, key, value) => {
    setForm((prev) => {
      const members = [...prev.members];
      members[index] = { ...members[index], [key]: value };
      return { ...prev, members };
    });
  };

  const addMember = () => {
    setForm((prev) => ({
      ...prev,
      members: [...prev.members, { ...emptyMember }],
    }));
  };

  const removeMember = (index) => {
    setForm((prev) => {
      if (prev.members.length <= 1) {
        return prev;
      }
      const members = prev.members.filter((_, i) => i !== index);
      return { ...prev, members };
    });
  };

  const validate = () => {
    if (user?.role !== "participant") {
      return "Only participants can register teams.";
    }
    if (!form.teamName.trim()) {
      return "Team name is required";
    }
    if (!form.contactNumber.trim()) {
      return "Contact number is required";
    }

    const validMembers = form.members.filter(
      (m) => m.name.trim() && m.itNumber.trim()
    );

    if (validMembers.length === 0) {
      return "At least one valid team member is required";
    }

    const itSet = new Set(
      validMembers.map((m) => m.itNumber.trim().toLowerCase())
    );

    if (itSet.size !== validMembers.length) {
      return "Duplicate member IT numbers are not allowed";
    }

    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    const validationError = validate();
    if (validationError) {
      setMsg(validationError);
      return;
    }

    const payload = {
      teamName: form.teamName.trim(),
      contactNumber: form.contactNumber.trim(),
      members: form.members
        .map((m) => ({
          name: m.name.trim(),
          itNumber: m.itNumber.trim(),
          contactNumber: String(m.contactNumber || "").trim(),
        }))
        .filter((m) => m.name && m.itNumber),
    };

    try {
      setSubmitting(true);

      if (isEditMode && registration?.status === "Approved") {
        await api.put(`/api/registrations/${registration._id}`, payload);
        setMsg("Team members updated successfully.");

        addParticipantNotification(
          user,
          `Team members updated for ${tournamentResName(tournament)}`
        );

        addOrganizerNotification(
          tournament,
          `${payload.teamName} updated their team members for ${tournamentResName(
            tournament
          )}.`
        );
      } else if (registration?.status === "Rejected") {
        await api.put(`/api/registrations/${registration._id}`, payload);
        setMsg("Team registration updated and sent to tournament manager for approval.");

        addParticipantNotification(
          user,
          `Team registration resubmitted for ${tournamentResName(
            tournament
          )} and sent for manager approval`
        );

        addOrganizerNotification(
          tournament,
          `${payload.teamName} resubmitted registration for ${tournamentResName(
            tournament
          )}.`
        );
      } else {
        await api.post(`/api/tournaments/${id}/register-team`, payload);
        setMsg("Team registration submitted and sent to tournament manager for approval.");

        addParticipantNotification(
          user,
          `Team registration submitted for ${tournamentResName(
            tournament
          )} and sent for manager approval`
        );

        addOrganizerNotification(
          tournament,
          `${payload.teamName} submitted a new registration for ${tournamentResName(
            tournament
          )}.`
        );
      }

      await load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to submit team registration");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="sp-page">
        <div className="sp-container">
          <div className="sp-empty">Loading...</div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="sp-page">
        <div className="sp-container">
          <p className="sp-error">Tournament not found.</p>
          <Link to="/participant-dashboard" className="sp-link">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-page">
      <div className="sp-container">
        <div className="sp-head">
          <div>
            <h2 className="sp-title">{tournament.title}</h2>
            <p className="sp-subtitle">Register your team before the deadline.</p>
          </div>
          <Link className="sp-link" to="/participant-dashboard">
            Back to Dashboard
          </Link>
        </div>

        {msg && <p className="sp-error">{msg}</p>}
        {drawMsg && <p className="sp-error">{drawMsg}</p>}

        <div className="sp-card">
          <div className="sp-meta">
            <div><b>Sport:</b> {tournament.sportType}</div>
            <div><b>Venue:</b> {tournament.venue}</div>
            <div>
              <b>Start:</b> {formatDate(tournament.startDate)} | <b>End:</b>{" "}
              {formatDate(tournament.endDate)}
            </div>
            <div>
              <b>Registration Deadline:</b> {formatDate(tournament.registrationDeadline)}
            </div>
            <div><b>Team Limit:</b> {tournament.teamLimit}</div>
            <div><b>Fee:</b> {tournament.registrationFee}</div>
          </div>

          <div style={{ marginTop: "18px" }}>
            <h3 className="sp-cardTitle" style={{ fontSize: "18px", marginBottom: "10px" }}>
              Tournament Rules
            </h3>

            {tournament.rules?.trim() ? (
              <div
                className="sp-meta"
                style={{ whiteSpace: "pre-line", lineHeight: "1.7" }}
              >
                {tournament.rules}
              </div>
            ) : (
              <div className="sp-empty" style={{ marginTop: 0 }}>
                No rules added for this tournament.
              </div>
            )}
          </div>
        </div>

        {registration && (
          <div className="sp-formCard" style={{ marginTop: 12 }}>
            <h3 className="sp-cardTitle" style={{ marginBottom: 12 }}>Your Registration</h3>
            <div className="sp-meta">
              <div><b>Team Name:</b> {registration.teamName}</div>
              <div><b>Contact Number:</b> {registration.contactNumber}</div>
              <div><b>Current Status:</b> {registration.status}</div>
              <div><b>Payment Status:</b> {paymentStatusLabel}</div>
              {registration.rejectionReason ? (
                <div><b>Rejection Reason:</b> {registration.rejectionReason}</div>
              ) : null}
            </div>

            {registration.members && registration.members.length > 0 && (
              <div className="team-members-section">
                <b className="team-members-title">Team Members:</b>
                <div className="team-members-list">
                  {registration.members.map((member, idx) => (
                    <div key={idx} className="team-member-card">
                      <div><b>Name:</b> {member.name}</div>
                      <div><b>IT Number:</b> {member.itNumber}</div>
                      {member.contactNumber && (
                        <div><b>Contact:</b> {member.contactNumber}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {registration && (
          <div className="sp-formCard" style={{ marginTop: 12 }}>
            <h3 className="sp-cardTitle" style={{ marginBottom: 12 }}>
              Match Draw & Fixtures
            </h3>

            {canViewMatchDraw ? (
              matchDraw?.matches?.length > 0 ? (
                <div>
                  <div className="sp-meta" style={{ marginBottom: "14px" }}>
                    <div><b>Access:</b> Registration approved and payment verified</div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: "14px",
                    }}
                  >
                    {matchDraw.matches.map((match) => {
                      const status = match.status || "Scheduled";
                      const isCompleted = status === "Completed";
                      const isByeMatch = match.teamA === "BYE" || match.teamB === "BYE";
                      const isMyTeamMatch =
                        registration.teamName === match.teamA ||
                        registration.teamName === match.teamB;
                      const isMyTeamWinner = match.winner === registration.teamName;

                      return (
                        <div
                          key={match.matchNumber}
                          style={{
                            border: isMyTeamMatch
                              ? "1px solid rgba(59,130,246,0.35)"
                              : "1px solid rgba(255,255,255,0.12)",
                            borderRadius: "14px",
                            padding: "16px",
                            background: isMyTeamMatch
                              ? "rgba(59,130,246,0.07)"
                              : "rgba(255,255,255,0.03)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "10px",
                              flexWrap: "wrap",
                              marginBottom: "10px",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: "700", marginBottom: "4px" }}>
                                {match.roundName}
                              </div>
                              <div>
                                <b>Match {match.matchNumber}:</b> {match.teamA} vs {match.teamB}
                              </div>
                              {isMyTeamMatch ? (
                                <div
                                  style={{
                                    marginTop: "6px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                  }}
                                >
                                  Your team is in this match
                                </div>
                              ) : null}
                            </div>

                            <span
                              style={{
                                padding: "6px 10px",
                                borderRadius: "999px",
                                fontSize: "12px",
                                fontWeight: "700",
                                background: isCompleted
                                  ? "rgba(34,197,94,0.15)"
                                  : "rgba(148,163,184,0.16)",
                                color: isCompleted ? "#86efac" : "#cbd5e1",
                                border: isCompleted
                                  ? "1px solid rgba(34,197,94,0.35)"
                                  : "1px solid rgba(148,163,184,0.28)",
                              }}
                            >
                              {status}
                            </span>
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gap: "8px",
                            }}
                          >
                            <div><b>Date:</b> {match.matchDate || "Not scheduled yet"}</div>
                            <div><b>Time:</b> {match.matchTime || "Not scheduled yet"}</div>
                            <div><b>Venue:</b> {match.venue || "Not assigned yet"}</div>

                            {isByeMatch ? (
                              <div><b>Note:</b> This is a BYE match.</div>
                            ) : null}

                            {match.score ? (
                              <div><b>Score:</b> {match.score}</div>
                            ) : (
                              <div><b>Score:</b> Not updated yet</div>
                            )}

                            {match.winner ? (
                              <div
                                style={{
                                  padding: "10px 12px",
                                  borderRadius: "10px",
                                  background: isMyTeamWinner
                                    ? "rgba(34,197,94,0.18)"
                                    : "rgba(34,197,94,0.12)",
                                  border: "1px solid rgba(34,197,94,0.26)",
                                }}
                              >
                                <b>Winner:</b> {match.winner}
                                {isMyTeamWinner ? " (Your Team)" : ""}
                              </div>
                            ) : (
                              <div><b>Winner:</b> Not decided yet</div>
                            )}

                            {match.remarks ? (
                              <div><b>Remarks:</b> {match.remarks}</div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {matchDraw.champion ? (
                    <div
                      style={{
                        marginTop: "16px",
                        borderRadius: "14px",
                        padding: "16px",
                        background: "rgba(250,204,21,0.10)",
                        border: "1px solid rgba(250,204,21,0.28)",
                      }}
                    >
                      <div style={{ fontWeight: "800", marginBottom: "8px" }}>
                        Tournament Result
                      </div>
                      <div><b>Champion:</b> {matchDraw.champion}</div>
                      {matchDraw.runnerUp ? (
                        <div><b>Runner-up:</b> {matchDraw.runnerUp}</div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="sp-empty" style={{ marginTop: 0 }}>
                  Match draw is not available yet.
                </div>
              )
            ) : (
              <div className="sp-empty" style={{ marginTop: 0 }}>
                Match draw will be visible only after your registration is approved and payment is verified.
              </div>
            )}
          </div>
        )}

        {canNewRegister || canResubmitRejected || canEditMembers ? (
          <div className="sp-formCard">
            <h3 className="sp-cardTitle" style={{ marginBottom: 12 }}>
              {canEditMembers
                ? "Edit Team Members"
                : registration?.status === "Rejected"
                ? "Update Team Registration"
                : "Team Registration"}
            </h3>

            <form onSubmit={submit}>
              {!canEditMembers && (
                <div className="sp-formGrid">
                  <div>
                    <label className="sp-label">Team Name</label>
                    <input
                      className="sp-input"
                      value={form.teamName}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, teamName: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="sp-label">Leader Contact Number</label>
                    <input
                      className="sp-input"
                      value={form.contactNumber}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          contactNumber: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
              )}

              <div style={{ marginTop: 14 }}>
                <h4 className="sp-cardTitle" style={{ fontSize: 16 }}>
                  Team Members
                </h4>

                {form.members.map((m, index) => (
                  <div className="sp-formGrid" key={index} style={{ marginTop: 8 }}>
                    <div>
                      <label className="sp-label">Name</label>
                      <input
                        className="sp-input"
                        value={m.name}
                        onChange={(e) => setMember(index, "name", e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="sp-label">IT Number</label>
                      <input
                        className="sp-input"
                        value={m.itNumber}
                        onChange={(e) =>
                          setMember(index, "itNumber", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="sp-label">Contact Number</label>
                      <input
                        className="sp-input"
                        value={m.contactNumber}
                        onChange={(e) =>
                          setMember(index, "contactNumber", e.target.value)
                        }
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                      <button
                        type="button"
                        className="sp-btnDanger"
                        onClick={() => removeMember(index)}
                        disabled={form.members.length <= 1}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <div className="sp-formActions">
                  <button type="button" className="sp-btnOutline" onClick={addMember}>
                    + Add Member
                  </button>
                </div>
              </div>

              <div className="sp-formActions">
                <button type="submit" className="sp-btn" disabled={submitting}>
                  {submitting
                    ? "Submitting..."
                    : canEditMembers
                    ? "Update Team Members"
                    : "Submit Team Registration"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="sp-empty" style={{ marginTop: 12 }}>
            {isClosed
              ? "Registration is closed for this tournament."
              : "Your team registration is already submitted."}
          </div>
        )}
      </div>
    </div>
  );
}