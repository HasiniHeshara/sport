import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../services/api";
import "../Tournaments/Tournaments.css";

const toISO = (v) => {
  if (!v) return "";
  try {
    return new Date(v).toISOString().slice(0, 10);
  } catch {
    return String(v).slice(0, 10);
  }
};

export default function EditTournament() {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const organizerId = user?.id || user?._id;

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    sportType: "",
    title: "",
    venue: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    teamLimit: 2,
    registrationFee: 0,
    status: "Draft",
  });

  const load = async () => {
    try {
      setMsg("");
      setLoading(true);

      const res = await api.get(`/api/tournaments/${id}`);
      const t = res.data;

      setForm({
        sportType: t.sportType || "",
        title: t.title || "",
        venue: t.venue || "",
        startDate: toISO(t.startDate),
        endDate: toISO(t.endDate),
        registrationDeadline: toISO(t.registrationDeadline),
        teamLimit: Number(t.teamLimit || 2),
        registrationFee: Number(t.registrationFee || 0),
        status: t.status || "Draft",
      });
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to load tournament");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [id]);

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!organizerId) {
      setMsg("Please login as organizer first.");
      return;
    }

    try {
      await api.put(`/api/tournaments/${id}`, {
        ...form,
        organizerId,
        teamLimit: Number(form.teamLimit),
        registrationFee: Number(form.registrationFee),
      });

      navigate("/organizer-dashboard");
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to update tournament");
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

  return (
    <div className="sp-page">
      <div className="sp-container">
        <div className="sp-head">
          <div>
            <h2 className="sp-title">Edit Tournament</h2>
            <p className="sp-subtitle">Update details before publishing.</p>
          </div>

          <Link className="sp-link" to="/organizer-dashboard">← Back</Link>
        </div>

        {msg && <p className="sp-error">{msg}</p>}

        <div className="sp-formCard">
          <div style={{ marginBottom: 10 }}>
            <span className={`sp-status sp-${String(form.status).toLowerCase()}`}>
              {form.status}
            </span>
          </div>

          <form onSubmit={submit}>
            <div className="sp-formGrid">
              <div>
                <label className="sp-label">Sport Type</label>
                <input
                  className="sp-input"
                  name="sportType"
                  value={form.sportType}
                  onChange={onChange}
                  required
                />
              </div>

              <div>
                <label className="sp-label">Title</label>
                <input
                  className="sp-input"
                  name="title"
                  value={form.title}
                  onChange={onChange}
                  required
                />
              </div>

              <div>
                <label className="sp-label">Venue</label>
                <input
                  className="sp-input"
                  name="venue"
                  value={form.venue}
                  onChange={onChange}
                  required
                />
              </div>

              <div>
                <label className="sp-label">Team Limit</label>
                <input
                  className="sp-input"
                  name="teamLimit"
                  type="number"
                  min="1"
                  value={form.teamLimit}
                  onChange={onChange}
                  required
                />
              </div>

              <div>
                <label className="sp-label">Registration Fee</label>
                <input
                  className="sp-input"
                  name="registrationFee"
                  type="number"
                  min="0"
                  value={form.registrationFee}
                  onChange={onChange}
                />
              </div>

              <div>
                <label className="sp-label">Registration Deadline</label>
                <div className="sp-dateWrap">
                  <input
                    className="sp-input sp-dateInput"
                    name="registrationDeadline"
                    type="date"
                    value={form.registrationDeadline}
                    onChange={onChange}
                    required
                  />
                  <span className="sp-dateIcon">📅</span>
                </div>
              </div>

              <div>
                <label className="sp-label">Start Date</label>
                <div className="sp-dateWrap">
                  <input
                    className="sp-input sp-dateInput"
                    name="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={onChange}
                    required
                  />
                  <span className="sp-dateIcon">📅</span>
                </div>
              </div>

              <div>
                <label className="sp-label">End Date</label>
                <div className="sp-dateWrap">
                  <input
                    className="sp-input sp-dateInput"
                    name="endDate"
                    type="date"
                    value={form.endDate}
                    onChange={onChange}
                    required
                  />
                  <span className="sp-dateIcon">📅</span>
                </div>
              </div>
            </div>

            <div className="sp-formActions">
              <button className="sp-btn" type="submit">
                Save Changes
              </button>
              <button
                className="sp-btnDark"
                type="button"
                onClick={() => navigate("/organizer-dashboard")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}