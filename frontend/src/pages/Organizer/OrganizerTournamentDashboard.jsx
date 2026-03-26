import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./OrganizerTournamentDashboard.css";
import logoImg from "../../assets/logo.jpg";

export default function OrganizerTournamentDashboard() {
  const [tournaments, setTournaments] = useState([]);
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
      setTournaments(res.data || []);
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to load tournaments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setNotifications(getStoredNotifications());
    load();
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

  const totalTournaments = tournaments.length;
  const publishedCount = tournaments.filter((t) => t.status === "Published").length;
  const draftCount = tournaments.filter((t) => t.status === "Draft").length;
  const closedCount = tournaments.filter((t) => t.status === "Closed").length;

  return (
    <div className="org-page">
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

        {tournaments.length === 0 ? (
          <div className="org-emptyBox">No tournaments yet.</div>
        ) : (
          <div className="org-grid">
            {tournaments.map((t) => {
              const status = String(t.status || "").trim();
              const statusClass = `org-badge org-${status.toLowerCase()}`;

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

                  <div className="org-actions">
                    <Link className="org-linkBtn" to={`/organizer/tournaments/${t._id}/edit`}>
                      Edit
                    </Link>

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