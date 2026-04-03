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

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [msg, setMsg] = useState({ type: "", text: "" });

  const validateField = (name, value, currentForm = form) => {
    const trimmedValue = typeof value === "string" ? value.trim() : value;

    switch (name) {
      case "itNumber":
        if (!trimmedValue) return "IT Number is required";
        if (!/^(IT|IE|BM)\d{8}$/i.test(trimmedValue)) {
          return "IT Number must start with IT, IE, or BM and include 8 digits";
        }
        return "";

      case "name":
        if (!trimmedValue) return "Name is required";
        if (trimmedValue.length < 3) return "Name must be at least 3 characters";
        return "";

      case "year":
        if (!trimmedValue) return "Year is required";
        return "";

      case "faculty":
        if (!trimmedValue) return "Faculty is required";
        return "";

      case "contactNumber":
        if (!trimmedValue) return "Contact number is required";
        if (!/^\d{10}$/.test(trimmedValue)) {
          return "Contact number must be exactly 10 digits";
        }
        return "";

      case "email":
        if (!trimmedValue) return "Email is required";
        if (!/^\S+@\S+\.\S+$/.test(trimmedValue)) {
          return "Enter a valid email address";
        }
        return "";

      case "password":
        if (!trimmedValue) return "Password is required";
        if (trimmedValue.length < 6) {
          return "Password must be at least 6 characters";
        }
        return "";

      case "role":
        if (!trimmedValue) return "Role is required";
        return "";

      default:
        return "";
    }
  };

  const validateAllFields = () => {
    const newErrors = {
      itNumber: validateField("itNumber", form.itNumber),
      name: validateField("name", form.name),
      year: validateField("year", form.year),
      faculty: validateField("faculty", form.faculty),
      contactNumber: validateField("contactNumber", form.contactNumber),
      email: validateField("email", form.email),
      password: validateField("password", form.password),
      role: validateField("role", form.role),
    };

    setErrors(newErrors);

    const firstError = Object.values(newErrors).find((error) => error);
    return firstError || null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === "contactNumber") {
      finalValue = value.replace(/\D/g, "").slice(0, 10);
    }

    const updatedForm = { ...form, [name]: finalValue };
    setForm(updatedForm);

    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, finalValue, updatedForm),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const validate = () => {
    if (!form.itNumber.trim()) return "IT Number is required";
    if (!form.name.trim()) return "Name is required";
    if (!form.year.trim()) return "Year is required";
    if (!form.faculty.trim()) return "Faculty is required";
    if (!form.contactNumber.trim()) return "Contact number is required";
    if (!form.email.trim()) return "Email is required";
    if (!form.password.trim()) return "Password is required";

    if (!/^(IT|IE|BM)\d{8}$/i.test(form.itNumber.trim())) {
      return "IT Number must start with IT, IE, or BM and include 8 digits (example: IT12345678)";
    }

    if (!/^\d{10}$/.test(form.contactNumber)) {
      return "Contact number must be exactly 10 digits";
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      return "Enter a valid email address";
    }

    if (form.password.length < 6) {
      return "Password must be at least 6 characters";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    setTouched({
      itNumber: true,
      name: true,
      year: true,
      faculty: true,
      contactNumber: true,
      email: true,
      password: true,
      role: true,
    });

    const realtimeError = validateAllFields();
    const submitError = validate();

    if (realtimeError || submitError) {
      setMsg({ type: "error", text: realtimeError || submitError });
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("http://localhost:5000/api/users/register", form);

      setMsg({
        type: "success",
        text: res.data?.message || "Registered successfully!",
      });

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

        <form onSubmit={handleSubmit} className="register-form" noValidate>
          <div className="grid-2">
            <div className="field">
              <label>IT Number</label>
              <input
                name="itNumber"
                value={form.itNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="IT12345678"
              />
              {touched.itNumber && errors.itNumber && (
                <small className="field-error">{errors.itNumber}</small>
              )}
            </div>

            <div className="field">
              <label>Full Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Your Name"
              />
              {touched.name && errors.name && (
                <small className="field-error">{errors.name}</small>
              )}
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Year</label>
              <select
                name="year"
                value={form.year}
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
              {touched.year && errors.year && (
                <small className="field-error">{errors.year}</small>
              )}
            </div>

            <div className="field">
              <label>Faculty</label>
              <select
                name="faculty"
                value={form.faculty}
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <option value="">Select Faculty</option>
                <option value="Computing">Computing</option>
                <option value="Engineering">Engineering</option>
                <option value="Business">Business</option>
                <option value="Humanities">Humanities</option>
              </select>
              {touched.faculty && errors.faculty && (
                <small className="field-error">{errors.faculty}</small>
              )}
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Contact Number</label>
              <input
                name="contactNumber"
                value={form.contactNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="07XXXXXXXX"
                maxLength={10}
              />
              {touched.contactNumber && errors.contactNumber && (
                <small className="field-error">{errors.contactNumber}</small>
              )}
            </div>

            <div className="field">
              <label>Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <option value="participant">Participant</option>
                <option value="organizer">Organizer</option>
              </select>
              {touched.role && errors.role && (
                <small className="field-error">{errors.role}</small>
              )}
            </div>
          </div>

          <div className="field">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="example@gmail.com"
            />
            {touched.email && errors.email && (
              <small className="field-error">{errors.email}</small>
            )}
          </div>

          <div className="field">
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Minimum 6 characters"
            />
            {touched.password && errors.password && (
              <small className="field-error">{errors.password}</small>
            )}
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