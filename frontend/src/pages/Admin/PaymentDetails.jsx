import { useState } from "react";
import "./PaymentDetails.css";

export default function PaymentDetails() {
  const [payments] = useState([
    {
      id: "PAY-001",
      tournament: "Inter Faculty Football Championship 2026",
      teamName: "Thunder Strikers",
      leader: "Kamal Perera",
      amount: 1500,
      method: "Upload Slip",
      status: "Pending",
    },
    {
      id: "PAY-002",
      tournament: "University Volleyball Cup 2026",
      teamName: "Sky Smashers",
      leader: "Nimali Silva",
      amount: 1200,
      method: "PayHere",
      status: "Verified",
    },
    {
      id: "PAY-003",
      tournament: "Annual Cricket Tournament 2026",
      teamName: "Blue Warriors",
      leader: "Sahan Fernando",
      amount: 2000,
      method: "Upload Slip",
      status: "Pending",
    },
  ]);

  return (
    <div className="payment-admin-page">
      <div className="payment-admin-container">
        <div className="payment-admin-top">
          <div>
            <h2>Manage Payments</h2>
            <p>Verify uploaded payment slips and review payment details.</p>
          </div>
        </div>

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
            <span>Total Payments</span>
            <h3>{payments.length}</h3>
          </div>
        </div>

        <div className="payment-admin-tableWrap">
          <table className="payment-admin-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Tournament</th>
                <th>Team Name</th>
                <th>Leader</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.id}</td>
                  <td>{payment.tournament}</td>
                  <td>{payment.teamName}</td>
                  <td>{payment.leader}</td>
                  <td>Rs. {payment.amount}</td>
                  <td>{payment.method}</td>
                  <td>
                    <span
                      className={`payment-admin-badge ${
                        payment.status === "Verified" ? "verified" : "pending"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td>
                    <div className="payment-admin-actions">
                      <button type="button" className="verify-btn">
                        Verify
                      </button>
                      <button type="button" className="view-btn">
                        View Slip
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}