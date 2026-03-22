import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./Tournaments.css";

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      setMsg("");
      const res = await api.get("/api/tournaments/published");
      setTournaments(res.data || []);
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to load published tournaments");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="sp-page">
      <div className="sp-container">
        <div className="sp-head">
          <div>
            <h2 className="sp-title">Published Tournaments</h2>
            <p className="sp-subtitle">
              These tournaments are visible to all users.
            </p>
          </div>

          <button type="button" className="sp-btnDark" onClick={load}>
            Refresh
          </button>
        </div>

        {msg && <p className="sp-error">{msg}</p>}

        {tournaments.length === 0 ? (
          <div className="sp-empty">No published tournaments yet.</div>
        ) : (
          <div className="sp-grid">
            {tournaments.map((t) => (
              <div className="sp-card" key={t._id}>
                <div className="sp-cardTop">
                  <h3 className="sp-cardTitle">{t.title}</h3>
                  <span className="sp-status sp-published">Published</span>
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
                  <Link className="sp-link" to={`/tournaments/${t._id}`}>
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}