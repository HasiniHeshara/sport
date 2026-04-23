import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./PaymentOptions.css";

export default function PaymentOptions() {
  const navigate = useNavigate();
  const location = useLocation();
  const paymentData = useMemo(() => location.state || {}, [location.state]);

  const [slipFile, setSlipFile] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isVerified = paymentData.paymentStatus === "Verified";
  const isRejected = paymentData.paymentStatus === "Rejected";

  const validateSlipForm = () => {
    const newErrors = {};

    if (!slipFile) {
      newErrors.slipFile = "Payment slip is required.";
    } else {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ];

      if (!allowedTypes.includes(slipFile.type)) {
        newErrors.slipFile = "Only JPG, PNG, and PDF files are allowed.";
      }

      if (slipFile.size > 5 * 1024 * 1024) {
        newErrors.slipFile = "File size must be less than 5MB.";
      }
    }

    return newErrors;
  };

  const handleSubmitSlip = async (e) => {
    e.preventDefault();

    const validationErrors = validateSlipForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    try {
      setLoading(true);
      setSuccessMsg("");

      const formData = new FormData();
      formData.append("registrationId", paymentData.registrationId);
      formData.append("tournamentId", paymentData.tournamentId);
      formData.append("tournamentTitle", paymentData.tournamentTitle);
      formData.append("teamName", paymentData.teamName);
      formData.append("amount", paymentData.amount);
      formData.append("participantName", paymentData.participantName);
      formData.append("participantEmail", paymentData.participantEmail);
      formData.append("paymentMethod", "Upload Slip");
      formData.append("slip", slipFile);

      const { data } = await api.post("/api/payments/upload-slip", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccessMsg(data.message || "Payment slip uploaded successfully.");
      setSlipFile(null);
      setErrors({});
    } catch (error) {
      setSuccessMsg(
        error.response?.data?.message || "Failed to upload payment slip"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-top">
          <div>
            <h2>Payment Options</h2>
            <p>Complete your tournament registration payment.</p>
          </div>

          <button
            className="payment-back-btn"
            onClick={() => navigate("/participant-dashboard")}
          >
            Back
          </button>
        </div>

        <div className="payment-summary-card">
          <h3>Registration Summary</h3>
          <div className="payment-summary-grid">
            <div><b>Tournament:</b> {paymentData.tournamentTitle}</div>
            <div><b>Sport:</b> {paymentData.sportType}</div>
            <div><b>Venue:</b> {paymentData.venue}</div>
            <div><b>Team Name:</b> {paymentData.teamName}</div>
            <div><b>Registration ID:</b> {paymentData.registrationId}</div>
            <div><b>Amount:</b> Rs. {paymentData.amount}</div>
            <div><b>Payment Status:</b> {paymentData.paymentStatus || "Not Paid"}</div>
            <div><b>Admin Remark:</b> {paymentData.adminRemark || "-"}</div>
          </div>
        </div>

        {isVerified ? (
          <div className="payment-success-box">
            This payment has already been verified. You cannot pay again for this tournament.
          </div>
        ) : (
          <div className="payment-form-card">
            <h3>{isRejected ? "Re-upload Payment Slip" : "Upload Payment Slip"}</h3>

            <form onSubmit={handleSubmitSlip}>
              <div className="payment-form-grid">
                <div>
                  <label>Team Name</label>
                  <input type="text" value={paymentData.teamName || ""} readOnly />
                  <small className="field-hint">
                    Auto-filled from your approved registration.
                  </small>
                </div>

                <div>
                  <label>Tournament</label>
                  <input
                    type="text"
                    value={paymentData.tournamentTitle || ""}
                    readOnly
                  />
                  <small className="field-hint">
                    Auto-filled from your selected tournament.
                  </small>
                </div>

                <div>
                  <label>Amount</label>
                  <input
                    type="text"
                    value={`Rs. ${paymentData.amount || 0}`}
                    readOnly
                  />
                </div>

                <div>
                  <label>Choose Slip</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => {
                      setSlipFile(e.target.files?.[0] || null);
                      setErrors((prev) => ({ ...prev, slipFile: "" }));
                    }}
                  />
                  <small className="field-hint">
                    Only JPG, PNG, PDF files are allowed. Max size 5MB.
                  </small>
                  {errors.slipFile && (
                    <small className="field-error">{errors.slipFile}</small>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="payment-submit-btn"
                disabled={loading}
              >
                {loading
                  ? "Submitting..."
                  : isRejected
                  ? "Re-upload Slip"
                  : "Submit Slip"}
              </button>
            </form>
          </div>
        )}

        {successMsg && <div className="payment-success-box">{successMsg}</div>}
      </div>
    </div>
  );
}