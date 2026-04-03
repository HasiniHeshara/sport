import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [msg, setMsg] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.email.trim()) return "Email is required";
    if (!form.password.trim()) return "Password is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Enter a valid email";
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

      const res = await axios.post("http://localhost:5000/api/users/login", form);

      const { token, user, message } = res.data;

      localStorage.removeItem("admin");
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setMsg({ type: "success", text: message || "Login successful!" });

      setTimeout(() => {
        if (user.role === "admin") {
          navigate("/admindashboard");
        } else if (user.role === "organizer") {
          navigate("/organizer-dashboard");
        } else if (user.role === "participant") {
          navigate("/participant-dashboard");
        } else {
          navigate("/");
        }
      }, 800);
    } catch (err) {
      const text =
        err.response?.data?.message ||
        err.message ||
        "Login failed. Try again.";

      setMsg({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-head">
          <h2>Welcome Back</h2>
          <p>Login to your Sportix account</p>
        </div>

        {msg.text && (
          <div className={`alert ${msg.type === "success" ? "success" : "error"}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
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
              placeholder="Enter your password"
            />
          </div>

          <button className="login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="login-footer">
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}