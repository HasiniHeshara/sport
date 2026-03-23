import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";

import AdminLogin from "./pages/AdminLogin/AdminLogin";
import AdminUsers from "./pages/AdminUser/AdminUser";
import AdminDashboard from "./pages/Admin/AdminDashboard";

// ✅ Organizer pages
import OrganizerTournamentDashboard from "./pages/Organizer/OrganizerTournamentDashboard";
import CreateTournament from "./pages/Organizer/CreateTournament";
import EditTournament from "./pages/Organizer/EditTournament";
import OrganizerTournamentRegistrations from "./pages/Organizer/OrganizerTournamentRegistrations";

// ✅ Public tournaments list page
import Tournaments from "./pages/Tournaments/Tournaments";
import TournamentDetails from "./pages/Tournaments/TournamentDetails";
import ParticipantDashboard from "./pages/Participant/ParticipantDashboard";

function Placeholder({ title }) {
  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      <h2>{title}</h2>
      <p>This page will be implemented later.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Public published tournaments */}
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/tournaments/:id" element={<TournamentDetails />} />

        {/* Basic pages */}
        <Route path="/about" element={<Placeholder title="About" />} />
        <Route path="/contact" element={<Placeholder title="Contact" />} />

        {/* Auth */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Organizer */}
        <Route path="/organizer-dashboard" element={<OrganizerTournamentDashboard />} />
        <Route path="/organizer/tournaments/new" element={<CreateTournament />} />
        <Route path="/organizer/tournaments/:id/edit" element={<EditTournament />} />
        <Route path="/organizer/tournaments/:id/registrations" element={<OrganizerTournamentRegistrations />} />

        {/* Participant */}
        <Route path="/participant-dashboard" element={<ParticipantDashboard />} />

        {/* Admin */}
        <Route path="/adminlogin" element={<AdminLogin />} />
        <Route path="/adminusers" element={<AdminUsers />} />
        <Route path="/admindashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}