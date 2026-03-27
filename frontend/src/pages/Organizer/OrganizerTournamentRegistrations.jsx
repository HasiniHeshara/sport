import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import "./OrganizerTournamentRegistrations.css";

export default function OrganizerTournamentRegistrations() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const formatDate = (v) => String(v || "").slice(0, 10);

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
    if (!reason || !reason.trim()) return;

    try {
      setMsg("");
      await api.patch(`/api/registrations/${registrationId}/reject`, {
        reason: reason.trim(),
      });
      await load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to reject registration");
    }
  };

  const pendingCount = registrations.filter((r) => r.status === "Pending").length;
  const approvedCount = registrations.filter((r) => r.status === "Approved").length;
  const rejectedCount = registrations.filter((r) => r.status === "Rejected").length;

  return (
    <div className="orgreg-page">
      <div className="orgreg-container">
        <div className="orgreg-hero">
          <div>
            <p className="orgreg-kicker">Organizer Tournament Panel</p>
            <h1>Tournament Registrations</h1>
            <p>
              Approve or reject submitted participant teams and review team member
              details in one place.
            </p>
          </div>

          <div className="orgreg-heroActions">
            <button
              type="button"
              className="orgreg-btn orgreg-btnGhost"
              onClick={load}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>

            <Link
              className="orgreg-btn orgreg-btnPrimary"
              to="/organizer-dashboard"
            >
              Back to Organizer Dashboard
            </Link>
          </div>
        </div>

        {msg && <div className="orgreg-alert">{msg}</div>}

        {tournament && (
          <>
            <div className="orgreg-stats">
              <div className="orgreg-statCard">
                <span className="orgreg-statLabel">Pending</span>
                <h3>{pendingCount}</h3>
              </div>

              <div className="orgreg-statCard">
                <span className="orgreg-statLabel">Approved</span>
                <h3>{approvedCount}</h3>
              </div>

              <div className="orgreg-statCard">
                <span className="orgreg-statLabel">Rejected</span>
                <h3>{rejectedCount}</h3>
              </div>

              <div className="orgreg-statCard">
                <span className="orgreg-statLabel">Total Teams</span>
                <h3>{registrations.length}</h3>
              </div>
            </div>

            <div className="orgreg-sectionCard">
              <div className="orgreg-sectionTop">
                <div>
                  <h2>Tournament Information</h2>
                  <p>Overview of the selected tournament.</p>
                </div>
              </div>

              <div className="orgreg-infoGrid">
                <div className="orgreg-infoItem">
                  <span>Tournament</span>
                  <strong>{tournament.title}</strong>
                </div>

                <div className="orgreg-infoItem">
                  <span>Sport</span>
                  <strong>{tournament.sportType}</strong>
                </div>

                <div className="orgreg-infoItem">
                  <span>Venue</span>
                  <strong>{tournament.venue}</strong>
                </div>

                <div className="orgreg-infoItem">
                  <span>Deadline</span>
                  <strong>{formatDate(tournament.registrationDeadline)}</strong>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="orgreg-sectionTop orgreg-sectionSpacing">
          <div>
            <h2>Submitted Teams</h2>
            <p>Manage all team registration requests for this tournament.</p>
          </div>
        </div>

        {loading ? (
          <div className="orgreg-emptyBox">Loading registrations...</div>
        ) : registrations.length === 0 ? (
          <div className="orgreg-emptyBox">No team registrations submitted yet.</div>
        ) : (
          <div className="orgreg-grid">
            {registrations.map((r) => (
              <div className="orgreg-card" key={r._id}>
                <div className="orgreg-cardTop">
                  <div>
                    <h3>{r.teamName}</h3>
                    <p className="orgreg-subText">Submitted team registration</p>
                  </div>

                  <span className={`orgreg-badge orgreg-${String(r.status || "").toLowerCase()}`}>
                    {r.status}
                  </span>
                </div>

                <div className="orgreg-details">
                  <div><b>Leader:</b> {r.leaderId?.name || "-"}</div>
                  <div><b>Leader Email:</b> {r.leaderEmail || "-"}</div>
                  <div><b>Leader Contact:</b> {r.contactNumber || "-"}</div>
                  <div><b>Members:</b> {r.members?.length || 0}</div>
                  {r.rejectionReason ? <div><b>Reason:</b> {r.rejectionReason}</div> : null}
                </div>

                <div className="orgreg-membersBox">
                  <h4>Team Members</h4>
                  <div className="orgreg-memberList">
                    {Array.isArray(r.members) && r.members.map((m, idx) => (
                      <div className="orgreg-memberItem" key={`${r._id}-${idx}`}>
                        <span className="orgreg-memberIndex">{idx + 1}</span>
                        <div>
                          <strong>{m.name}</strong>
                          <p>
                            {m.itNumber}
                            {m.contactNumber ? ` • ${m.contactNumber}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="orgreg-actions">
                  <button
                    type="button"
                    className="orgreg-btn orgreg-btnApprove"
                    onClick={() => approve(r._id)}
                    disabled={r.status === "Approved"}
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    className="orgreg-btn orgreg-btnReject"
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