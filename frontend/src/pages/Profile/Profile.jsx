import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    itNumber: "",
    name: "",
    year: "",
    faculty: "",
    contactNumber: "",
    email: "",
    password: "",
    role: "",
  });

  const [activities, setActivities] = useState({});
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { user, activities } = res.data;

      setForm({
        itNumber: user.itNumber || "",
        name: user.name || "",
        year: user.year || "",
        faculty: user.faculty || "",
        contactNumber: user.contactNumber || "",
        email: user.email || "",
        password: "",
        role: user.role || "",
      });

      setActivities(activities || {});
    } catch (error) {
      setMsg("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.put(
        "http://localhost:5000/api/users/profile",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      localStorage.setItem("user", JSON.stringify(res.data.user));
      setMsg("Profile updated successfully");
    } catch (error) {
      setMsg(error.response?.data?.message || "Failed to update profile");
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm("Are you sure you want to delete your account?");
    if (!ok) return;

    try {
      await axios.delete("http://localhost:5000/api/users/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    } catch (error) {
      setMsg(error.response?.data?.message || "Failed to delete account");
    }
  };

  if (loading) {
    return <div className="profile-page">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <h2>My Profile</h2>
          <p>{form.role === "organizer" ? "Organizer Profile" : "Participant Profile"}</p>
        </div>

        {msg && <div className="profile-msg">{msg}</div>}

        <form onSubmit={handleUpdate} className="profile-form">
          <div className="profile-grid">
            <div className="field">
              <label>IT Number</label>
              <input type="text" name="itNumber" className="it-input" value={form.itNumber} onChange={handleChange} />
            </div>

            <div className="field">
              <label>Full Name</label>
              <input type="text" name="name" className="it-input" value={form.name} onChange={handleChange} />
            </div>
          </div>

          <div className="profile-grid">
            <div className="field">
              <label>Year</label>
              <input type="text" name="year" className="it-input" value={form.year} onChange={handleChange} />
            </div>

            <div className="field">
              <label>Faculty</label>
              <input type="text" name="faculty" className="it-input" value={form.faculty} onChange={handleChange} />
            </div>
          </div>

          <div className="profile-grid">
            <div className="field">
              <label>Contact Number</label>
              <input
                type="text"
                name="contactNumber"
                value={form.contactNumber}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label>Email</label>
              <input type="email" name="email" className="it-input" value={form.email} onChange={handleChange} />
            </div>
          </div>

          <div className="field">
            <label>New Password (optional)</label>
            <input
              type="password"
              name="password"
              className="it-input"
              value={form.password}
              onChange={handleChange}
              placeholder="Leave empty if no change"
            />
          </div>

          <div className="profile-actions">
            <button type="submit" className="update-btn">
              Update Profile
            </button>
            <button type="button" className="delete-btn" onClick={handleDelete}>
              Delete Account
            </button>
          </div>
        </form>
      </div>

      <div className="activity-card">
        <h3>My Activities</h3>

        {form.role === "organizer" && (
          <>
            <div className="activity-summary">
              <span>Draft: {activities.draftCount || 0}</span>
              <span>Published: {activities.publishedCount || 0}</span>
              <span>Closed: {activities.closedCount || 0}</span>
            </div>

            <ul>
              {(activities.createdTournaments || []).map((t) => (
                <li key={t._id}>
                  <strong>{t.title}</strong> - {t.status}
                </li>
              ))}
            </ul>
          </>
        )}

        {form.role === "participant" && (
          <>
            <div className="activity-summary">
              <span>Pending: {activities.pendingCount || 0}</span>
              <span>Approved: {activities.approvedCount || 0}</span>
              <span>Rejected: {activities.rejectedCount || 0}</span>
            </div>

            <ul>
              {(activities.registrations || []).map((r) => (
                <li key={r._id}>
                  <strong>{r.tournamentId?.title || "Tournament"}</strong> - {r.status}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}