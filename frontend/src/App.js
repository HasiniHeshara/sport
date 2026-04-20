import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";

import AdminLogin from "./pages/AdminLogin/AdminLogin";
import AdminUsers from "./pages/AdminUser/AdminUser";
import AdminFeedback from "./pages/AdminFeedback/AdminFeedback";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import EquipmentAllocationManagement from "./pages/Equipment/EquipmentAllocationManagement";

import OrganizerTournamentDashboard from "./pages/Organizer/OrganizerTournamentDashboard";
import CreateTournament from "./pages/Organizer/CreateTournament";
import EditTournament from "./pages/Organizer/EditTournament";
import OrganizerTournamentRegistrations from "./pages/Organizer/OrganizerTournamentRegistrations";
import BookEquipment from "./pages/Organizer/BookEquipment";

import Tournaments from "./pages/Tournaments/Tournaments";
import TournamentDetails from "./pages/Tournaments/TournamentDetails";
import ParticipantDashboard from "./pages/Participant/ParticipantDashboard";
import PaymentOptions from "./pages/Participant/PaymentOptions";
import PaymentDetails from "./pages/Admin/PaymentDetails";
import Feedback from "./pages/FeedbackForm/FeedbackForm";
import Profile from "./pages/Profile/Profile";

import UserChat from "./pages/UserChat/UserChat";
import AdminChatManage from "./pages/AdminChat/AdminChatManage";
import ParticipantOrganizerChat from "./pages/ParticipantChat/ParticipantOrganizerChat";
import OrganizerParticipantChats from "./pages/OrganizerChat/OrganizerParticipantChat";

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
        <Route path="/" element={<Home />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/tournaments/:id" element={<TournamentDetails />} />

        <Route path="/about" element={<Placeholder title="About" />} />
        <Route path="/contact" element={<Placeholder title="Contact" />} />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route path="/organizer-dashboard" element={<OrganizerTournamentDashboard />} />
        <Route path="/organizer/tournaments/new" element={<CreateTournament />} />
        <Route path="/organizer/tournaments/:id/edit" element={<EditTournament />} />
        <Route path="/organizer/tournaments/:id/registrations" element={<OrganizerTournamentRegistrations />} />
        <Route path="/organizer/tournaments/:id/book-equipment" element={<BookEquipment />} />

        <Route path="/participant-dashboard" element={<ParticipantDashboard />} />
        <Route path="/payment-options" element={<PaymentOptions />} />

        <Route path="/profile" element={<Profile />} />

        <Route path="/adminlogin" element={<AdminLogin />} />
        <Route path="/adminusers" element={<AdminUsers />} />
        <Route path="/feedback" element={<AdminFeedback />} />
        <Route path="/admindashboard" element={<AdminDashboard />} />
        <Route path="/paymentDetails" element={<PaymentDetails />} />
        <Route path="/equipment-management" element={<EquipmentAllocationManagement />} />

        <Route path="/feedbackform" element={<Feedback />} />
        <Route path="/chat" element={<UserChat />} />
        <Route path="/admin-chats" element={<AdminChatManage />} />

        <Route
          path="/tournament-chat/:tournamentId"
          element={<ParticipantOrganizerChat />}
        />

        <Route
          path="/participant-chats"
          element={<OrganizerParticipantChats />}
        />
      </Routes>
    </BrowserRouter>
  );
}