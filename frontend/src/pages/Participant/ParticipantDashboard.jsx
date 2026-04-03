import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../Tournaments/Tournaments.css";
import logoImg from "../../assets/logo.jpg";

const formatDate = (v) => String(v || "").slice(0, 10);
const toStatusClass = (s = "") => `sp-status sp-${String(s).toLowerCase()}`;

export default function ParticipantDashboard() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

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
      if (!r?._id) return;

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
        setPayments([]);
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

      try {
        const pRes = await api.get("/api/payments/my");
        const nextPayments = pRes.data || [];
        setPayments(nextPayments);
      } catch (paymentErr) {
        console.error("Failed to load payments:", paymentErr);
        setPayments([]);
      }
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

  const paymentByRegistration = useMemo(() => {
    const map = new Map();
    (payments || []).forEach((p) => {
      if (p?.registrationId) {
        map.set(String(p.registrationId), p);
      }
    });
    return map;
  }, [payments]);

  const isClosed = (t) => {
    const deadlinePassed = new Date() > new Date(t.registrationDeadline);
    return deadlinePassed || t.status !== "Published";
  };

  const clearNotifications = () => {
    saveNotifications([]);
  };

  const handlePayNow = (tournament, registration) => {
    navigate("/payment-options", {
      state: {
        tournamentId: tournament?._id || registration?.tournamentId?._id || "",
        tournamentTitle:
          tournament?.title || registration?.tournamentId?.title || "Tournament",
        sportType:
          tournament?.sportType || registration?.tournamentId?.sportType || "-",
        venue:
          tournament?.venue || registration?.tournamentId?.venue || "-",
        teamName: registration?.teamName || "My Team",
        registrationId: registration?._id || "",
        participantName: user?.name || user?.fullName || "Participant",
        participantEmail: user?.email || "",
        amount:
          tournament?.registrationFee ||
          registration?.tournamentId?.registrationFee ||
          1500,
        status: registration?.status || "Approved",
      },
    });
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
          <Link to="/" className="nav-link active">Home</Link>
          <Link to="/tournaments" className="nav-link">Tournaments</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
          <Link to="/profile" className="nav-link">Profile</Link>
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
            <button type="button" className="sp-btnOutline" onClick={clearNotifications}>
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
          <div className="sp-empty">No published tournaments available right now.</div>
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
                    <div><b>Sport:</b> {t.sportType}</div>
                    <div><b>Venue:</b> {t.venue}</div>
                    <div>
                      <b>Start:</b> {formatDate(t.startDate)} | <b>End:</b> {formatDate(t.endDate)}
                    </div>
                    <div>
                      <b>Deadline:</b> {formatDate(t.registrationDeadline)} | <b>Team Limit:</b> {t.teamLimit}
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
                        onClick={() => handlePayNow(t, reg)}
                      >
                        Pay Now
                      </button>
                    )}

                    {reg?.status === "Approved" && (
                      <button
                        type="button"
                        className="pay-now-btn"
                        onClick={() => {
                          if (!t?._id) {
                            alert("Tournament ID not found");
                            return;
                          }
                          navigate(`/tournament-chat/${t._id}`);
                        }}
                      >
                        Chat with organizer
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
              const payment = paymentByRegistration.get(String(r._id));

              return (
                <div className="sp-card" key={r._id}>
                  <div className="sp-cardTop">
                    <h3 className="sp-cardTitle">{t.title || "Tournament"}</h3>
                    <span className={toStatusClass(r.status)}>{r.status}</span>
                  </div>

                  <div className="sp-meta">
                    <div><b>Team:</b> {r.teamName}</div>
                    <div><b>Sport:</b> {t.sportType || "-"}</div>
                    <div><b>Submitted:</b> {formatDate(r.createdAt)}</div>
                    {payment && (
                      <div>
                        <b>Payment Status:</b> {payment.status}
                      </div>
                    )}
                    {r.rejectionReason ? (
                      <div><b>Reason:</b> {r.rejectionReason}</div>
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
                        onClick={() => handlePayNow(t, r)}
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
      </div>
    </div>
  );
}