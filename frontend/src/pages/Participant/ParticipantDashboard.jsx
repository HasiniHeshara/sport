import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../Tournaments/Tournaments.css";
import "./ParticipantDashboard.css";
import logoImg from "../../assets/logo.jpg";

const formatDate = (v) => String(v || "").slice(0, 10);
const toStatusClass = (s = "") => `sp-status sp-${String(s).toLowerCase()}`;

export default function ParticipantDashboard() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState(null);
  const [editForm, setEditForm] = useState({ members: [] });
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const userId = user?.id || user?._id || "guest";
  const notificationsKey = `sportix_notifications_${userId}`;
  const statusKey = `sportix_registration_statuses_${userId}`;

  const getStoredNotifications = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(notificationsKey) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveNotifications = (items) => {
    localStorage.setItem(notificationsKey, JSON.stringify(items));
    setNotifications(items);
  };

  const pushNotification = (text) => {
    const next = [
      {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        text,
        createdAt: new Date().toISOString(),
      },
      ...getStoredNotifications(),
    ].slice(0, 20);
    saveNotifications(next);
  };

  const pushOrganizerNotification = (registration, text) => {
    const organizerId =
      registration?.tournamentId?.organizerId?._id ||
      registration?.tournamentId?.organizerId ||
      "organizer";

    const key = `sportix_organizer_notifications_${organizerId}`;

    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      const existing = Array.isArray(parsed) ? parsed : [];
      const next = [
        {
          id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
          text,
          createdAt: new Date().toISOString(),
          tournamentId: registration?.tournamentId?._id || "",
        },
        ...existing,
      ].slice(0, 20);

      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Ignore notification storage failures to avoid blocking core flow.
    }
  };

  const saveCurrentStatuses = (items) => {
    const map = {};
    (items || []).forEach((r) => {
      if (r?._id) {
        map[r._id] = String(r.status || "");
      }
    });
    localStorage.setItem(statusKey, JSON.stringify(map));
  };

  const notifyStatusChanges = (items) => {
    let previous = {};
    try {
      previous = JSON.parse(localStorage.getItem(statusKey) || "{}");
    } catch {
      previous = {};
    }

    if (!previous || Object.keys(previous).length === 0) {
      saveCurrentStatuses(items);
      return;
    }

    (items || []).forEach((r) => {
      if (!r?._id) {
        return;
      }

      const prevStatus = previous[r._id];
      const nextStatus = String(r.status || "");
      if (prevStatus && prevStatus !== nextStatus) {
        const tournamentName = r?.tournamentId?.title || "a tournament";
        pushNotification(
          `Registration for ${tournamentName} changed: ${prevStatus} -> ${nextStatus}`
        );
      }
    });

    saveCurrentStatuses(items);
  };

  const load = async () => {
    try {
      setLoading(true);
      setMsg("");

      if (user?.role !== "participant") {
        setMsg("Please login as a participant to access this dashboard.");
        setTournaments([]);
        setRegistrations([]);
        return;
      }

      const [tRes, rRes] = await Promise.all([
        api.get("/api/tournaments/published"),
        api.get("/api/registrations/my"),
      ]);

      const nextTournaments = tRes.data || [];
      const nextRegistrations = rRes.data || [];

      setTournaments(nextTournaments);
      setRegistrations(nextRegistrations);
      notifyStatusChanges(nextRegistrations);
    } catch (err) {
      setMsg(
        err.response?.data?.message || "Failed to load participant dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setNotifications(getStoredNotifications());
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registrationByTournament = useMemo(() => {
    const map = new Map();
    (registrations || []).forEach((r) => {
      const tid = r?.tournamentId?._id || r?.tournamentId;
      if (tid) {
        map.set(String(tid), r);
      }
    });
    return map;
  }, [registrations]);

  const isClosed = (t) => {
    const deadlinePassed = new Date() > new Date(t.registrationDeadline);
    return deadlinePassed || t.status !== "Published";
  };

  const clearNotifications = () => {
    saveNotifications([]);
  };

  const canEditMembers = (reg) => {
    if (!reg) return false;
    if (!["Pending", "Approved"].includes(String(reg.status || ""))) return false;
    const t = reg.tournamentId || {};
    const editDeadline = reg.editDeadline || t.registrationDeadline;
    if (new Date() > new Date(editDeadline)) return false;
    return true;
  };

  const canDeleteTeam = (reg) => {
    if (!reg) return false;
    if (!["Pending", "Approved"].includes(String(reg.status || ""))) return false;
    const t = reg.tournamentId || {};
    const deleteDeadline = reg.deleteDeadline || t.registrationDeadline;
    if (new Date() > new Date(deleteDeadline)) return false;
    return true;
  };

  const openEditModal = (reg) => {
    setEditingRegistration(reg);
    setEditForm({
      members: (reg.members || []).map((m) => ({ ...m })),
    });
  };

  const closeEditModal = () => {
    setEditingRegistration(null);
    setEditForm({ members: [] });
  };

  const handleEditMemberChange = (index, field, value) => {
    setEditForm((prev) => {
      const members = [...prev.members];
      members[index] = { ...members[index], [field]: value };
      return { ...prev, members };
    });
  };

  const submitMembersEdit = async () => {
    if (!editingRegistration) return;
    setEditSubmitting(true);
    try {
      await api.put(`/api/registrations/${editingRegistration._id}/edit-members`, {
        members: editForm.members,
      });
      pushNotification(
        `Team members updated for ${editingRegistration.tournamentId?.title || "tournament"}.`
      );
      pushOrganizerNotification(
        editingRegistration,
        `Team members were updated by the leader for ${editingRegistration.tournamentId?.title || "tournament"}.`
      );
      closeEditModal();
      await load();
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to submit member edits"
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const submitDeleteTeam = async () => {
    if (!deleteConfirmation) return;
    setDeleteSubmitting(true);
    try {
      await api.delete(`/api/registrations/${deleteConfirmation._id}`);
      pushNotification(
        `Team deleted for ${deleteConfirmation.tournamentId?.title || "tournament"}.`
      );
      pushOrganizerNotification(
        deleteConfirmation,
        `A team was deleted by the leader for ${deleteConfirmation.tournamentId?.title || "tournament"}.`
      );
      setDeleteConfirmation(null);
      await load();
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to delete team"
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="sp-page">
      <header className="home-nav">
        <div className="brand" onClick={() => navigate("/")}>
          <img src={logoImg} alt="Sportix Logo" className="brand-logo" />
          <div className="brand-text">
            <h3>Sportix</h3>
            <p>Sports Tournament Platform</p>
          </div>
        </div>

        <nav className="nav-links">
          <Link to="/" className="nav-link active">
            Home
          </Link>
          <Link to="/tournaments" className="nav-link">
            Tournaments
          </Link>
          <Link to="/about" className="nav-link">
            About
          </Link>
          <Link to="/contact" className="nav-link">
            Contact
          </Link>
          <Link to="/profile" className="nav-link">
            Profile
          </Link>
        </nav>
      </header>

      <div className="sp-container">
        <div className="sp-head">
          <div>
            <h2 className="sp-title">Participant Dashboard</h2>
            <p className="sp-subtitle">
              Browse tournaments and submit your team registration.
            </p>
          </div>

          <button type="button" className="sp-btnDark" onClick={load}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {msg && <p className="sp-error">{msg}</p>}

        <div className="sp-formCard" style={{ marginBottom: 14 }}>
          <div className="sp-cardTop">
            <h3 className="sp-cardTitle">Notifications</h3>
            <button
              type="button"
              className="sp-btnOutline"
              onClick={clearNotifications}
            >
              Clear
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="sp-empty" style={{ marginTop: 10 }}>
              No notifications yet.
            </div>
          ) : (
            <div className="sp-meta" style={{ marginTop: 10 }}>
              {notifications.map((n) => (
                <div key={n.id}>
                  <b>{formatDate(n.createdAt)}:</b> {n.text}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sp-head" style={{ marginTop: 8 }}>
          <div>
            <h3 className="sp-title" style={{ fontSize: 22 }}>
              Available Tournaments
            </h3>
          </div>
        </div>

        {tournaments.length === 0 ? (
          <div className="sp-empty">
            No published tournaments available right now.
          </div>
        ) : (
          <div className="sp-grid">
            {tournaments.map((t) => {
              const reg = registrationByTournament.get(String(t._id));
              const closed = isClosed(t);

              let actionLabel = "Register Team";
              let actionDisabled = false;

              if (closed) {
                actionLabel = "Registration Closed";
                actionDisabled = true;
              } else if (reg?.status === "Pending") {
                actionLabel = "Already Registered (Pending)";
              } else if (reg?.status === "Approved") {
                actionLabel = "Already Registered (Approved)";
              } else if (reg?.status === "Rejected") {
                actionLabel = "Update & Resubmit Team";
              }

              return (
                <div className="sp-card" key={t._id}>
                  <div className="sp-cardTop">
                    <h3 className="sp-cardTitle">{t.title}</h3>
                    <span className="sp-status sp-published">Published</span>
                  </div>

                  <div className="sp-meta">
                    <div>
                      <b>Sport:</b> {t.sportType}
                    </div>
                    <div>
                      <b>Venue:</b> {t.venue}
                    </div>
                    <div>
                      <b>Start:</b> {formatDate(t.startDate)} | <b>End:</b>{" "}
                      {formatDate(t.endDate)}
                    </div>
                    <div>
                      <b>Deadline:</b> {formatDate(t.registrationDeadline)} |{" "}
                      <b>Team Limit:</b> {t.teamLimit}
                    </div>
                    {reg && (
                      <div>
                        <b>My Status:</b> <span>{reg.status}</span>
                      </div>
                    )}
                  </div>

                  <div className="sp-actions">
                    <button
                      type="button"
                      className="sp-btn"
                      disabled={actionDisabled}
                      onClick={() => navigate(`/tournaments/${t._id}`)}
                    >
                      {actionLabel}
                    </button>

                    {reg?.status === "Approved" && (
                      <button
                        type="button"
                        className="pay-now-btn"
                        onClick={() => navigate("/my-registrations")}
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="sp-head" style={{ marginTop: 18 }}>
          <div>
            <h3 className="sp-title" style={{ fontSize: 22 }}>
              My Tournament Registrations
            </h3>
          </div>
        </div>

        {registrations.length === 0 ? (
          <div className="sp-empty">
            You have not submitted any team registrations yet.
          </div>
        ) : (
          <div className="sp-grid">
            {registrations.map((r) => {
              const t = r.tournamentId || {};
              const closed =
                new Date() > new Date(t.registrationDeadline) ||
                t.status !== "Published";

              return (
                <div className="sp-card" key={r._id}>
                  <div className="sp-cardTop">
                    <h3 className="sp-cardTitle">{t.title || "Tournament"}</h3>
                    <span className={toStatusClass(r.status)}>{r.status}</span>
                  </div>

                  <div className="sp-meta">
                    <div>
                      <b>Team:</b> {r.teamName}
                    </div>
                    <div>
                      <b>Sport:</b> {t.sportType || "-"}
                    </div>
                    <div>
                      <b>Submitted:</b> {formatDate(r.createdAt)}
                    </div>
                    {r.rejectionReason ? (
                      <div>
                        <b>Reason:</b> {r.rejectionReason}
                      </div>
                    ) : null}
                    {r.members && r.members.length > 0 ? (
                      <div className="team-members-approved">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <b style={{ color: "#e5e7eb", display: "block", marginTop: "10px" }}>
                            Team Members ({r.members.length}):
                          </b>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {canEditMembers(r) && (
                              <button
                                type="button"
                                className="sp-btn"
                                style={{ padding: "6px 10px", fontSize: "12px" }}
                                onClick={() => openEditModal(r)}
                              >
                                Edit Members
                              </button>
                            )}
                            {canDeleteTeam(r) && (
                              <button
                                type="button"
                                className="sp-btnDanger"
                                style={{ padding: "6px 10px", fontSize: "12px" }}
                                onClick={() => setDeleteConfirmation(r)}
                              >
                                Delete Team
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="team-members-list">
                          {r.members.map((member, idx) => (
                            <div key={idx} className="team-member-item">
                              <div>
                                <b>{idx + 1}. {member.name}</b>
                              </div>
                              <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "2px" }}>
                                IT #: {member.itNumber}
                              </div>
                              {member.contactNumber && (
                                <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "2px" }}>
                                  Ph: {member.contactNumber}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="sp-actions">
                    <button
                      type="button"
                      className="sp-btn"
                      onClick={() =>
                        navigate(`/tournaments/${t._id || r.tournamentId}`)
                      }
                    >
                      {r.status === "Rejected" && !closed
                        ? "Update & Resubmit"
                        : "View Registration"}
                    </button>

                    {r.status === "Approved" && (
                      <button
                        type="button"
                        className="pay-now-btn"
                        onClick={() => navigate("/my-registrations")}
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Members Modal */}
        {editingRegistration && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="sp-cardTitle" style={{ margin: 0 }}>
                  Edit Team Members
                </h3>
                <button
                  type="button"
                  className="sp-btnOutline"
                  style={{ padding: "6px 10px", fontSize: "12px" }}
                  onClick={closeEditModal}
                >
                  Close
                </button>
              </div>

              <div className="modal-body">
                <p style={{ fontSize: "12px", color: "#cbd5e1", margin: "0 0 12px" }}>
                  <b style={{ color: "#e5e7eb" }}>Note:</b> You can edit members before the event deadline.
                </p>

                {editForm.members.map((member, idx) => (
                  <div key={idx} className="sp-formGrid" style={{ marginTop: idx === 0 ? 0 : 12 }}>
                    <div>
                      <label className="sp-label" style={{ fontSize: "12px" }}>Name</label>
                      <input
                        className="sp-input"
                        value={member.name}
                        onChange={(e) => handleEditMemberChange(idx, "name", e.target.value)}
                        style={{ fontSize: "13px" }}
                      />
                    </div>
                    <div>
                      <label className="sp-label" style={{ fontSize: "12px" }}>IT Number</label>
                      <input
                        className="sp-input"
                        value={member.itNumber}
                        onChange={(e) => handleEditMemberChange(idx, "itNumber", e.target.value)}
                        style={{ fontSize: "13px" }}
                      />
                    </div>
                    <div>
                      <label className="sp-label" style={{ fontSize: "12px" }}>Contact Number</label>
                      <input
                        className="sp-input"
                        value={member.contactNumber || ""}
                        onChange={(e) => handleEditMemberChange(idx, "contactNumber", e.target.value)}
                        style={{ fontSize: "13px" }}
                      />
                    </div>
                  </div>
                ))}

                <div className="sp-formActions">
                  <button
                    type="button"
                    className="sp-btn"
                    onClick={submitMembersEdit}
                    disabled={editSubmitting}
                  >
                    {editSubmitting ? "Submitting..." : "Submit Changes"}
                  </button>
                  <button
                    type="button"
                    className="sp-btnOutline"
                    onClick={closeEditModal}
                    disabled={editSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirmation && (
          <div className="modal-overlay" onClick={() => setDeleteConfirmation(null)}>
            <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: "0 0 12px", color: "#e5e7eb", fontSize: "16px" }}>
                Are you want to delete team?
              </h3>
              <p style={{ margin: "0 0 12px", color: "#cbd5e1", fontSize: "13px" }}>
                Your payment will not be refunded.
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="sp-btnOutline"
                  onClick={() => setDeleteConfirmation(null)}
                  disabled={deleteSubmitting}
                >
                  Stay
                </button>
                <button
                  type="button"
                  className="sp-btnDanger"
                  onClick={submitDeleteTeam}
                  disabled={deleteSubmitting}
                >
                  {deleteSubmitting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}