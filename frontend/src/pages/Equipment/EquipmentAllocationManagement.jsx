import { useEffect, useState } from "react";
import api from "../../services/api";
import "./EquipmentAllocationManagement.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const EquipmentAllocationManagement = () => {
  const initialForm = {
    equipmentName: "",
    totalQuantity: "",
    description: "",
  };

  const [formData, setFormData] = useState(initialForm);
  const [equipmentList, setEquipmentList] = useState([]);
  const [bookingList, setBookingList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [returnData, setReturnData] = useState({});

  const fetchEquipment = async () => {
    try {
      const res = await api.get("/api/equipment");
      setEquipmentList(res.data);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      setMessage("Failed to load equipment");
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await api.get("/api/allocations");
      setBookingList(res.data);
    } catch (error) {
      console.error("Error fetching booking details:", error);
    }
  };

  useEffect(() => {
    fetchEquipment();
    fetchBookings();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    const trimmedName = formData.equipmentName.trim();
    const trimmedDescription = formData.description.trim();

    if (!trimmedName) {
      newErrors.equipmentName = "Equipment name is required";
    } else if (!/^[A-Za-z0-9 ]+$/.test(trimmedName)) {
      newErrors.equipmentName =
        "Equipment name can contain only letters, numbers, and spaces";
    }

    if (formData.totalQuantity === "") {
      newErrors.totalQuantity = "Total quantity is required";
    } else if (!Number.isInteger(Number(formData.totalQuantity))) {
      newErrors.totalQuantity = "Total quantity must be a whole number";
    } else if (Number(formData.totalQuantity) < 0) {
      newErrors.totalQuantity = "Total quantity cannot be negative";
    }

    if (trimmedDescription.length > 150) {
      newErrors.description = "Description cannot exceed 150 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    setErrors((prev) => ({
      ...prev,
      [e.target.name]: "",
    }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validateForm()) return;

    const payload = {
      equipmentName: formData.equipmentName.trim(),
      totalQuantity: Number(formData.totalQuantity),
      description: formData.description.trim(),
    };

    try {
      if (editingId) {
        await api.put(`/api/equipment/${editingId}`, payload);
        setMessage("Equipment updated successfully");
      } else {
        await api.post("/api/equipment", payload);
        setMessage("Equipment added successfully");
      }

      resetForm();
      fetchEquipment();
    } catch (error) {
      console.error("Error saving equipment:", error);
      setMessage(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleEdit = (item) => {
    setFormData({
      equipmentName: item.equipmentName,
      totalQuantity: item.totalQuantity,
      description: item.description || "",
    });
    setEditingId(item._id);
    setErrors({});
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this equipment?"
    );
    if (!confirmed) return;

    try {
      await api.delete(`/api/equipment/${id}`);
      setMessage("Equipment deleted successfully");

      if (editingId === id) {
        resetForm();
      }

      fetchEquipment();
    } catch (error) {
      console.error("Error deleting equipment:", error);
      setMessage(error.response?.data?.message || "Delete failed");
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Equipment Allocation Management Report", 14, 20);

    doc.setFontSize(11);
    doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Total Equipment Items: ${equipmentList.length}`, 14, 35);

    const tableColumn = [
      "Name",
      "Total",
      "Available",
      "Status",
      "Description",
    ];

    const tableRows = filteredEquipment.map((item) => [
      item.equipmentName,
      item.totalQuantity,
      item.availableQuantity,
      item.status,
      item.description || "-",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 42,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [79, 70, 229],
      },
    });

    doc.save("equipment-details-report.pdf");
  };

  const handleReturnChange = (id, field, value) => {
    setReturnData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleReturnSubmit = async (bookingId) => {
    const data = returnData[bookingId] || {};

    try {
      await api.put(`/api/allocations/${bookingId}/return`, {
        returnedQuantity: Number(data.returnedQuantity || 0),
        damagedQuantity: Number(data.damagedQuantity || 0),
        lostQuantity: Number(data.lostQuantity || 0),
        remarks: data.remarks || "",
      });

      setMessage("Equipment return status updated successfully");
      fetchEquipment();
      fetchBookings();
    } catch (error) {
      console.error("Return update failed:", error);
      setMessage(error.response?.data?.message || "Failed to update return");
    }
  };

  const filteredEquipment = equipmentList.filter((item) =>
    item.equipmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="equipment-page">
      <h1>Equipment Allocation Management</h1>
      <p className="equipment-subtitle">
        Create, update, and remove sports equipment details.
      </p>

      <form className="equipment-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Equipment Name</label>
          <input
            type="text"
            name="equipmentName"
            value={formData.equipmentName}
            onChange={handleChange}
            placeholder="Enter equipment name"
          />
          {errors.equipmentName && (
            <small className="error-text">{errors.equipmentName}</small>
          )}
        </div>

        <div className="form-group">
          <label>Total Quantity</label>
          <input
            type="number"
            name="totalQuantity"
            value={formData.totalQuantity}
            onChange={handleChange}
            placeholder="Enter total quantity"
            min="0"
          />
          {errors.totalQuantity && (
            <small className="error-text">{errors.totalQuantity}</small>
          )}
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter description"
            rows="4"
          />
          {errors.description && (
            <small className="error-text">{errors.description}</small>
          )}
        </div>

        <div className="button-row">
          <button type="submit" className="save-btn">
            {editingId ? "Update Equipment" : "Add Equipment"}
          </button>

          {editingId && (
            <button type="button" className="cancel-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {message && <p className="message">{message}</p>}

      <div className="equipment-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Search by equipment name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button className="download-btn" onClick={handleDownloadPDF}>
          Download PDF
        </button>
      </div>

      <div className="table-wrapper">
        <table className="equipment-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Total</th>
              <th>Available</th>
              <th>Status</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredEquipment.length > 0 ? (
              filteredEquipment.map((item) => (
                <tr key={item._id}>
                  <td>{item.equipmentName}</td>
                  <td>{item.totalQuantity}</td>
                  <td>{item.availableQuantity}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        item.status === "Available"
                          ? "status-available"
                          : item.status === "Limited"
                          ? "status-limited"
                          : "status-out"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td>{item.description || "-"}</td>
                  <td>
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleDelete(item._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">
                  No matching equipment found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="booking-section">
        <h2 className="booking-title">Equipment Booking Details</h2>
        <p className="booking-subtitle">
          View tournament equipment bookings made by organizers.
        </p>

        <div className="table-wrapper">
          <table className="equipment-table">
            <thead>
              <tr>
                <th>Tournament</th>
                <th>Equipment</th>
                <th>Booked Qty</th>
                <th>Status</th>
                <th>Booked Date</th>
                <th>Remarks</th>
                <th>Return / Damage / Lost</th>
              </tr>
            </thead>
            <tbody>
              {bookingList.length > 0 ? (
                bookingList.map((booking) => (
                  <tr key={booking._id}>
                    <td>{booking.tournamentTitle}</td>
                    <td>{booking.equipmentId?.equipmentName || "-"}</td>
                    <td>{booking.allocatedQuantity}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          booking.status === "Returned"
                            ? "status-returned"
                            : booking.status === "Damaged"
                            ? "status-damaged"
                            : booking.status === "Lost"
                            ? "status-lost"
                            : "status-available"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      {booking.allocatedDate
                        ? new Date(booking.allocatedDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>{booking.remarks || "-"}</td>
                    <td>
                      {booking.status === "Allocated" ? (
                        <div className="return-box">
                          <input
                            type="number"
                            min="0"
                            placeholder="Returned"
                            value={
                              returnData[booking._id]?.returnedQuantity || ""
                            }
                            onChange={(e) =>
                              handleReturnChange(
                                booking._id,
                                "returnedQuantity",
                                e.target.value
                              )
                            }
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="Damaged"
                            value={
                              returnData[booking._id]?.damagedQuantity || ""
                            }
                            onChange={(e) =>
                              handleReturnChange(
                                booking._id,
                                "damagedQuantity",
                                e.target.value
                              )
                            }
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="Lost"
                            value={returnData[booking._id]?.lostQuantity || ""}
                            onChange={(e) =>
                              handleReturnChange(
                                booking._id,
                                "lostQuantity",
                                e.target.value
                              )
                            }
                          />
                          <input
                            type="text"
                            placeholder="Remarks"
                            value={returnData[booking._id]?.remarks || ""}
                            onChange={(e) =>
                              handleReturnChange(
                                booking._id,
                                "remarks",
                                e.target.value
                              )
                            }
                          />
                          <button
                            type="button"
                            className="return-btn"
                            onClick={() => handleReturnSubmit(booking._id)}
                          >
                            Update
                          </button>
                        </div>
                      ) : (
                        <span className="done-text">Updated</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    No equipment bookings yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EquipmentAllocationManagement;