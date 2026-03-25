import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import "../Tournaments/Tournaments.css";

export default function OrganizerTournamentRegistrations() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setMsg("");

      const [tRes, rRes] = await Promise.all([
        api.get(`/api/tournaments/${id}`),
        api.get(`/api/tournaments/${id}/registrations`),
      ]);

      setTournament(tRes.data);
      setRegistrations(rRes.data || []);
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const approve = async (registrationId) => {
    try {
      setMsg("");
      await api.patch(`/api/registrations/${registrationId}/approve`);
      await load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to approve registration");
    }
  };

  const reject = async (registrationId) => {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason || !reason.trim()) {
      return;
    }

    try {
      setMsg("");
      await api.patch(`/api/registrations/${registrationId}/reject`, { reason: reason.trim() });
      await load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to reject registration");
    }
  };

  return (
    <div className="sp-page">
      <div className="sp-container">
        <div className="sp-head">
          <div>
            <h2 className="sp-title">Tournament Registrations</h2>
            <p className="sp-subtitle">Approve or reject submitted participant teams.</p>
          </div>
          <Link className="sp-link" to="/organizer-dashboard">Back to Organizer Dashboard</Link>
        </div>

        {msg && <p className="sp-error">{msg}</p>}

        {tournament && (
          <div className="sp-card" style={{ marginBottom: 12 }}>
            <div className="sp-meta">
              <div><b>Tournament:</b> {tournament.title}</div>
              <div><b>Sport:</b> {tournament.sportType}</div>
              <div><b>Venue:</b> {tournament.venue}</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="sp-empty">Loading registrations...</div>
        ) : registrations.length === 0 ? (
          <div className="sp-empty">No team registrations submitted yet.</div>
        ) : (
          <div className="sp-grid">
            {registrations.map((r) => (
              <div className="sp-card" key={r._id}>
                <div className="sp-cardTop">
                  <h3 className="sp-cardTitle">{r.teamName}</h3>
                  <span className={`sp-status sp-${String(r.status || "").toLowerCase()}`}>{r.status}</span>
                </div>

                <div className="sp-meta">
                  <div><b>Leader:</b> {r.leaderId?.name || "-"}</div>
                  <div><b>Leader Email:</b> {r.leaderEmail}</div>
                  <div><b>Leader Contact:</b> {r.contactNumber}</div>
                  <div><b>Members:</b> {r.members?.length || 0}</div>
                  {r.rejectionReason ? <div><b>Reason:</b> {r.rejectionReason}</div> : null}
                </div>

                <div className="sp-formCard" style={{ marginTop: 12 }}>
                  <div className="sp-meta">
                    {Array.isArray(r.members) && r.members.map((m, idx) => (
                      <div key={`${r._id}-${idx}`}>
                        {idx + 1}. {m.name} ({m.itNumber}) {m.contactNumber ? `- ${m.contactNumber}` : ""}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sp-actions">
                  <button
                    type="button"
                    className="sp-btn"
                    onClick={() => approve(r._id)}
                    disabled={r.status === "Approved"}
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    className="sp-btnDanger"
                    onClick={() => reject(r._id)}
                    disabled={r.status === "Rejected"}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
