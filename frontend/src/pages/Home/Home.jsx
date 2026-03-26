import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaRobot } from "react-icons/fa";
import "./Home.css";

// ✅ Put these images in: src/assets/
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
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Floating Chat/Help Button (optional) */}
      <button className="chat-button" onClick={() => navigate("/help")}>
        <FaRobot size={34} />
      </button>

      <div className="home-page">
        {/* Navbar */}
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
          </nav>

          <div className="nav-actions">
            <button className="nav-btn ghost" onClick={() => navigate("/login")}>
              Login
            </button>
            <button className="nav-btn primary" onClick={() => navigate("/register")}>
              Register
            </button>
            <button className="nav-btn primary" onClick={() => navigate("/adminlogin")}>
            Admin Login
            </button>
          </div>
        </header>

        {/* Hero Slideshow */}
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
                  <p>Create tournaments, broadcast details, register teams, and upload payment receipts easily.</p>

                  <div className="hero-buttons">
                    <button className="cta-button" onClick={() => navigate("/tournaments")}>
                      Browse Tournaments
                    </button>
                    <button className="cta-button outline" onClick={() => navigate("/register")}>
                      Create Account
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Dots */}
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

        {/* Features */}
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
            <p>Organizers can book equipment that need for thier tournamnets.</p>
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



        {/* Testimonials */}
        <section className="testimonials-section">
          <h2>What Users Say</h2>

          <div className="testimonials-container">
            <div className="testimonial-card">
              <p>"Creating tournaments is super easy, and registrations are tracked perfectly."</p>
              <div className="customer-info">
                <span className="customer-name">- Organizer</span>
                <span className="customer-role">University Sports Club</span>
              </div>
            </div>

            <div className="testimonial-card">
              <p>"I like the receipt upload payment method because not everyone has PayPal."</p>
              <div className="customer-info">
                <span className="customer-name">- Team Captain</span>
                <span className="customer-role">Participant</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
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
                <li><Link to="/organizer/create">Create Tournament</Link></li>
                <li><Link to="/organizer/dashboard">Organizer Dashboard</Link></li>
                <li><Link to="/organizer/announcements">Broadcast Updates</Link></li>
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