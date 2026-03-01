import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  return (
    <div className="landing">
      {/* Navbar */}
      <header className="landing-nav">
        <div className="brand">
          <div className="brand-badge">🏆</div>
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
          <Link to="/login" className="btn ghost">Login</Link>
          <Link to="/register" className="btn primary">Register</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-left">
          <div className="chip">✨ One platform for organizers & teams</div>

          <h1>
            Organize & Join <span className="gradient">Sports Tournaments</span>{" "}
            with ease
          </h1>

          <p className="hero-sub">
            Create tournaments, publish updates, register teams, and confirm
            payments using receipt uploads — all in one place.
          </p>

          <div className="hero-buttons">
            <Link to="/tournaments" className="btn primary big">
              Browse Tournaments
            </Link>
            <Link to="/register" className="btn ghost big">
              Create Account
            </Link>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <h3>Fast</h3>
              <p>Quick team registration</p>
            </div>
            <div className="stat-card">
              <h3>Simple</h3>
              <p>Easy tournament management</p>
            </div>
            <div className="stat-card">
              <h3>Accessible</h3>
              <p>Receipt-based payments</p>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="glass-card">
            <div className="glass-top">
              <div>
                <h3>Featured Tournament</h3>
                <p>Discover & register instantly</p>
              </div>
              <span className="pill open">Open</span>
            </div>

            <div className="glass-body">
              <h2>Inter-Uni Football Cup</h2>
              <p>📍 Ground A</p>
              <p>🗓 10 Mar – 12 Mar</p>
              <p>⏳ Deadline: 05 Mar</p>
              <p>💳 Fee: Rs. 1500</p>

              <div className="glass-actions">
                <Link to="/tournaments" className="btn ghost">
                  View All
                </Link>
                <Link to="/tournaments/1" className="btn primary">
                  View Details
                </Link>
              </div>
            </div>
          </div>

          <div className="mini-note">
            <span>💡 Tip:</span> After login, you’ll see your dashboard based on
            your role (Organizer / Participant).
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <h2 className="section-title">Key Features</h2>
        <p className="section-subtitle">
          Built to support smooth tournament organization and participation.
        </p>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="icon">📝</div>
            <h3>Tournament Creation</h3>
            <p>Create tournaments with venue, dates, limits, fee, and deadline.</p>
          </div>

          <div className="feature-card">
            <div className="icon">📢</div>
            <h3>Broadcasting</h3>
            <p>Publish tournaments with images and announcements for teams.</p>
          </div>

          <div className="feature-card">
            <div className="icon">👥</div>
            <h3>Team Registration</h3>
            <p>Teams register easily and track registration status.</p>
          </div>

          <div className="feature-card">
            <div className="icon">🧾</div>
            <h3>Receipt Payments</h3>
            <p>Upload payment receipts for confirmation without PayPal.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} Sportix • All rights reserved</p>
        <div className="footer-links">
          <Link to="/about">About</Link>
          <Link to="/tournaments">Tournaments</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </footer>
    </div>
  );
}