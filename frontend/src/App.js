import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";


import AdminLogin from "./pages/AdminLogin/AdminLogin";
import AdminUsers from "./pages/AdminUser/AdminUser";
import AdminDashboard from "./pages/Admin/AdminDashboard";

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
        <Route path="/tournaments" element={<Placeholder title="Tournaments" />} />
        <Route path="/about" element={<Placeholder title="About" />} />
        <Route path="/contact" element={<Placeholder title="Contact" />} />
        
        
        <Route path="/tournaments/:id" element={<Placeholder title="Tournament Details" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

      <Route path="/organizer-dashboard" element={<h2 style={{color:"white", padding:"20px"}}>Organizer Dashboard</h2>} />
      <Route path="/participant-dashboard" element={<h2 style={{color:"white", padding:"20px"}}>Participant Dashboard</h2>} /> 


      <Route path="/adminlogin" element={<AdminLogin />} />
      <Route path="/adminusers" element={<AdminUsers />} /> 
      <Route path="/admindashboard" element={<AdminDashboard />} /> 

      </Routes>
    </BrowserRouter>
  );
}