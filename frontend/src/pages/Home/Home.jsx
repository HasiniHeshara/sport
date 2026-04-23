import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaRobot, FaUserCircle } from "react-icons/fa";
import axios from "axios";
import "./Home.css";

import hero1 from "../../assets/hero1.jpg";
import hero2 from "../../assets/hero2.png";
import hero3 from "../../assets/hero3.jpg";

import feature1 from "../../assets/feature1.jpeg";
import feature2 from "../../assets/feature2.jpg";
import feature3 from "../../assets/feature3.jpg";

import logoImg from "../../assets/logo.jpg";

const heroImages = [hero1, hero2, hero3];

export default function Home() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    setCurrentUser(savedUser);

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 4500);

    loadRecentFeedbacks();

    return () => clearInterval(interval);
  }, []);

  const loadRecentFeedbacks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/feedback/recent");
      setRecentFeedbacks(res.data || []);
    } catch (error) {
      console.error("Failed to load recent feedbacks");
    }
  };

  const handleDashboardOrLogin = () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!token || !user) {
      navigate("/login");
      return;
    }

    if (user.role === "organizer") {
      navigate("/organizer-dashboard");
    } else if (user.role === "participant") {
      navigate("/participant-dashboard");
    } else if (user.role === "admin") {
      navigate("/admindashboard");
    } else {
      navigate("/login");
    }
  };

  const handleChatClick = () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!token || !user) {
      alert("Please login first to chat.");
      navigate("/login");
      return;
    }

    navigate("/chat");
  };

  return (
    <>
      <button className="chat-button" onClick={handleChatClick}>
        <FaRobot size={34} />
      </button>

      <div className="home-page">
        <header className="home-nav">
          <div className="brand" onClick={() => navigate("/")}>
            <img src={logoImg} alt="Sportix Logo" className="brand-logo" />
            <div className="brand-text">
              <h3>Sportix</h3>
              <p>Sports Tournament Platform</p>
            </div>
          </div>

          <nav className="nav-links">
            <Link to="/" className="nav-link active">Home</Link>
            <Link to="/tournaments" className="nav-link">Tournaments</Link>
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/feedbackform" className="nav-link">Feedback</Link>
          </nav>

          <div className="nav-actions">
            <button className="nav-btn ghost" onClick={handleDashboardOrLogin}>
              {currentUser ? (
                <>
                  <FaUserCircle style={{ marginRight: "6px" }} />
                  Dashboard
                </>
              ) : (
                "Login"
              )}
            </button>

            {!currentUser && (
              <button className="nav-btn primary" onClick={() => navigate("/register")}>
                Register
              </button>
            )}
          </div>
        </header>

        <section className="hero-section">
          <div className="hero-slideshow">
            {heroImages.map((img, index) => (
              <div
                key={index}
                className={`hero-slide ${index === currentSlide ? "active" : ""}`}
                style={{ backgroundImage: `url(${img})` }}
              >
                <div className="slide-overlay">
                  <h1>Organize & Join Sports Tournaments</h1>
                  <p>
                    Create tournaments, broadcast details, register teams, and upload
                    payment receipts easily.
                  </p>

                  <div className="hero-buttons">
                    <button className="cta-button" onClick={() => navigate("/tournaments")}>
                      Browse Tournaments
                    </button>

                    {!currentUser ? (
                      <button
                        className="cta-button outline"
                        onClick={() => navigate("/register")}
                      >
                        Create Account
                      </button>
                    ) : (
                      <button
                        className="cta-button outline"
                        onClick={handleDashboardOrLogin}
                      >
                        Go to Dashboard
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="slide-dots">
              {heroImages.map((_, index) => (
                <span
                  key={index}
                  className={index === currentSlide ? "active" : ""}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="feature-card">
            <img src={feature1} alt="Tournament Creation" />
            <h3>Tournament Creation</h3>
            <p>Organizers can create tournaments with venue, dates, fee, and team limits.</p>
          </div>

          <div className="feature-card">
            <img src={feature2} alt="Team Registration" />
            <h3>Team Registration</h3>
            <p>Teams can register quickly and track their registration status easily.</p>
          </div>

          <div className="feature-card">
            <img src={feature3} alt="Receipt Payment" />
            <h3>Book Equipments</h3>
            <p>Organizers can book equipment needed for their tournaments.</p>
          </div>
        </section>

        <section className="home-container why-section">
          <div className="section-heading">
            <h2>Why Choose Sportix?</h2>
            <p>A practical sports tournament platform built for both organizers and participants.</p>
          </div>

          <div className="why-grid">
            <div className="why-card">
              <h3>Simple User Flow</h3>
              <p>From registration to tournament management, every step is easy to follow.</p>
            </div>
            <div className="why-card">
              <h3>Role-Based Access</h3>
              <p>Different dashboards and actions for admins, organizers, and participants.</p>
            </div>
            <div className="why-card">
              <h3>Live Tournament Control</h3>
              <p>Track status, registrations, and organizer actions in a structured way.</p>
            </div>
            <div className="why-card">
              <h3>University Friendly</h3>
              <p>Well suited for university tournaments, clubs, and student sports events.</p>
            </div>
          </div>
        </section>

        <section className="testimonials-section">
          <h2>Recent User Feedback</h2>

          <div className="testimonials-container">
            {recentFeedbacks.length === 0 ? (
              <div className="testimonial-card">
                <p>No feedback available yet.</p>
              </div>
            ) : (
              recentFeedbacks.map((item) => (
                <div className="testimonial-card" key={item._id}>
                  <p>"{item.message}"</p>
                  <div className="customer-info">
                    <span className="customer-name">- {item.userName}</span>
                    <span className="customer-role">
                      {item.userRole} | {item.rating}/5
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <footer className="modern-home-footer">
          <div className="home-footer-content">
            <div className="home-footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/tournaments">Tournaments</Link></li>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Register</Link></li>
              </ul>
            </div>

            <div className="home-footer-section">
              <h4>For Organizers</h4>
              <ul>
                <li><Link to="/organizer/tournaments/new">Create Tournament</Link></li>
                <li><Link to="/organizer-dashboard">Organizer Dashboard</Link></li>
                <li><Link to="/organizer/participant-chats">Participant Chats</Link></li>
              </ul>
            </div>

            <div className="home-footer-section">
              <h4>Contact</h4>
              <p>Sportix Support</p>
              <p>Phone: +94 7X XXX XXXX</p>
              <p>Email: support@sportix.com</p>
            </div>

            <div className="home-footer-section">
              <h4>Follow Us</h4>
              <div className="social-icons">
                <a href="#facebook">Facebook</a>
                <a href="#instagram">Instagram</a>
                <a href="#linkedin">LinkedIn</a>
              </div>
            </div>
          </div>

          <div className="home-footer-bottom">
            <p>© {new Date().getFullYear()} Sportix. All Rights Reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}