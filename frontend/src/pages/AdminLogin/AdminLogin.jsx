import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const hardcodedUsername = "admin";
    const hardcodedPassword = "admin123";

    if (
      form.username === hardcodedUsername &&
      form.password === hardcodedPassword
    ) {
      localStorage.setItem(
        "admin",
        JSON.stringify({
          username: hardcodedUsername,
          role: "admin",
        })
      );

      navigate("/admindashboard");
    } else {
      setError("Invalid admin username or password");
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h2>Admin Login</h2>
        <p>Login using admin credentials</p>

        {error && <div className="admin-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-field">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter admin username"
              required
            />
          </div>

          <div className="admin-field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter admin password"
              required
            />
          </div>

          <button type="submit" className="admin-login-btn">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}