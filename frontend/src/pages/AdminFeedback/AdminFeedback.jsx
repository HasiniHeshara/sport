import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminFeedback.css";

export default function AdminFeedback() {
  const token = localStorage.getItem("token");
  const [feedbacks, setFeedbacks] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const loadFeedbacks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/feedback", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFeedbacks(res.data);
    } catch (error) {
      setMsg("Failed to load feedbacks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const handleDelete = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this feedback?");
    if (!ok) return;

    try {
      await axios.delete(`http://localhost:5000/api/feedback/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFeedbacks((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      setMsg("Failed to delete feedback");
    }
  };

  return (
    <div className="admin-feedback-page">
      <div className="admin-feedback-card">
        <h2>Manage Feedbacks</h2>
        <p>View and manage all submitted feedbacks</p>

        {msg && <div className="admin-feedback-msg">{msg}</div>}

        {loading ? (
          <p>Loading feedbacks...</p>
        ) : feedbacks.length === 0 ? (
          <p>No feedbacks found.</p>
        ) : (
          <div className="feedback-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Rating</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((item) => (
                  <tr key={item._id}>
                    <td>{item.userName}</td>
                    <td>{item.userRole}</td>
                    <td>{item.rating}/5</td>
                    <td>{item.subject}</td>
                    <td>{item.message}</td>
                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="delete-feedback-btn"
                        onClick={() => handleDelete(item._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}