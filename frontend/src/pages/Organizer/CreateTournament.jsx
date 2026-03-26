import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import "./CreateTournament.css";

export default function CreateTournament() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const organizerId = user?.id || user?._id;

  const [form, setForm] = useState({
    organizerId: organizerId || "",
    sportType: "",
    title: "",
    venue: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    teamLimit: 2,
    registrationFee: 0,
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      await api.post("/api/tournaments", {
        ...form,
        teamLimit: Number(form.teamLimit),
        registrationFee: Number(form.registrationFee),
      });

      navigate("/organizer-dashboard");
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to create tournament");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ct-page">
      <div className="ct-card">
        <Link className="ct-back" to="/organizer-dashboard">
          ← Back
        </Link>

        <h2 className="ct-title">Create Tournament</h2>
        <p className="ct-subtitle">Fill details and save as Draft.</p>

        {msg && <div className="ct-error">{msg}</div>}

        <form className="ct-form" onSubmit={submit}>
          <div>
            <label className="ct-label">Sport Type</label>
            <input
              className="ct-input"
              name="sportType"
              placeholder="e.g., Cricket"
              value={form.sportType}
              onChange={onChange}
              required
            />
          </div>

          <div>
            <label className="ct-label">Title</label>
            <input
              className="ct-input"
              name="title"
              placeholder="Tournament Title"
              value={form.title}
              onChange={onChange}
              required
            />
          </div>

          <div>
            <label className="ct-label">Venue</label>
            <input
              className="ct-input"
              name="venue"
              placeholder="Venue"
              value={form.venue}
              onChange={onChange}
              required
            />
          </div>

          <div>
            <label className="ct-label">Team Limit</label>
            <input
              className="ct-input"
              name="teamLimit"
              type="number"
              min="1"
              value={form.teamLimit}
              onChange={onChange}
              required
            />
          </div>

          <div>
            <label className="ct-label">Registration Fee</label>
            <input
              className="ct-input"
              name="registrationFee"
              type="number"
              min="0"
              value={form.registrationFee}
              onChange={onChange}
            />
          </div>

          <div>
            <label className="ct-label">Registration Deadline</label>
            <div className="ct-dateWrap">
              <input
                className="ct-input ct-dateInput"
                name="registrationDeadline"
                type="date"
                value={form.registrationDeadline}
                onChange={onChange}
                required
              />
              <span className="ct-dateIcon">📅</span>
            </div>
          </div>

          <div>
            <label className="ct-label">Start Date</label>
            <div className="ct-dateWrap">
              <input
                className="ct-input ct-dateInput"
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={onChange}
                required
              />
              <span className="ct-dateIcon">📅</span>
            </div>
          </div>

          <div>
            <label className="ct-label">End Date</label>
            <div className="ct-dateWrap">
              <input
                className="ct-input ct-dateInput"
                name="endDate"
                type="date"
                value={form.endDate}
                onChange={onChange}
                required
              />
              <span className="ct-dateIcon">📅</span>
            </div>
          </div>

          <div className="ct-actions">
            <button className="ct-btnPrimary" type="submit" disabled={loading}>
              {loading ? "Saving..." : "Create Tournament"}
            </button>

            <button
              className="ct-btnSecondary"
              type="button"
              onClick={() => navigate("/organizer-dashboard")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}