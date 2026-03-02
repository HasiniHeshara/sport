import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";

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
        <Route path="/login" element={<Placeholder title="Login" />} />
        <Route path="/register" element={<Placeholder title="Register" />} />
        <Route path="/tournaments/:id" element={<Placeholder title="Tournament Details" />} />
      </Routes>
    </BrowserRouter>
  );
}