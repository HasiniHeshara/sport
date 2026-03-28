import { useState } from "react";
import axios from "axios";
import "./FeedbackForm.css";

export default function FeedbackForm() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    tournamentName: "",
    rating: "",
    category: "Tournament",
    feedback: "",
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!form.tournamentName || !form.rating || !form.feedback) {
      setMsg("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        "http://localhost:5000/api/feedback",
        {
          userId: user?.id || user?._id,
          userName: user?.name,
          role: user?.role,
          tournamentName: form.tournamentName,
          rating: form.rating,
          category: form.category,
          feedback: form.feedback,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMsg("Feedback submitted successfully");

      setForm({
        tournamentName: "",
        rating: "",
        category: "Tournament",
        feedback: "",
      });
    } catch (error) {
      setMsg(error.response?.data?.message || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-page">
      <div className="feedback-card">
        <h2>Submit Feedback</h2>
        <p>Share your thoughts about tournaments and the platform</p>

        {msg && <div className="feedback-msg">{msg}</div>}

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="field">
            <label>Tournament Name</label>
            <input
              type="text"
              name="tournamentName"
              value={form.tournamentName}
              onChange={handleChange}
              placeholder="Enter tournament name"
            />
          </div>

          <div className="feedback-grid">
            <div className="field">
              <label>Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="Tournament">Tournament</option>
                <option value="Organizer">Organizer</option>
                <option value="Venue">Venue</option>
                <option value="System">System</option>
              </select>
            </div>

            <div className="field">
              <label>Rating</label>
              <select
                name="rating"
                value={form.rating}
                onChange={handleChange}
              >
                <option value="">Select Rating</option>
                <option value="1">1 - Poor</option>
                <option value="2">2 - Fair</option>
                <option value="3">3 - Good</option>
                <option value="4">4 - Very Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Feedback</label>
            <textarea
              name="feedback"
              value={form.feedback}
              onChange={handleChange}
              rows="5"
              placeholder="Write your feedback here..."
            />
          </div>

          <button type="submit" className="feedback-btn" disabled={loading}>
            {loading ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}