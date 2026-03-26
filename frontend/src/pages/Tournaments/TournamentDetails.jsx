import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
    // Ignore storage failures and keep registration flow uninterrupted.
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
  const [tournament, setTournament] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

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

      const tournamentRes = await api.get(`/api/tournaments/${id}`);
      setTournament(tournamentRes.data);

      if (user?.role === "participant") {
        try {
          const myRes = await api.get(`/api/tournaments/${id}/my-registration`);
          const reg = myRes.data;
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
  }, [id]);

  const isClosed = useMemo(() => {
    if (!tournament) {
      return true;
    }
    return (
      new Date() > new Date(tournament.registrationDeadline) ||
      tournament.status !== "Published"
    );
  }, [tournament]);

  const canResubmitRejected = registration?.status === "Rejected" && !isClosed;
  const canNewRegister = !registration && !isClosed;

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

      if (registration?.status === "Rejected") {
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

        <div className="sp-card">
          <div className="sp-meta">
            <div><b>Sport:</b> {tournament.sportType}</div>
            <div><b>Venue:</b> {tournament.venue}</div>
            <div>
              <b>Start:</b> {formatDate(tournament.startDate)} | <b>End:</b>{" "}
              {formatDate(tournament.endDate)}
            </div>
            <div>
              <b>Registration Deadline:</b>{" "}
              {formatDate(tournament.registrationDeadline)}
            </div>
            <div><b>Team Limit:</b> {tournament.teamLimit}</div>
          </div>
        </div>

        {registration && (
          <div className="sp-formCard" style={{ marginTop: 12 }}>
            <div className="sp-meta">
              <div><b>Current Status:</b> {registration.status}</div>
              {registration.rejectionReason ? (
                <div><b>Rejection Reason:</b> {registration.rejectionReason}</div>
              ) : null}
            </div>
          </div>
        )}

        {canNewRegister || canResubmitRejected ? (
          <div className="sp-formCard">
            <h3 className="sp-cardTitle" style={{ marginBottom: 12 }}>
              {registration?.status === "Rejected"
                ? "Update Team Registration"
                : "Team Registration"}
            </h3>

            <form onSubmit={submit}>
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
                  {submitting ? "Submitting..." : "Submit Team Registration"}
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