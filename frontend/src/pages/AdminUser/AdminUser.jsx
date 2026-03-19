import { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./AdminUser.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    itNumber: "",
    name: "",
    year: "",
    faculty: "",
    contactNumber: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users");
      setUsers(res.data);
      setMsg("");
    } catch (err) {
      setMsg("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`);
      setUsers(users.filter((user) => user._id !== id));
      setMsg("User deleted successfully");
    } catch (err) {
      setMsg("Failed to delete user");
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user._id);
    setEditForm({
      itNumber: user.itNumber || "",
      name: user.name || "",
      year: user.year || "",
      faculty: user.faculty || "",
      contactNumber: user.contactNumber || "",
      email: user.email || "",
      role: user.role || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({
      itNumber: "",
      name: "",
      year: "",
      faculty: "",
      contactNumber: "",
      email: "",
      role: "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async (id) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/users/${id}`, editForm);

      setUsers(users.map((user) => (user._id === id ? res.data.user : user)));
      setEditingUser(null);
      setMsg("User updated successfully");
    } catch (err) {
      setMsg("Failed to update user");
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Registered User Details", 14, 15);

    const tableColumn = [
      "IT Number",
      "Name",
      "Year",
      "Faculty",
      "Contact",
      "Email",
      "Role",
    ];

    const tableRows = users.map((user) => [
      user.itNumber,
      user.name,
      user.year,
      user.faculty,
      user.contactNumber,
      user.email,
      user.role,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
    });

    doc.save("registered_users.pdf");
  };

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <h2>Registered Users</h2>
        <button className="pdf-btn" onClick={downloadPDF}>
          Download PDF
        </button>
      </div>

      {loading && <p>Loading users...</p>}
      {msg && <p className="message-text">{msg}</p>}

      {!loading && users.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>IT Number</th>
                <th>Name</th>
                <th>Year</th>
                <th>Faculty</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  {editingUser === user._id ? (
                    <>
                      <td>
                        <input
                          type="text"
                          name="itNumber"
                          value={editForm.itNumber}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          name="name"
                          value={editForm.name}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          name="year"
                          value={editForm.year}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          name="faculty"
                          value={editForm.faculty}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          name="contactNumber"
                          value={editForm.contactNumber}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <input
                          type="email"
                          name="email"
                          value={editForm.email}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <select
                          name="role"
                          value={editForm.role}
                          onChange={handleEditChange}
                        >
                          <option value="organizer">Organizer</option>
                          <option value="participant">Participant</option>
                        </select>
                      </td>
                      <td className="action-cell">
                        <button
                          className="save-btn"
                          onClick={() => handleUpdate(user._id)}
                        >
                          Save
                        </button>
                        <button
                          className="cancel-btn"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{user.itNumber}</td>
                      <td>{user.name}</td>
                      <td>{user.year}</td>
                      <td>{user.faculty}</td>
                      <td>{user.contactNumber}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td className="action-cell">
                        <button
                          className="edit-btn"
                          onClick={() => handleEditClick(user)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(user._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && users.length === 0 && <p>No users found.</p>}
    </div>
  );
}