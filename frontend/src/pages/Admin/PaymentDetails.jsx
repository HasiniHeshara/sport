import { useEffect, useState } from "react";
import api from "../../services/api";
import "./PaymentDetails.css";

export default function PaymentDetails() {
  const [payments, setPayments] = useState([]);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const loadPayments = async () => {
    try {
      setErrorMsg("");
      const { data } = await api.get("/api/payments");
      setPayments(data || []);
    } catch (error) {
      console.error("Failed to fetch payments:", error);

      const status = error.response?.status;
      const backendMessage = error.response?.data?.message;

      if (status === 401) {
        setErrorMsg("Not authorized. Please login as admin again.");
      } else if (status === 403) {
        setErrorMsg("Forbidden. Admin access only.");
      } else if (status === 404) {
        setErrorMsg("Payment route not found. Check backend app.js and paymentRoutes.");
      } else {
        setErrorMsg(
          backendMessage || error.message || "Failed to fetch payments"
        );
      }

      setPayments([]);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const verifyPayment = async (paymentId) => {
    try {
      await api.patch(`/api/payments/${paymentId}/verify`, {
        adminRemark: "Payment verified successfully.",
      });
      loadPayments();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to verify payment");
    }
  };

  const rejectPayment = async (paymentId) => {
    const reason = window.prompt(
      "Enter rejection reason:",
      "Blurred receipt"
    );

    if (reason === null) return;

    try {
      await api.patch(`/api/payments/${paymentId}/reject`, {
        adminRemark: reason.trim() || "Please upload a valid payment slip again.",
      });
      loadPayments();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to reject payment");
    }
  };

  const handleViewSlip = (payment) => {
    if (!payment.slipUrl) {
      alert("No slip available for this payment.");
      return;
    }

    const backendBase = "http://localhost:5000";
    const fullUrl = `${backendBase}${payment.slipUrl}`;

    if (payment.slipOriginalName?.toLowerCase().endsWith(".pdf")) {
      window.open(fullUrl, "_blank");
      return;
    }

    setSelectedSlip(fullUrl);
  };

  return (
    <div className="payment-admin-page">
      <div className="payment-admin-container">
        <div className="payment-admin-top">
          <div>
            <h2>Manage Payments</h2>
            <p>Verify uploaded slips and manage payment requests.</p>
          </div>
        </div>

        {errorMsg && (
          <p
            style={{
              marginTop: "16px",
              marginBottom: "16px",
              padding: "12px 14px",
              borderRadius: "12px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "#fecaca",
            }}
          >
            {errorMsg}
          </p>
        )}

        <div className="payment-admin-stats">
          <div className="payment-admin-statCard">
            <span>Pending</span>
            <h3>{payments.filter((p) => p.status === "Pending").length}</h3>
          </div>

          <div className="payment-admin-statCard">
            <span>Verified</span>
            <h3>{payments.filter((p) => p.status === "Verified").length}</h3>
          </div>

          <div className="payment-admin-statCard">
            <span>Rejected</span>
            <h3>{payments.filter((p) => p.status === "Rejected").length}</h3>
          </div>
        </div>

        <div className="payment-admin-tableWrap">
          <table className="payment-admin-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Tournament</th>
                <th>Team</th>
                <th>Participant</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Slip</th>
                <th>Status</th>
                <th>Remark</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="10" className="payment-empty-cell">
                    No payment records yet.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{payment._id}</td>
                    <td>{payment.tournamentTitle}</td>
                    <td>{payment.teamName}</td>
                    <td>{payment.participantName}</td>
                    <td>Rs. {payment.amount}</td>
                    <td>{payment.paymentMethod}</td>
                    <td>{payment.slipOriginalName || "-"}</td>
                    <td>
                      <span
                        className={`payment-admin-badge ${payment.status.toLowerCase()}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td>{payment.adminRemark || "-"}</td>
                    <td>
                      <div className="payment-admin-actions">
                        <button
                          type="button"
                          className="view-btn"
                          onClick={() => handleViewSlip(payment)}
                        >
                          View Slip
                        </button>

                        <button
                          type="button"
                          className="verify-btn"
                          onClick={() => verifyPayment(payment._id)}
                        >
                          Verify
                        </button>

                        <button
                          type="button"
                          className="reject-btn"
                          onClick={() => rejectPayment(payment._id)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSlip && (
        <div
          className="slip-preview-overlay"
          onClick={() => setSelectedSlip(null)}
        >
          <div
            className="slip-preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="slip-preview-top">
              <h3>Slip Preview</h3>
              <button
                className="slip-close-btn"
                onClick={() => setSelectedSlip(null)}
              >
                Close
              </button>
            </div>

            <div className="slip-preview-body">
              <img
                src={selectedSlip}
                alt="Slip Preview"
                className="slip-preview-image"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}