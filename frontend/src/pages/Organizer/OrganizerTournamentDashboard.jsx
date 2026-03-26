import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./OrganizerTournamentDashboard.css";
import logoImg from "../../assets/logo.jpg";

export default function OrganizerTournamentDashboard() {
  const [tournaments, setTournaments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  // uses user stored by your login page
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const organizerId = user?.id || user?._id;
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
      setMsg("");

      if (!organizerId) {
        setMsg("Please login as organizer to view your tournaments.");
        setTournaments([]);
        return;
      }

      // current backend uses query organizerId
      const res = await api.get(`/api/tournaments/mine?organizerId=${organizerId}`);
      setTournaments(res.data || []);
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to load tournaments");
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
            <h2 className="sp-title">Organizer Dashboard</h2>
            <p className="sp-subtitle">
              Create and manage tournaments (Draft / Published / Closed)
            </p>
          </div>

          <Link className="sp-btn" to="/organizer/tournaments/new">
            + Create Tournament
          </Link>
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

        {tournaments.length === 0 ? (
          <div className="sp-empty">No tournaments yet.</div>
        ) : (
          <div className="sp-grid">
            {tournaments.map((t) => {
              const status = String(t.status || "").trim();
              const statusClass = `sp-status sp-${status.toLowerCase()}`;

              return (
                <div className="sp-card" key={t._id}>
                  <div className="sp-cardTop">
                    <h3 className="sp-cardTitle">{t.title}</h3>
                    <span className={statusClass}>{status}</span>
                  </div>

                  <div className="sp-meta">
                    <div><b>Sport:</b> {t.sportType}</div>
                    <div><b>Venue:</b> {t.venue}</div>
                    <div>
                      <b>Start:</b> {String(t.startDate).slice(0, 10)} &nbsp; | &nbsp;
                      <b>End:</b> {String(t.endDate).slice(0, 10)}
                    </div>
                    <div>
                      <b>Deadline:</b> {String(t.registrationDeadline).slice(0, 10)} &nbsp; | &nbsp;
                      <b>Team Limit:</b> {t.teamLimit} &nbsp; | &nbsp;
                      <b>Fee:</b> {t.registrationFee}
                    </div>
                  </div>

                  <div className="sp-actions">
                    <Link className="sp-link" to={`/organizer/tournaments/${t._id}/edit`}>
                      Edit
                    </Link>

                    <Link className="sp-link" to={`/organizer/tournaments/${t._id}/registrations`}>
                      Team Registrations
                    </Link>

                    {status === "Published" && (
                      <button
                        type="button"
                        className="sp-btnOutline"
                        onClick={() =>
                          navigate(`/organizer/tournaments/${t._id}/book-equipment`, {
                            state: { tournament: t },
                          })
                        }
                      >
                        Book Equipment
                      </button>
                    )}

                    <button
                      className="sp-btnOutline"
                      type="button"
                      onClick={() => doAction(t._id, "publish")}
                      disabled={status === "Published" || status === "Closed"}
                    >
                      Publish
                    </button>

                    <button
                      className="sp-btnOutline"
                      type="button"
                      onClick={() => doAction(t._id, "unpublish")}
                      disabled={status === "Draft" || status === "Closed"}
                    >
                      Unpublish
                    </button>

                    <button
                      className="sp-btnDark"
                      type="button"
                      onClick={() => doAction(t._id, "close")}
                      disabled={status === "Closed"}
                    >
                      Close
                    </button>

                    <button
                      className="sp-btnDanger"
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