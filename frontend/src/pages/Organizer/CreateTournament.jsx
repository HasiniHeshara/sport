import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import "../Tournaments/Tournaments.css";

export default function CreateTournament() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const organizerId = user?.id || user?._id;

  const today = new Date().toISOString().split("T")[0];

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
    rules: "",
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;

    if (name === "registrationFee") {
      const onlyNumbers = value.replace(/[^0-9]/g, "");
      setForm((p) => ({ ...p, [name]: onlyNumbers }));
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
  };

  const blockInvalidNumberKeys = (e) => {
    if (["e", "E", "+", "-", "."].includes(e.key)) {
      e.preventDefault();
    }
  };

  const validateForm = () => {
    if (!form.sportType.trim()) return "Sport Type is required";
    if (!form.title.trim()) return "Title is required";
    if (!form.venue.trim()) return "Venue is required";

    if (form.title.trim().length < 3) return "Title must be at least 3 characters";
    if (form.venue.trim().length < 3) return "Venue must be at least 3 characters";

    if (Number(form.teamLimit) < 2) return "Team Limit must be at least 2";
    if (Number(form.registrationFee || 0) < 0) return "Registration Fee cannot be negative";

    if (!form.registrationDeadline) return "Registration Deadline is required";
    if (!form.startDate) return "Start Date is required";
    if (!form.endDate) return "End Date is required";

    if (form.registrationDeadline < today) {
      return "Registration Deadline cannot be a past date";
    }

    if (form.startDate < today) {
      return "Start Date cannot be a past date";
    }

    if (form.endDate < today) {
      return "End Date cannot be a past date";
    }

    if (new Date(form.startDate) > new Date(form.endDate)) {
      return "Start Date cannot be after End Date";
    }

    if (new Date(form.registrationDeadline) >= new Date(form.startDate)) {
      return "Registration Deadline must be before Start Date";
    }

    if (form.rules.trim().length > 1000) {
      return "Tournament Rules cannot exceed 1000 characters";
    }

    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!organizerId) {
      setMsg("Please login as organizer first.");
      return;
    }

    const error = validateForm();
    if (error) {
      setMsg(error);
      return;
    }

    try {
      setLoading(true);

      await api.post("/api/tournaments", {
        ...form,
        organizerId,
        teamLimit: Number(form.teamLimit),
        registrationFee: Number(form.registrationFee || 0),
        rules: form.rules.trim(),
      });

      navigate("/organizer-dashboard");
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to create tournament");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sp-page">
      <div className="sp-container">
        <div className="sp-head">
          <div>
            <h2 className="sp-title">Create Tournament</h2>
            <p className="sp-subtitle">Fill details and save as Draft.</p>
          </div>

          <Link className="sp-link" to="/organizer-dashboard">← Back</Link>
        </div>

        {msg && <p className="sp-error">{msg}</p>}

        <div className="sp-formCard">
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
                  onKeyDown={blockInvalidNumberKeys}
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
                  inputMode="numeric"
                  value={form.registrationFee}
                  onChange={onChange}
                  onKeyDown={blockInvalidNumberKeys}
                />
              </div>

              <div>
                <label className="sp-label">Registration Deadline</label>
                <div className="sp-dateWrap">
                  <input
                    className="sp-input sp-dateInput"
                    name="registrationDeadline"
                    type="date"
                    min={today}
                    value={form.registrationDeadline}
                    onChange={onChange}
                    required
                  />
                  <span className="sp-dateIcon">📅 </span>
                </div>
              </div>

              <div>
                <label className="sp-label">Start Date</label>
                <div className="sp-dateWrap">
                  <input
                    className="sp-input sp-dateInput"
                    name="startDate"
                    type="date"
                    min={today}
                    value={form.startDate}
                    onChange={onChange}
                    required
                  />
                  <span className="sp-dateIcon">📅 </span>
                </div>
              </div>

              <div>
                <label className="sp-label">End Date</label>
                <div className="sp-dateWrap">
                  <input
                    className="sp-input sp-dateInput"
                    name="endDate"
                    type="date"
                    min={today}
                    value={form.endDate}
                    onChange={onChange}
                    required
                  />
                  <span className="sp-dateIcon">📅 </span>
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
                  placeholder={`Enter tournament rules here...
Example:
- Each team must have 5 players
- All players must bring student ID
- Late registrations are not allowed`}
                />
              </div>
            </div>

            <div className="sp-formActions">
              <button className="sp-btn" type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Tournament"}
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