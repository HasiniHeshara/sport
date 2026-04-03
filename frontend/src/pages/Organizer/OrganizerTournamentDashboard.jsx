import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./OrganizerTournamentDashboard.css";
import logoImg from "../../assets/logo.jpg";

export default function OrganizerTournamentDashboard() {
  const [tournaments, setTournaments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [msg, setMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  const [selectedTournament, setSelectedTournament] = useState(null);
  const [matchDraw, setMatchDraw] = useState(null);
  const [drawMsg, setDrawMsg] = useState("");

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

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

  const formatDate = (v) => String(v || "").slice(0, 10);

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

  const loadNotifications = async () => {
    try {
      const { data } = await api.get("/api/notifications/my");
      setNotifications(data || []);
    } catch (error) {
      console.error("Failed to load organizer notifications", error);
    }
  };

  const clearNotifications = async () => {
    try {
      const unreadNotifications = notifications.filter((item) => !item.isRead);

      await Promise.all(
        unreadNotifications.map((item) =>
          api.patch(`/api/notifications/${item._id}/read`)
        )
      );

      setNotifications([]);
      setSuccessMsg("Notifications cleared successfully.");
    } catch (error) {
      console.error("Failed to clear organizer notifications", error);
      setMsg("Failed to clear notifications.");
    }
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
    load();
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(""), 3000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  const loadMatchDraw = async (tournamentId) => {
    try {
      setDrawMsg("");
      const res = await api.get(`/api/tournaments/${tournamentId}/match-draw`);
      setMatchDraw(res.data);
    } catch (err) {
      setMatchDraw(null);
      if (err.response?.status !== 404) {
        setDrawMsg(err.response?.data?.message || "Failed to load match draw");
      }
    }
  };

  const createMatchDraw = async (tournamentId) => {
    try {
      setMsg("");
      setSuccessMsg("");
      setDrawMsg("");

      const res = await api.post(`/api/tournaments/${tournamentId}/match-draw`);
      setMatchDraw(res.data.matchDraw);
      setSuccessMsg("Match draw generated successfully.");
    } catch (err) {
      setDrawMsg(err.response?.data?.message || "Failed to generate match draw");
    }
  };

  const openConfirmModal = (title, message, onConfirm) => {
    setConfirmModal({
      open: true,
      title,
      message,
      onConfirm,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      open: false,
      title: "",
      message: "",
      onConfirm: null,
    });
  };

  const doAction = async (id, action) => {
    try {
      setMsg("");
      setSuccessMsg("");

      await api.patch(`/api/tournaments/${id}/${action}`);
      await load();

      if (action === "publish") {
        setSuccessMsg("Tournament published successfully.");
      } else if (action === "unpublish") {
        setSuccessMsg("Tournament unpublished successfully.");
      } else if (action === "close") {
        setSuccessMsg("Tournament closed successfully.");
      }

      if (selectedTournament?._id === id) {
        setSelectedTournament((prev) =>
          prev
            ? {
                ...prev,
                status:
                  action === "publish"
                    ? "Published"
                    : action === "unpublish"
                    ? "Draft"
                    : action === "close"
                    ? "Closed"
                    : prev.status,
              }
            : prev
        );
      }
    } catch (err) {
      setMsg(err.response?.data?.message || `Failed to ${action}`);
    }
  };

  const deleteTournament = async (id) => {
    try {
      setMsg("");
      setSuccessMsg("");

      await api.delete(`/api/tournaments/${id}`);
      setSelectedTournament(null);
      setMatchDraw(null);
      await load();
      setSuccessMsg("Tournament deleted successfully.");
    } catch (err) {
      setMsg(err.response?.data?.message || "Delete failed");
    }
  };

  const totalTournaments = tournaments.length;
  const publishedCount = tournaments.filter((t) => t.status === "Published").length;
  const draftCount = tournaments.filter((t) => t.status === "Draft").length;
  const closedCount = tournaments.filter((t) => t.status === "Closed").length;

  const filteredAndSortedTournaments = useMemo(() => {
    let updated = [...tournaments];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      updated = updated.filter(
        (t) =>
          t.title?.toLowerCase().includes(search) ||
          t.sportType?.toLowerCase().includes(search) ||
          t.venue?.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== "All") {
      updated = updated.filter((t) => t.status === statusFilter);
    }

    if (sortBy === "Newest") {
      updated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "Oldest") {
      updated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "Deadline Nearest") {
      updated.sort(
        (a, b) => new Date(a.registrationDeadline) - new Date(b.registrationDeadline)
      );
    } else if (sortBy === "Title A-Z") {
      updated.sort((a, b) => a.title.localeCompare(b.title));
    }

    return updated;
  }, [tournaments, searchTerm, statusFilter, sortBy]);

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
            <button
              type="button"
              className="org-btn org-btnGhost"
              onClick={() => {
                load();
                loadNotifications();
              }}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>

            <Link className="org-btn org-btnPrimary" to="/organizer/tournaments/new">
              + Create Tournament
            </Link>
          </div>
        </div>

        {msg && <div className="org-alert">{msg}</div>}
        {successMsg && <div className="org-successAlert">{successMsg}</div>}

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
              onClick={() =>
                openConfirmModal(
                  "Clear Notifications",
                  "Are you sure you want to clear all notifications?",
                  async () => {
                    await clearNotifications();
                    closeConfirmModal();
                  }
                )
              }
            >
              Clear
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="org-emptyBox">No notifications yet.</div>
          ) : (
            <div className="org-notificationList">
              {notifications.map((item) => (
                <div
                  className={`org-notificationItem ${item.isRead ? "read" : "unread"}`}
                  key={item._id}
                >
                  <div className="org-dot" />
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.message}</p>
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
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

        <div className="org-sectionCard">
          <div className="org-filterGrid">
            <div>
              <label className="org-filterLabel">Search</label>
              <input
                type="text"
                className="org-filterInput"
                placeholder="Search by title, sport, or venue"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="org-filterLabel">Filter by Status</label>
              <select
                className="org-filterInput"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="org-filterLabel">Sort By</label>
              <select
                className="org-filterInput"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="Newest">Newest</option>
                <option value="Oldest">Oldest</option>
                <option value="Deadline Nearest">Deadline Nearest</option>
                <option value="Title A-Z">Title A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {filteredAndSortedTournaments.length === 0 ? (
          <div className="org-emptyBox">No tournaments found.</div>
        ) : (
          <div className="org-grid">
            {filteredAndSortedTournaments.map((t) => {
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
                    <div className="org-titleWrap">
                      <h3>{t.title}</h3>
                      <p className="org-sport">{t.sportType}</p>
                    </div>
                    <span className={statusClass}>{status}</span>
                  </div>

                  <div className="org-quickInfo">
                    <div className="org-quickInfoItem">
                      <span>Venue</span>
                      <strong>{t.venue}</strong>
                    </div>

                    <div className="org-quickInfoItem">
                      <span>Deadline</span>
                      <strong>{formatDate(t.registrationDeadline)}</strong>
                    </div>

                    <div className="org-quickInfoItem">
                      <span>Team Limit</span>
                      <strong>{t.teamLimit}</strong>
                    </div>

                    <div className="org-quickInfoItem">
                      <span>Total Registrations</span>
                      <strong>{insights.total}</strong>
                    </div>
                  </div>

                  <div className="org-cardFooter">
                    <button
                      type="button"
                      className="org-linkBtn org-btnView"
                      onClick={() => {
                        setSelectedTournament(t);
                        loadMatchDraw(t._id);
                      }}
                    >
                      View Details
                    </button>

                    <Link className="org-linkBtn org-btnEdit" to={`/organizer/tournaments/${t._id}/edit`}>
                      Edit
                    </Link>

                    <Link
                      className="org-linkBtn org-linkSecondary"
                      to={`/organizer/tournaments/${t._id}/registrations`}
                    >
                      Team Registrations
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedTournament && (
        <div className="org-modalOverlay" onClick={() => setSelectedTournament(null)}>
          <div className="org-modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="org-modalTop">
              <div>
                <h2>{selectedTournament.title}</h2>
                <p>{selectedTournament.sportType}</p>
              </div>
              <button
                type="button"
                className="org-btn org-btnDanger"
                onClick={() => {
                  setSelectedTournament(null);
                  setMatchDraw(null);
                  setDrawMsg("");
                }}
              >
                Close
              </button>
            </div>

            <div className="org-cardSection">
              <div className="org-sectionLabel">Tournament Info</div>
              <div className="org-infoGrid">
                <div className="org-infoItem">
                  <span>Venue</span>
                  <strong>{selectedTournament.venue}</strong>
                </div>

                <div className="org-infoItem">
                  <span>Status</span>
                  <strong>{selectedTournament.status}</strong>
                </div>

                <div className="org-infoItem">
                  <span>Start Date</span>
                  <strong>{formatDate(selectedTournament.startDate)}</strong>
                </div>

                <div className="org-infoItem">
                  <span>End Date</span>
                  <strong>{formatDate(selectedTournament.endDate)}</strong>
                </div>

                <div className="org-infoItem">
                  <span>Registration Deadline</span>
                  <strong>{formatDate(selectedTournament.registrationDeadline)}</strong>
                </div>

                <div className="org-infoItem">
                  <span>Registration Fee</span>
                  <strong>{selectedTournament.registrationFee}</strong>
                </div>

                <div className="org-infoItem">
                  <span>Team Limit</span>
                  <strong>{selectedTournament.teamLimit}</strong>
                </div>

                <div className="org-infoItem">
                  <span>Countdown</span>
                  <strong>{getDaysLeft(selectedTournament.registrationDeadline)}</strong>
                </div>
              </div>
            </div>

            <div className="org-cardSection">
              <div className="org-sectionLabel">Registration Insights</div>
              <div className="org-insightGrid">
                <div className="org-insightBox">
                  <span>Total Registrations</span>
                  <strong>{selectedTournament.insights?.total || 0}</strong>
                </div>

                <div className="org-insightBox">
                  <span>Pending</span>
                  <strong>{selectedTournament.insights?.pending || 0}</strong>
                </div>

                <div className="org-insightBox">
                  <span>Approved</span>
                  <strong>{selectedTournament.insights?.approved || 0}</strong>
                </div>

                <div className="org-insightBox">
                  <span>Rejected</span>
                  <strong>{selectedTournament.insights?.rejected || 0}</strong>
                </div>

                <div className="org-insightBox">
                  <span>Slots Remaining</span>
                  <strong>{selectedTournament.insights?.slotsRemaining || 0}</strong>
                </div>
              </div>
            </div>

            <div className="org-cardSection">
              <div className="org-sectionLabel">Tournament Rules</div>
              {selectedTournament.rules?.trim() ? (
                <div className="org-rulesBox">{selectedTournament.rules}</div>
              ) : (
                <div className="org-emptyBox" style={{ marginTop: "10px" }}>
                  No rules added for this tournament.
                </div>
              )}
            </div>

            <div className="org-cardSection">
              <div className="org-sectionLabel">Management Actions</div>
              <div className="org-actions org-actionsPrimary">
                <button
                  type="button"
                  className="org-linkBtn org-btnView"
                  onClick={() => createMatchDraw(selectedTournament._id)}
                >
                  Create Match Draw
                </button>

                <Link
                  className="org-linkBtn org-btnEdit"
                  to={`/organizer/tournaments/${selectedTournament._id}/edit`}
                >
                  Edit
                </Link>

                <Link
                  className="org-linkBtn org-linkSecondary"
                  to={`/organizer/tournaments/${selectedTournament._id}/registrations`}
                >
                  Team Registrations
                </Link>
              </div>
            </div>

            <div className="org-cardSection">
              <div className="org-sectionLabel">Match Draw</div>

              {drawMsg && <div className="org-alert">{drawMsg}</div>}

              {matchDraw?.matches?.length > 0 ? (
                <div className="org-drawList">
                  {matchDraw.matches.map((match) => (
                    <div className="org-drawItem" key={match.matchNumber}>
                      <span className="org-drawRound">{match.roundName}</span>
                      <strong>
                        Match {match.matchNumber}: {match.teamA} vs {match.teamB}
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="org-emptyBox" style={{ marginTop: "10px" }}>
                  No match draw created yet.
                </div>
              )}
            </div>

            <div className="org-cardSection">
              <div className="org-sectionLabel">Status Actions</div>
              <div className="org-actions org-actionsWrap">
                <button
                  className="org-btn org-btnOutline"
                  type="button"
                  onClick={() =>
                    openConfirmModal(
                      "Publish Tournament",
                      "Are you sure you want to publish this tournament?",
                      () => {
                        doAction(selectedTournament._id, "publish");
                        closeConfirmModal();
                      }
                    )
                  }
                  disabled={
                    selectedTournament.status === "Published" ||
                    selectedTournament.status === "Closed"
                  }
                >
                  Publish
                </button>

                <button
                  className="org-btn org-btnOutline"
                  type="button"
                  onClick={() =>
                    openConfirmModal(
                      "Unpublish Tournament",
                      "Are you sure you want to unpublish this tournament?",
                      () => {
                        doAction(selectedTournament._id, "unpublish");
                        closeConfirmModal();
                      }
                    )
                  }
                  disabled={
                    selectedTournament.status === "Draft" ||
                    selectedTournament.status === "Closed"
                  }
                >
                  Unpublish
                </button>

                <button
                  className="org-btn org-btnDark"
                  type="button"
                  onClick={() =>
                    openConfirmModal(
                      "Close Tournament",
                      "Are you sure you want to close this tournament?",
                      () => {
                        doAction(selectedTournament._id, "close");
                        closeConfirmModal();
                      }
                    )
                  }
                  disabled={selectedTournament.status === "Closed"}
                >
                  Close
                </button>

                <button
                  className="org-btn org-btnDanger"
                  type="button"
                  onClick={() =>
                    openConfirmModal(
                      "Delete Tournament",
                      "Are you sure you want to delete this tournament? This action cannot be undone.",
                      () => {
                        deleteTournament(selectedTournament._id);
                        closeConfirmModal();
                      }
                    )
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmModal.open && (
        <div className="org-modalOverlay" onClick={closeConfirmModal}>
          <div className="org-confirmCard" onClick={(e) => e.stopPropagation()}>
            <h3>{confirmModal.title}</h3>
            <p>{confirmModal.message}</p>

            <div className="org-confirmActions">
              <button
                type="button"
                className="org-btn org-btnOutline"
                onClick={closeConfirmModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="org-btn org-btnPrimary"
                onClick={confirmModal.onConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}