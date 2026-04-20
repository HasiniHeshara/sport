import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./FeedbackForm.css";

export default function FeedbackForm() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [form, setForm] = useState({
    rating: "",
    subject: "",
    message: "",
  });

  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      alert("Please login first to provide feedback.");
      navigate("/login");
    }
  }, [token, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    if (!form.rating) return "Rating is required";
    if (!form.subject.trim()) return "Subject is required";
    if (!form.message.trim()) return "Message is required";
    if (form.subject.trim().length < 3) return "Subject must be at least 3 characters";
    if (form.message.trim().length < 10) return "Message must be at least 10 characters";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    const error = validate();
    if (error) {
      setMsg({ type: "error", text: error });
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/feedback",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMsg({
        type: "success",
        text: res.data?.message || "Feedback submitted successfully",
      });

      setForm({
        rating: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setMsg({
        type: "error",
        text: error.response?.data?.message || "Failed to submit feedback",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-page">
      <div className="feedback-card">
        <h2>Share Your Feedback</h2>
        <p>Help us improve Sportix with your suggestions and experience.</p>

        {msg.text && (
          <div className={`feedback-alert ${msg.type}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="field">
            <label>Rating</label>
            <select name="rating" value={form.rating} onChange={handleChange}>
              <option value="">Select rating</option>
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Good</option>
              <option value="3">3 - Average</option>
              <option value="2">2 - Poor</option>
              <option value="1">1 - Very Poor</option>
            </select>
          </div>

          <div className="field">
            <label>Subject</label>
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Enter feedback subject"
            />
          </div>

          <div className="field">
            <label>Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Write your feedback here..."
              rows="6"
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