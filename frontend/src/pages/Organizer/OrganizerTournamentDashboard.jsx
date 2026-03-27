import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./OrganizerTournamentDashboard.css";
import logoImg from "../../assets/logo.jpg";

export default function OrganizerTournamentDashboard() {
  const [tournaments, setTournaments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const organizerId = user?.id || user?._id;
  const organizerName = user?.name || "Organizer";
  const notificationsKey = `sportix_organizer_notifications_${organizerId || "organizer"}`;

  const formatDate = (v) => String(v || "").slice(0, 10);

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

  const clearNotifications = () => {
    saveNotifications([]);
  };

  const getDaysLeft = (deadline) => {
    if (!deadline) return "N/A";

    const today = new Date();
    const end = new Date(deadline);

    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    if (diff < 0) return "Deadline passed";
    if (diff === 0) return "Ends today";
    if (diff === 1) return "1 day left";
    return `${diff} days left`;
  };

  const buildInsights = (registrations = [], teamLimit = 0) => {
    const pending = registrations.filter((r) => r.status === "Pending").length;
    const approved = registrations.filter((r) => r.status === "Approved").length;
    const rejected = registrations.filter((r) => r.status === "Rejected").length;
    const total = registrations.length;
    const slotsRemaining = Math.max(Number(teamLimit || 0) - approved, 0);

    return {
      total,
      pending,
      approved,
      rejected,
      slotsRemaining,
    };
  };

  const load = async () => {
    try {
      setLoading(true);
      setMsg("");

      if (!organizerId) {
        setMsg("Please login as organizer to view your tournaments.");
        setTournaments([]);
        return;
      }

      const res = await api.get(`/api/tournaments/mine?organizerId=${organizerId}`);
      const baseTournaments = res.data || [];

      const withInsights = await Promise.all(
        baseTournaments.map(async (t) => {
          try {
            const regRes = await api.get(`/api/tournaments/${t._id}/registrations`);
            const registrations = regRes.data || [];

            return {
              ...t,
              insights: buildInsights(registrations, t.teamLimit),
            };
          } catch {
            return {
              ...t,
              insights: {
                total: 0,
                pending: 0,
                approved: 0,
                rejected: 0,
                slotsRemaining: Number(t.teamLimit || 0),
              },
            };
          }
        })
      );

      setTournaments(withInsights);
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to load tournaments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setNotifications(getStoredNotifications());
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doAction = async (id, action) => {
    try {
      setMsg("");
      await api.patch(`/api/tournaments/${id}/${action}`);
      await load();
    } catch (err) {
      setMsg(err.response?.data?.message || `Failed to ${action}`);
    }
  };

  const deleteTournament = async (id) => {
    const ok = window.confirm("Delete this tournament?");
    if (!ok) return;

    try {
      setMsg("");
      await api.delete(`/api/tournaments/${id}`);
      await load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Delete failed");
    }
  };

  const goToBookEquipment = (tournament) => {
    navigate(`/organizer/tournaments/${tournament._id}/book-equipment`, {
      state: { tournament },
    });
  };

  const totalTournaments = tournaments.length;
  const publishedCount = tournaments.filter((t) => t.status === "Published").length;
  const draftCount = tournaments.filter((t) => t.status === "Draft").length;
  const closedCount = tournaments.filter((t) => t.status === "Closed").length;

  return (
    <div className="org-page">
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

      <div className="org-container">
        <div className="org-hero">
          <div className="org-heroText">
            <p className="org-kicker">Sportix Organizer Panel</p>
            <h1>Welcome back, {organizerName}</h1>
            <p>
              Manage your tournaments, review team registrations, and keep track
              of updates from one place.
            </p>
          </div>

          <div className="org-heroActions">
            <button type="button" className="org-btn org-btnGhost" onClick={load}>
              {loading ? "Loading..." : "Refresh"}
            </button>

            <Link className="org-btn org-btnPrimary" to="/organizer/tournaments/new">
              + Create Tournament
            </Link>
          </div>
        </div>

        {msg && <div className="org-alert">{msg}</div>}

        <div className="org-stats">
          <div className="org-statCard">
            <span className="org-statLabel">Total Tournaments</span>
            <h3>{totalTournaments}</h3>
          </div>

          <div className="org-statCard">
            <span className="org-statLabel">Published</span>
            <h3>{publishedCount}</h3>
          </div>

          <div className="org-statCard">
            <span className="org-statLabel">Draft</span>
            <h3>{draftCount}</h3>
          </div>

          <div className="org-statCard">
            <span className="org-statLabel">Closed</span>
            <h3>{closedCount}</h3>
          </div>
        </div>

        <div className="org-sectionCard">
          <div className="org-sectionTop">
            <div>
              <h2>Notifications</h2>
              <p>Latest updates related to your tournaments.</p>
            </div>

            <button
              type="button"
              className="org-btn org-btnOutline"
              onClick={clearNotifications}
            >
              Clear
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="org-emptyBox">No notifications yet.</div>
          ) : (
            <div className="org-notificationList">
              {notifications.map((n) => (
                <div className="org-notificationItem" key={n.id}>
                  <div className="org-dot" />
                  <div>
                    <p>{n.text}</p>
                    <span>{formatDate(n.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="org-sectionTop org-sectionSpacing">
          <div>
            <h2>My Tournaments</h2>
            <p>View and manage all tournaments you created.</p>
          </div>
        </div>

        {tournaments.length === 0 ? (
          <div className="org-emptyBox">No tournaments yet.</div>
        ) : (
          <div className="org-grid">
            {tournaments.map((t) => {
              const status = String(t.status || "").trim();
              const statusClass = `org-badge org-${status.toLowerCase()}`;
              const insights = t.insights || {
                total: 0,
                pending: 0,
                approved: 0,
                rejected: 0,
                slotsRemaining: Number(t.teamLimit || 0),
              };

              return (
                <div className="org-card" key={t._id}>
                  <div className="org-cardTop">
                    <div>
                      <h3>{t.title}</h3>
                      <p className="org-sport">{t.sportType}</p>
                    </div>
                    <span className={statusClass}>{status}</span>
                  </div>

                  <div className="org-infoGrid">
                    <div className="org-infoItem">
                      <span>Venue</span>
                      <strong>{t.venue}</strong>
                    </div>

                    <div className="org-infoItem">
                      <span>Team Limit</span>
                      <strong>{t.teamLimit}</strong>
                    </div>

                    <div className="org-infoItem">
                      <span>Start Date</span>
                      <strong>{formatDate(t.startDate)}</strong>
                    </div>

                    <div className="org-infoItem">
                      <span>End Date</span>
                      <strong>{formatDate(t.endDate)}</strong>
                    </div>

                    <div className="org-infoItem">
                      <span>Deadline</span>
                      <strong>{formatDate(t.registrationDeadline)}</strong>
                    </div>

                    <div className="org-infoItem">
                      <span>Fee</span>
                      <strong>{t.registrationFee}</strong>
                    </div>
                  </div>

                  <div className="org-insightGrid">
                    <div className="org-insightBox">
                      <span>Total Registrations</span>
                      <strong>{insights.total}</strong>
                    </div>

                    <div className="org-insightBox">
                      <span>Pending</span>
                      <strong>{insights.pending}</strong>
                    </div>

                    <div className="org-insightBox">
                      <span>Approved</span>
                      <strong>{insights.approved}</strong>
                    </div>

                    <div className="org-insightBox">
                      <span>Rejected</span>
                      <strong>{insights.rejected}</strong>
                    </div>

                    <div className="org-insightBox">
                      <span>Slots Remaining</span>
                      <strong>{insights.slotsRemaining}</strong>
                    </div>

                    <div className="org-insightBox">
                      <span>Countdown</span>
                      <strong>{getDaysLeft(t.registrationDeadline)}</strong>
                    </div>
                  </div>

                  <div className="org-actions">
                    <Link className="org-linkBtn" to={`/organizer/tournaments/${t._id}/edit`}>
                      Edit
                    </Link>

                    <button
                      type="button"
                      className="org-linkBtn org-linkSecondary"
                      onClick={() => goToBookEquipment(t)}
                    >
                      Book Equipment
                    </button>

                    <Link
                      className="org-linkBtn org-linkSecondary"
                      to={`/organizer/tournaments/${t._id}/registrations`}
                    >
                      Team Registrations
                    </Link>
                  </div>

                  <div className="org-actions org-actionsWrap">
                    <button
                      className="org-btn org-btnOutline"
                      type="button"
                      onClick={() => doAction(t._id, "publish")}
                      disabled={status === "Published" || status === "Closed"}
                    >
                      Publish
                    </button>

                    <button
                      className="org-btn org-btnOutline"
                      type="button"
                      onClick={() => doAction(t._id, "unpublish")}
                      disabled={status === "Draft" || status === "Closed"}
                    >
                      Unpublish
                    </button>

                    <button
                      className="org-btn org-btnDark"
                      type="button"
                      onClick={() => doAction(t._id, "close")}
                      disabled={status === "Closed"}
                    >
                      Close
                    </button>

                    <button
                      className="org-btn org-btnDanger"
                      type="button"
                      onClick={() => deleteTournament(t._id)}
                    >
                      Delete
                    </button>
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