import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");

    if (confirmLogout) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("admin");
      navigate("/");
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2 className="admin-title">Admin Dashboard</h2>
        <button className="admin-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

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
          <p>Check and maintain user feedbacks</p>
        </div>

        <div className="admin-card" onClick={() => navigate("/paymentDetails")}>
          <h3>Manage Payments</h3>
          <p>Verify payment receipts</p>
        </div>

        <div className="admin-card" onClick={() => navigate("/admin-chats")}>
          <h3>Manage User Chats</h3>
          <p>Chat with users</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;