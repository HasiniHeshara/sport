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

      </div>
    </div>
  );
};

export default AdminDashboard;
