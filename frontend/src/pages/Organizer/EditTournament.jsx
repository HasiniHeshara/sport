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

  const [errors, setErrors] = useState({
    sportType: "",
    title: "",
    venue: "",
    registrationDeadline: "",
    startDate: "",
    endDate: "",
    teamLimit: "",
    registrationFee: "",
    rules: "",
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

  const validateSingleField = (name, value, updatedForm = form) => {
    switch (name) {
      case "sportType":
        if (!String(value).trim()) return "Sport Type is required.";
        return "";

      case "title":
        if (!String(value).trim()) return "Title is required.";
        if (String(value).trim().length < 3) return "Title must be at least 3 characters.";
        return "";

      case "venue":
        if (!String(value).trim()) return "Venue is required.";
        if (String(value).trim().length < 3) return "Venue must be at least 3 characters.";
        return "";

      case "teamLimit":
        if (value === "" || value === null) return "Team Limit is required.";
        if (Number(value) < 2) return "Team Limit must be at least 2.";
        return "";

      case "registrationFee":
        if (Number(value || 0) < 0) return "Registration Fee cannot be negative.";
        return "";

      case "registrationDeadline":
        if (!value) return "Registration Deadline is required.";
        if (updatedForm.startDate && new Date(value) >= new Date(updatedForm.startDate)) {
          return "Registration Deadline must be before Start Date.";
        }
        return "";

      case "startDate":
        if (!value) return "Start Date is required.";
        if (updatedForm.endDate && new Date(value) > new Date(updatedForm.endDate)) {
          return "Start Date cannot be after End Date.";
        }
        if (
          updatedForm.registrationDeadline &&
          new Date(updatedForm.registrationDeadline) >= new Date(value)
        ) {
          return "Start Date must be after Registration Deadline.";
        }
        return "";

      case "endDate":
        if (!value) return "End Date is required.";
        if (updatedForm.startDate && new Date(updatedForm.startDate) > new Date(value)) {
          return "End Date must be after Start Date.";
        }
        return "";

      case "rules":
        if (String(value).trim().length > 1000) {
          return "Tournament Rules cannot exceed 1000 characters.";
        }
        return "";

      default:
        return "";
    }
  };

  const validateAllFields = (updatedForm = form) => {
    return {
      sportType: validateSingleField("sportType", updatedForm.sportType, updatedForm),
      title: validateSingleField("title", updatedForm.title, updatedForm),
      venue: validateSingleField("venue", updatedForm.venue, updatedForm),
      registrationDeadline: validateSingleField(
        "registrationDeadline",
        updatedForm.registrationDeadline,
        updatedForm
      ),
      startDate: validateSingleField("startDate", updatedForm.startDate, updatedForm),
      endDate: validateSingleField("endDate", updatedForm.endDate, updatedForm),
      teamLimit: validateSingleField("teamLimit", updatedForm.teamLimit, updatedForm),
      registrationFee: validateSingleField(
        "registrationFee",
        updatedForm.registrationFee,
        updatedForm
      ),
      rules: validateSingleField("rules", updatedForm.rules, updatedForm),
    };
  };

  const onChange = (e) => {
    const { name, value } = e.target;

    let finalValue = value;

    if (name === "registrationFee" || name === "teamLimit") {
      finalValue = value.replace(/[^0-9]/g, "");
    }

    const updatedForm = {
      ...form,
      [name]: finalValue,
    };

    setForm(updatedForm);

    const updatedErrors = {
      ...errors,
      [name]: validateSingleField(name, finalValue, updatedForm),
    };

    if (name === "registrationDeadline" || name === "startDate" || name === "endDate") {
      updatedErrors.registrationDeadline = validateSingleField(
        "registrationDeadline",
        updatedForm.registrationDeadline,
        updatedForm
      );
      updatedErrors.startDate = validateSingleField(
        "startDate",
        updatedForm.startDate,
        updatedForm
      );
      updatedErrors.endDate = validateSingleField("endDate", updatedForm.endDate, updatedForm);
    }

    setErrors(updatedErrors);
  };

  const blockInvalidNumberKeys = (e) => {
    if (["e", "E", "+", "-", "."].includes(e.key)) {
      e.preventDefault();
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!organizerId) {
      setMsg("Please login as organizer first.");
      return;
    }

    const finalErrors = validateAllFields(form);
    setErrors(finalErrors);

    const hasErrors = Object.values(finalErrors).some((error) => error);
    if (hasErrors) {
      setMsg("Please fix the errors below.");
      return;
    }

    try {
      await api.put(`/api/tournaments/${id}`, {
        ...form,
        organizerId,
        teamLimit: Number(form.teamLimit),
        registrationFee: Number(form.registrationFee || 0),
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

          <Link className="sp-link" to="/organizer-dashboard">
            ← Back
          </Link>
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
                />
                {errors.sportType && <p className="sp-fieldError">{errors.sportType}</p>}
              </div>

              <div>
                <label className="sp-label">Title</label>
                <input
                  className="sp-input"
                  name="title"
                  value={form.title}
                  onChange={onChange}
                />
                {errors.title && <p className="sp-fieldError">{errors.title}</p>}
              </div>

              <div>
                <label className="sp-label">Venue</label>
                <input
                  className="sp-input"
                  name="venue"
                  value={form.venue}
                  onChange={onChange}
                />
                {errors.venue && <p className="sp-fieldError">{errors.venue}</p>}
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
                />
                {errors.teamLimit && <p className="sp-fieldError">{errors.teamLimit}</p>}
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
                  onKeyDown={blockInvalidNumberKeys}
                />
                {errors.registrationFee && (
                  <p className="sp-fieldError">{errors.registrationFee}</p>
                )}
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
                  />
                  <span className="sp-dateIcon">📅</span>
                </div>
                {errors.registrationDeadline && (
                  <p className="sp-fieldError">{errors.registrationDeadline}</p>
                )}
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
                  />
                  <span className="sp-dateIcon">📅</span>
                </div>
                {errors.startDate && <p className="sp-fieldError">{errors.startDate}</p>}
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
                  />
                  <span className="sp-dateIcon">📅</span>
                </div>
                {errors.endDate && <p className="sp-fieldError">{errors.endDate}</p>}
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
                {errors.rules && <p className="sp-fieldError">{errors.rules}</p>}
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