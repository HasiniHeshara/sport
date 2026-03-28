import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./PaymentOptions.css";

export default function PaymentOptions() {
  const navigate = useNavigate();
  const location = useLocation();

  const paymentData = useMemo(
    () =>
      location.state || {
        tournamentTitle: "Inter Faculty Football Championship 2026",
        sportType: "Football",
        venue: "SLIIT Main Ground",
        teamName: "Thunder Strikers",
        registrationId: "REG-2026-001",
        amount: 1500,
        status: "Approved",
      },
    [location.state]
  );

  const [method, setMethod] = useState("slip");
  const [slipFile, setSlipFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitSlip = (e) => {
    e.preventDefault();
    if (!slipFile) {
      alert("Please choose a payment slip file");
      return;
    }
    setSubmitted(true);
  };

  const handlePayHere = () => {
    alert("PayHere integration will be implemented later.");
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-top">
          <div>
            <h2>Payment Options</h2>
            <p>Choose a payment method to complete your tournament registration.</p>
          </div>

          <button className="payment-back-btn" onClick={() => navigate("/participant-dashboard")}>
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
            <div><b>Status:</b> {paymentData.status}</div>
          </div>
        </div>

        <div className="payment-method-grid">
          <div
            className={`payment-method-card ${method === "slip" ? "active" : ""}`}
            onClick={() => setMethod("slip")}
          >
            <h3>Upload Payment Slip</h3>
            <p>Upload your bank receipt or payment slip for admin verification.</p>
          </div>

          <div
            className={`payment-method-card ${method === "payhere" ? "active" : ""}`}
            onClick={() => setMethod("payhere")}
          >
            <h3>PayHere</h3>
            <p>Proceed with online payment gateway integration.</p>
          </div>
        </div>

        {method === "slip" && (
          <div className="payment-form-card">
            <h3>Upload Payment Slip</h3>
            <form onSubmit={handleSubmitSlip}>
              <div className="payment-form-grid">
                <div>
                  <label>Team Name</label>
                  <input type="text" value={paymentData.teamName} readOnly />
                </div>

                <div>
                  <label>Tournament</label>
                  <input type="text" value={paymentData.tournamentTitle} readOnly />
                </div>

                <div>
                  <label>Amount</label>
                  <input type="text" value={`Rs. ${paymentData.amount}`} readOnly />
                </div>

                <div>
                  <label>Upload Slip</label>
                  <input
                    type="file"
                    onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <button type="submit" className="payment-submit-btn">
                Submit Payment Slip
              </button>
            </form>

            {submitted && (
              <div className="payment-success-box">
                Payment slip submitted successfully. Payment status is now <b>Pending</b>.
              </div>
            )}
          </div>
        )}

        {method === "payhere" && (
          <div className="payment-form-card">
            <h3>PayHere Payment</h3>
            <p className="payment-note">
              This is a UI preview. PayHere payment gateway will be connected later.
            </p>

            <div className="payhere-box">
              <div><b>Merchant:</b> Sportix Payments</div>
              <div><b>Amount:</b> Rs. {paymentData.amount}</div>
              <div><b>Description:</b> Tournament registration payment</div>
            </div>

            <button type="button" className="payment-submit-btn" onClick={handlePayHere}>
              Proceed to PayHere
            </button>
          </div>
        )}
      </div>
    </div>
  );
}