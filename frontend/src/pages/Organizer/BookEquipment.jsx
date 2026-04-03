import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "./BookEquipment.css";

export default function BookEquipment() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [equipmentList, setEquipmentList] = useState([]);
  const [tournament, setTournament] = useState(null);

  const [formData, setFormData] = useState({
    equipmentId: "",
    allocatedQuantity: "",
    remarks: "",
  });

  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [equipRes, tournamentRes] = await Promise.all([
        api.get("/api/equipment"),
        api.get(`/api/tournaments/${id}`),
      ]);

      setEquipmentList(equipRes.data || []);
      setTournament(tournamentRes.data || null);
    } catch (error) {
      console.error(error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.equipmentId) {
      newErrors.equipmentId = "Please select an equipment item.";
    }

    if (!formData.allocatedQuantity) {
      newErrors.allocatedQuantity = "Quantity is required.";
    } else if (Number(formData.allocatedQuantity) <= 0) {
      newErrors.allocatedQuantity = "Quantity must be greater than 0.";
    }

    if (formData.remarks.trim().length > 200) {
      newErrors.remarks = "Remarks cannot exceed 200 characters.";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    try {
      const selectedEquipment = equipmentList.find(
        (item) => item._id === formData.equipmentId
      );

      await api.post("/api/allocations", {
        equipmentId: formData.equipmentId,
        tournamentId: id,
        tournamentTitle: tournament?.title,
        allocatedQuantity: Number(formData.allocatedQuantity),
        remarks: formData.remarks,
      });

      setMsg("Equipment booked successfully.");
      setFormData({
        equipmentId: "",
        allocatedQuantity: "",
        remarks: "",
      });

      loadData();
    } catch (error) {
      setMsg(error.response?.data?.message || "Failed to book equipment.");
    }
  };

  return (
    <div className="book-equipment-page">
      <div className="book-equipment-card">
        <h1>Book Equipment</h1>
        <p className="book-equipment-subtitle">
          Tournament: <strong>{tournament?.title || "Loading..."}</strong>
        </p>

        {msg && <p className="form-message">{msg}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Equipment</label>
            <select
              name="equipmentId"
              value={formData.equipmentId}
              onChange={handleChange}
            >
              <option value="">-- Select equipment --</option>
              {equipmentList.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.equipmentName} (Available: {item.availableQuantity})
                </option>
              ))}
            </select>
            <small className="field-hint">
              Choose the equipment you want to allocate for this tournament.
            </small>
            {errors.equipmentId && (
              <small className="field-error">{errors.equipmentId}</small>
            )}
          </div>

          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number"
              name="allocatedQuantity"
              placeholder="Enter quantity"
              value={formData.allocatedQuantity}
              onChange={handleChange}
              min="1"
            />
            <small className="field-hint">
              Quantity must be a positive number and cannot be 0 or negative.
            </small>
            {errors.allocatedQuantity && (
              <small className="field-error">{errors.allocatedQuantity}</small>
            )}
          </div>

          <div className="form-group">
            <label>Remarks</label>
            <textarea
              name="remarks"
              placeholder="Optional remarks"
              value={formData.remarks}
              onChange={handleChange}
            />
            <small className="field-hint">
              Optional field. Add any special note if needed.
            </small>
            {errors.remarks && (
              <small className="field-error">{errors.remarks}</small>
            )}
          </div>

          <div className="button-row">
            <button type="submit" className="confirm-btn">
              Confirm Booking
            </button>
            <button
              type="button"
              className="back-btn"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>
        </form>

        <h2>Available Equipment</h2>
        <table className="equipment-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Total</th>
              <th>Available</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {equipmentList.map((item) => (
              <tr key={item._id}>
                <td>{item.equipmentName}</td>
                <td>{item.totalQuantity}</td>
                <td>{item.availableQuantity}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}