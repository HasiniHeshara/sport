import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "./BookEquipment.css";

const BookEquipment = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const tournament = location.state?.tournament;

  const [equipmentList, setEquipmentList] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [allocatedQuantity, setAllocatedQuantity] = useState("");
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchAvailableEquipment = async () => {
    try {
      const res = await api.get("/api/equipment");
      const availableOnly = res.data.filter(
        (item) => item.availableQuantity > 0
      );
      setEquipmentList(availableOnly);
    } catch (err) {
      console.error(err);
      setError("Failed to load equipment");
    }
  };

  useEffect(() => {
    fetchAvailableEquipment();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!selectedEquipment || !allocatedQuantity) {
      setError("Please select equipment and quantity");
      return;
    }

    if (Number(allocatedQuantity) <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    try {
      await api.post("/api/allocations", {
        equipmentId: selectedEquipment,
        tournamentId: id,
        tournamentTitle: tournament?.title || "Tournament",
        allocatedQuantity: Number(allocatedQuantity),
        remarks,
      });

      setMessage("Equipment booked successfully");
      setSelectedEquipment("");
      setAllocatedQuantity("");
      setRemarks("");
      fetchAvailableEquipment();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Booking failed");
    }
  };

  return (
    <div className="book-equipment-page">
      <div className="book-equipment-card">
        <h1>Book Equipment</h1>
        <p className="book-subtitle">
          Tournament: <strong>{tournament?.title || "Selected Tournament"}</strong>
        </p>

        <form onSubmit={handleSubmit} className="book-form">
          <div className="form-group">
            <label>Select Equipment</label>
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
            >
              <option value="">-- Select equipment --</option>
              {equipmentList.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.equipmentName} (Available: {item.availableQuantity})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number"
              min="1"
              value={allocatedQuantity}
              onChange={(e) => setAllocatedQuantity(e.target.value)}
              placeholder="Enter quantity"
            />
          </div>

          <div className="form-group">
            <label>Remarks</label>
            <textarea
              rows="4"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional remarks"
            />
          </div>

          {message && <p className="success-msg">{message}</p>}
          {error && <p className="error-msg">{error}</p>}

          <div className="btn-row">
            <button type="submit" className="book-btn">
              Confirm Booking
            </button>
            <button
              type="button"
              className="back-btn"
              onClick={() => navigate("/organizer-dashboard")}
            >
              Back
            </button>
          </div>
        </form>

        <div className="equipment-preview">
          <h3>Available Equipment</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Total</th>
                <th>Available</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {equipmentList.length > 0 ? (
                equipmentList.map((item) => (
                  <tr key={item._id}>
                    <td>{item.equipmentName}</td>
                    <td>{item.totalQuantity}</td>
                    <td>{item.availableQuantity}</td>
                    <td>{item.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No available equipment</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookEquipment;