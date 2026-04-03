import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./PaymentOptions.css";

export default function PaymentOptions() {
  const navigate = useNavigate();
  const location = useLocation();

  const paymentData = useMemo(() => location.state || {}, [location.state]);

  const [method, setMethod] = useState("slip");
  const [slipFile, setSlipFile] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmitSlip = async (e) => {
    e.preventDefault();

    if (!slipFile) {
      alert("Please choose a payment slip file.");
      return;
    }

    if (
      !paymentData.registrationId ||
      !paymentData.tournamentId ||
      !paymentData.tournamentTitle ||
      !paymentData.teamName ||
      !paymentData.amount ||
      !paymentData.participantName ||
      !paymentData.participantEmail
    ) {
      console.log("Missing payment data:", paymentData);
      alert("Some payment details are missing. Please go back and try again.");
      return;
    }

    try {
      setLoading(true);

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
    } catch (error) {
      alert(error.response?.data?.message || "Failed to upload payment slip");
    } finally {
      setLoading(false);
    }
  };

  const handlePayHereDemo = async () => {
    if (
      !paymentData.registrationId ||
      !paymentData.tournamentId ||
      !paymentData.tournamentTitle ||
      !paymentData.teamName ||
      !paymentData.amount ||
      !paymentData.participantName ||
      !paymentData.participantEmail
    ) {
      console.log("Missing payment data:", paymentData);
      alert("Some payment details are missing. Please go back and try again.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post("/api/payments/payhere", {
        registrationId: paymentData.registrationId,
        tournamentId: paymentData.tournamentId,
        tournamentTitle: paymentData.tournamentTitle,
        teamName: paymentData.teamName,
        amount: paymentData.amount,
        participantName: paymentData.participantName,
        participantEmail: paymentData.participantEmail,
      });

      setSuccessMsg(data.message || "PayHere payment submitted.");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create PayHere payment");
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
            <div><b>Tournament:</b> {paymentData.tournamentTitle || "-"}</div>
            <div><b>Sport:</b> {paymentData.sportType || "-"}</div>
            <div><b>Venue:</b> {paymentData.venue || "-"}</div>
            <div><b>Team Name:</b> {paymentData.teamName || "-"}</div>
            <div><b>Registration ID:</b> {paymentData.registrationId || "-"}</div>
            <div><b>Amount:</b> Rs. {paymentData.amount || 0}</div>
            <div><b>Status:</b> {paymentData.status || "-"}</div>
            <div><b>Email:</b> {paymentData.participantEmail || "-"}</div>
          </div>
        </div>

        <div className="payment-method-grid">
          <div
            className={`payment-method-card ${method === "slip" ? "active" : ""}`}
            onClick={() => setMethod("slip")}
          >
            <h3>Upload Payment Slip</h3>
            <p>Upload a bank receipt or payment slip for admin verification.</p>
          </div>

          <div
            className={`payment-method-card ${method === "payhere" ? "active" : ""}`}
            onClick={() => setMethod("payhere")}
          >
            <h3>PayHere</h3>
            <p>Demo online payment option.</p>
          </div>
        </div>

        {method === "slip" && (
          <div className="payment-form-card">
            <h3>Upload Payment Slip</h3>

            <form onSubmit={handleSubmitSlip}>
              <div className="payment-form-grid">
                <div>
                  <label>Team Name</label>
                  <input type="text" value={paymentData.teamName || ""} readOnly />
                </div>

                <div>
                  <label>Tournament</label>
                  <input type="text" value={paymentData.tournamentTitle || ""} readOnly />
                </div>

                <div>
                  <label>Amount</label>
                  <input type="text" value={`Rs. ${paymentData.amount || 0}`} readOnly />
                </div>

                <div>
                  <label>Choose Slip</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <button type="submit" className="payment-submit-btn" disabled={loading}>
                {loading ? "Submitting..." : "Submit Slip"}
              </button>
            </form>
          </div>
        )}

        {method === "payhere" && (
          <div className="payment-form-card">
            <h3>PayHere</h3>
            <p className="payment-note">
              This is a demo online payment option.
            </p>

            <button
              type="button"
              className="payment-submit-btn"
              onClick={handlePayHereDemo}
              disabled={loading}
            >
              {loading ? "Processing..." : "Proceed with PayHere"}
            </button>
          </div>
        )}

        {successMsg && <div className="payment-success-box">{successMsg}</div>}
      </div>
    </div>
  );
}