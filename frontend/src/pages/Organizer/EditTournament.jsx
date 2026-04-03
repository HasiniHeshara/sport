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
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    branchName: "",
    paymentInstructions: "",
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
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    branchName: "",
    paymentInstructions: "",
  });

  const hasAnyPaymentField = (data) =>
    !!(
      data.accountHolderName.trim() ||
      data.bankName.trim() ||
      data.accountNumber.trim() ||
      data.branchName.trim() ||
      data.paymentInstructions.trim()
    );

  const validateSingleField = (name, value, updatedForm = form) => {
    switch (name) {
      case "sportType":
        if (!String(value).trim()) return "Sport Type is required";
        return "";

      case "title":
        if (!String(value).trim()) return "Title is required";
        if (String(value).trim().length < 3) return "Title must be at least 3 characters";
        return "";

      case "venue":
        if (!String(value).trim()) return "Venue is required";
        if (String(value).trim().length < 3) return "Venue must be at least 3 characters";
        return "";

      case "teamLimit":
        if (String(value).trim() === "") return "Team Limit is required";
        if (Number(value) < 2) return "Team Limit must be at least 2";
        return "";

      case "registrationFee":
        if (String(value).trim() === "") return "";
        if (Number(value) < 0) return "Registration Fee cannot be negative";
        return "";

      case "registrationDeadline":
        if (!value) return "Registration Deadline is required";
        if (updatedForm.startDate && new Date(value) >= new Date(updatedForm.startDate)) {
          return "Registration Deadline must be before Start Date";
        }
        return "";

      case "startDate":
        if (!value) return "Start Date is required";
        if (updatedForm.endDate && new Date(value) > new Date(updatedForm.endDate)) {
          return "Start Date cannot be after End Date";
        }
        if (
          updatedForm.registrationDeadline &&
          new Date(updatedForm.registrationDeadline) >= new Date(value)
        ) {
          return "Start Date must be after Registration Deadline";
        }
        return "";

      case "endDate":
        if (!value) return "End Date is required";
        if (updatedForm.startDate && new Date(value) < new Date(updatedForm.startDate)) {
          return "End Date cannot be before Start Date";
        }
        return "";

      case "rules":
        if (String(value).trim().length > 1000) {
          return "Tournament Rules cannot exceed 1000 characters";
        }
        return "";

      case "accountHolderName":
        if (hasAnyPaymentField(updatedForm) && !String(value).trim()) {
          return "Account Holder Name is required";
        }
        return "";

      case "bankName":
        if (hasAnyPaymentField(updatedForm) && !String(value).trim()) {
          return "Bank Name is required";
        }
        return "";

      case "accountNumber":
        if (hasAnyPaymentField(updatedForm) && !String(value).trim()) {
          return "Account Number is required";
        }
        return "";

      case "branchName":
        return "";

      case "paymentInstructions":
        if (String(value).trim().length > 1000) {
          return "Payment Instructions cannot exceed 1000 characters";
        }
        return "";

      default:
        return "";
    }
  };

  const validateAllFields = (updatedForm = form) => {
    const newErrors = {};

    Object.keys(errors).forEach((key) => {
      newErrors[key] = validateSingleField(key, updatedForm[key], updatedForm);
    });

    if (
      hasAnyPaymentField(updatedForm) &&
      !updatedForm.accountHolderName.trim()
    ) {
      newErrors.accountHolderName = "Account Holder Name is required";
    }

    if (hasAnyPaymentField(updatedForm) && !updatedForm.bankName.trim()) {
      newErrors.bankName = "Bank Name is required";
    }

    if (hasAnyPaymentField(updatedForm) && !updatedForm.accountNumber.trim()) {
      newErrors.accountNumber = "Account Number is required";
    }

    return newErrors;
  };

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
        accountHolderName: t.accountHolderName || "",
        bankName: t.bankName || "",
        accountNumber: t.accountNumber || "",
        branchName: t.branchName || "",
        paymentInstructions: t.paymentInstructions || "",
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
    const { name, value } = e.target;
    let finalValue = value;

    if (name === "registrationFee" || name === "teamLimit") {
      finalValue = value.replace(/[^0-9]/g, "");
    }

    if (name === "accountNumber") {
      finalValue = value.replace(/[^\d\s-]/g, "");
    }

    const updatedForm = { ...form, [name]: finalValue };
    setForm(updatedForm);

    const newErrors = { ...errors };
    newErrors[name] = validateSingleField(name, finalValue, updatedForm);

    if (["registrationDeadline", "startDate", "endDate"].includes(name)) {
      newErrors.registrationDeadline = validateSingleField(
        "registrationDeadline",
        updatedForm.registrationDeadline,
        updatedForm
      );
      newErrors.startDate = validateSingleField(
        "startDate",
        updatedForm.startDate,
        updatedForm
      );
      newErrors.endDate = validateSingleField(
        "endDate",
        updatedForm.endDate,
        updatedForm
      );
    }

    if (
      ["accountHolderName", "bankName", "accountNumber", "branchName", "paymentInstructions"].includes(name)
    ) {
      newErrors.accountHolderName = validateSingleField(
        "accountHolderName",
        updatedForm.accountHolderName,
        updatedForm
      );
      newErrors.bankName = validateSingleField(
        "bankName",
        updatedForm.bankName,
        updatedForm
      );
      newErrors.accountNumber = validateSingleField(
        "accountNumber",
        updatedForm.accountNumber,
        updatedForm
      );
      newErrors.branchName = validateSingleField(
        "branchName",
        updatedForm.branchName,
        updatedForm
      );
      newErrors.paymentInstructions = validateSingleField(
        "paymentInstructions",
        updatedForm.paymentInstructions,
        updatedForm
      );
    }

    setErrors(newErrors);
  };

  const onBlur = (e) => {
    const { name } = e.target;
    setErrors((prev) => ({
      ...prev,
      [name]: validateSingleField(name, form[name], form),
    }));
  };

  const blockInvalidNumberKeys = (e) => {
    if (["e", "E", "+", "-", "."].includes(e.key)) {
      e.preventDefault();
    }
  };

  const renderError = (field) =>
    errors[field] ? (
      <div style={{ color: "#fca5a5", fontSize: "13px", marginTop: "6px", fontWeight: 600 }}>
        {errors[field]}
      </div>
    ) : null;

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!organizerId) {
      setMsg("Please login as organizer first.");
      return;
    }

    const newErrors = validateAllFields(form);
    setErrors(newErrors);

    const hasError = Object.values(newErrors).some((value) => value);
    if (hasError) {
      setMsg("Please fix the highlighted fields.");
      return;
    }

    try {
      await api.put(`/api/tournaments/${id}`, {
        ...form,
        organizerId,
        teamLimit: Number(form.teamLimit),
        registrationFee: Number(form.registrationFee || 0),
        rules: form.rules.trim(),
        accountHolderName: form.accountHolderName.trim(),
        bankName: form.bankName.trim(),
        accountNumber: form.accountNumber.trim(),
        branchName: form.branchName.trim(),
        paymentInstructions: form.paymentInstructions.trim(),
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
                  onBlur={onBlur}
                  required
                />
                {renderError("sportType")}
              </div>

              <div>
                <label className="sp-label">Title</label>
                <input
                  className="sp-input"
                  name="title"
                  value={form.title}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                />
                {renderError("title")}
              </div>

              <div>
                <label className="sp-label">Venue</label>
                <input
                  className="sp-input"
                  name="venue"
                  value={form.venue}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                />
                {renderError("venue")}
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
                  onBlur={onBlur}
                  onKeyDown={blockInvalidNumberKeys}
                  required
                />
                {renderError("teamLimit")}
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
                  onBlur={onBlur}
                  onKeyDown={blockInvalidNumberKeys}
                />
                {renderError("registrationFee")}
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
                    onBlur={onBlur}
                    required
                  />
                  <span className="sp-dateIcon">📅</span>
                </div>
                {renderError("registrationDeadline")}
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
                    onBlur={onBlur}
                    required
                  />
                  <span className="sp-dateIcon">📅</span>
                </div>
                {renderError("startDate")}
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
                    onBlur={onBlur}
                    required
                  />
                  <span className="sp-dateIcon">📅</span>
                </div>
                {renderError("endDate")}
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label className="sp-label">Tournament Rules</label>
                <textarea
                  className="sp-input"
                  name="rules"
                  value={form.rules}
                  onChange={onChange}
                  onBlur={onBlur}
                  rows="6"
                  placeholder="Update tournament rules here"
                />
                {renderError("rules")}
              </div>

              <div style={{ gridColumn: "1 / -1", marginTop: "4px" }}>
                <details
                  open={
                    !!(
                      form.accountHolderName ||
                      form.bankName ||
                      form.accountNumber ||
                      form.branchName ||
                      form.paymentInstructions
                    )
                  }
                  style={{
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    borderRadius: "16px",
                    background: "rgba(255, 255, 255, 0.03)",
                    padding: "14px 16px",
                  }}
                >
                  <summary
                    style={{
                      cursor: "pointer",
                      fontWeight: 800,
                      color: "#f8fafc",
                      marginBottom: "14px",
                      outline: "none",
                    }}
                  >
                    Payment Information (Optional)
                  </summary>

                  <div className="sp-formGrid" style={{ marginTop: "14px" }}>
                    <div>
                      <label className="sp-label">Account Holder Name</label>
                      <input
                        className="sp-input"
                        name="accountHolderName"
                        value={form.accountHolderName}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder="e.g. Sportix Events"
                      />
                      {renderError("accountHolderName")}
                    </div>

                    <div>
                      <label className="sp-label">Bank Name</label>
                      <input
                        className="sp-input"
                        name="bankName"
                        value={form.bankName}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder="e.g. BOC / Sampath / HNB"
                      />
                      {renderError("bankName")}
                    </div>

                    <div>
                      <label className="sp-label">Account Number</label>
                      <input
                        className="sp-input"
                        name="accountNumber"
                        value={form.accountNumber}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder="e.g. 1234567890"
                      />
                      {renderError("accountNumber")}
                    </div>

                    <div>
                      <label className="sp-label">Branch Name</label>
                      <input
                        className="sp-input"
                        name="branchName"
                        value={form.branchName}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder="e.g. Malabe Branch"
                      />
                      {renderError("branchName")}
                    </div>

                    <div style={{ gridColumn: "1 / -1" }}>
                      <label className="sp-label">Payment Instructions</label>
                      <textarea
                        className="sp-input"
                        name="paymentInstructions"
                        value={form.paymentInstructions}
                        onChange={onChange}
                        onBlur={onBlur}
                        rows="4"
                        placeholder="Update payment instructions here"
                      />
                      {renderError("paymentInstructions")}
                    </div>
                  </div>
                </details>
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