import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    itNumber: "",
    name: "",
    year: "",
    faculty: "",
    contactNumber: "",
    email: "",
    password: "",
    role: "participant",
  });

  const [msg, setMsg] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.itNumber.trim()) return "IT Number is required";
    if (!form.name.trim()) return "Name is required";
    if (!form.year.trim()) return "Year is required";
    if (!form.faculty.trim()) return "Faculty is required";
    if (!form.contactNumber.trim()) return "Contact number is required";
    if (!form.email.trim()) return "Email is required";
    if (!form.password.trim()) return "Password is required";

    // simple contact number check (Sri Lanka style)
    if (!/^\d{10}$/.test(form.contactNumber)) return "Contact number must be 10 digits";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Enter a valid email";

    if (form.password.length < 6) return "Password must be at least 6 characters";
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

      // ⚠️ Change URL if your backend route is different
      // Example: http://localhost:5000/api/auth/register
      const res = await axios.post("http://localhost:5000/api/auth/register", form);

      setMsg({ type: "success", text: res.data?.message || "Registered successfully!" });

      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      const text =
        err.response?.data?.message ||
        err.message ||
        "Registration failed. Try again.";

      setMsg({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-head">
          <h2>Create Account</h2>
          <p>Register as an Organizer or Participant</p>
        </div>

        {msg.text && (
          <div className={`alert ${msg.type === "success" ? "success" : "error"}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="grid-2">
            <div className="field">
              <label>IT Number</label>
              <input
                name="itNumber"
                value={form.itNumber}
                onChange={handleChange}
                placeholder="IT123456"
              />
            </div>

            <div className="field">
              <label>Full Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your Name"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Year</label>
              <select name="year" value={form.year} onChange={handleChange}>
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div className="field">
              <label>Faculty</label>
              <select name="faculty" value={form.faculty} onChange={handleChange}>
                <option value="">Select Faculty</option>
                <option value="Computing">Computing</option>
                <option value="Engineering">Engineering</option>
                <option value="Business">Business</option>
                <option value="Humanities">Humanities</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Contact Number</label>
              <input
                name="contactNumber"
                value={form.contactNumber}
                onChange={handleChange}
                placeholder="07XXXXXXXX"
              />
            </div>

            <div className="field">
              <label>Role</label>
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="participant">Participant</option>
                <option value="organizer">Organizer</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@gmail.com"
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
            />
          </div>

          <button className="register-btn" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="register-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}