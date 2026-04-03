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
    rules: "",
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
        rules: t.rules || "",
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

  const validateForm = () => {
    if (!organizerId) return "Please login as organizer first.";

    if (!form.sportType.trim()) return "Sport Type is required.";
    if (!form.title.trim()) return "Title is required.";
    if (!form.venue.trim()) return "Venue is required.";

    if (form.title.trim().length < 3) {
      return "Title must be at least 3 characters.";
    }

    if (form.venue.trim().length < 3) {
      return "Venue must be at least 3 characters.";
    }

    if (!form.registrationDeadline) return "Registration Deadline is required.";
    if (!form.startDate) return "Start Date is required.";
    if (!form.endDate) return "End Date is required.";

    if (Number(form.teamLimit) < 2) {
      return "Team Limit must be at least 2.";
    }

    if (Number(form.registrationFee) < 0) {
      return "Registration Fee cannot be negative.";
    }

    const deadline = new Date(form.registrationDeadline);
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);

    if (start > end) {
      return "Start Date cannot be after End Date.";
    }

    if (deadline >= start) {
      return "Registration Deadline must be before Start Date.";
    }

    if (form.rules.trim().length > 1000) {
      return "Tournament Rules cannot exceed 1000 characters.";
    }

    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    const validationError = validateForm();
    if (validationError) {
      setMsg(validationError);
      return;
    }

    try {
      await api.put(`/api/tournaments/${id}`, {
        ...form,
        organizerId,
        teamLimit: Number(form.teamLimit),
        registrationFee: Number(form.registrationFee),
        rules: form.rules.trim(),
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
                  min="2"
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

              <div style={{ gridColumn: "1 / -1" }}>
                <label className="sp-label">Tournament Rules</label>
                <textarea
                  className="sp-input"
                  name="rules"
                  value={form.rules}
                  onChange={onChange}
                  rows="6"
                  placeholder="Update tournament rules here"
                />
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