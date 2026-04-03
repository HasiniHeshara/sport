import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-dashboard">
      <h2 className="admin-title">Admin Dashboard</h2>

      <div className="admin-card-container">
        <div className="admin-card" onClick={() => navigate("/adminusers")}>
          <h3>Manage Users</h3>
          <p>Add, update, or delete user details</p>
        </div>

        <div
          className="admin-card"
          onClick={() => navigate("/equipment-management")}
        >
          <h3>Manage Equipment</h3>
          <p>Add, edit, delete, and manage sports equipment records</p>
        </div>

         
        <div className="admin-card" onClick={() => navigate("/feedback")}>
          <h3>Manage User Feedbacks</h3>
          <p> Check and maintain user feddbacks </p>
        </div>

         <div className="admin-card" onClick={() => navigate("/paymentDetails")}>
          <h3>Manage Payments</h3>
          <p> Verify payment receipts</p>
        </div>

         <div className="admin-card" onClick={() => navigate("/admin-chats")}>
          <h3>Manage User chats</h3>
          <p> chat with users</p>
        </div>

        
      </div>
    </div>
  );
};

export default AdminDashboard;