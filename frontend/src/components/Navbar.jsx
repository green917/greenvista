import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          🌿 GREEN VISTA
        </Link>

        <div style={styles.menu}>
          {user ? (
            <>
              <div style={styles.profileContainer}>
                <button
                  style={styles.userBadge}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {user.role === "admin" ? "🔐" : "👤"} {user.name}
                </button>

                {dropdownOpen && (
                  <div style={styles.dropdown}>
                    <div style={styles.dropdownHeader}>
                      <p style={styles.name}>{user.name}</p>
                      <p style={styles.email}>{user.email}</p>
                    </div>

                    <button
                      style={styles.dropdownItem}
                      onClick={() => navigate("/profile")}
                    >
                      ✏️ Edit Profile
                    </button>

                    <hr style={styles.divider} />

                    <button
                      style={{ ...styles.dropdownItem, color: "#e74c3c" }}
                      onClick={handleLogout}
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>

              <NavItem to="/dashboard" label="Dashboard" />
              <NavItem to="/requests" label="Requests" />
              <NavItem to="/invoices" label="Invoices" />
              <NavItem to="/notices" label="Notices" />
            </>
          ) : (
            <>
              <NavItem to="/login" label="Login" />
              <NavItem to="/register" label="Register" />
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const NavItem = ({ to, label }) => (
  <Link to={to} style={styles.link}>
    {label}
  </Link>
);

const styles = {
  navbar: {
    backgroundColor: "#27ae60",
    padding: "15px 0",
    position: "sticky",
    top: 0,
    zIndex: 100
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  logo: {
    color: "white",
    fontSize: "20px",
    fontWeight: "bold",
    textDecoration: "none"
  },
  menu: {
    display: "flex",
    gap: "20px",
    alignItems: "center"
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontSize: "14px"
  },
  profileContainer: {
    position: "relative"
  },
  userBadge: {
    backgroundColor: "#1a1a1a",
    color: "white",
    padding: "8px 14px",
    borderRadius: "20px",
    border: "none",
    cursor: "pointer",
    fontSize: "13px"
  },
  dropdown: {
    position: "absolute",
    top: "110%",
    right: 0,
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "6px",
    minWidth: "220px",
    boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
    zIndex: 1000
  },
  dropdownHeader: {
    padding: "12px",
    borderBottom: "1px solid #eee"
  },
  name: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "600"
  },
  email: {
    margin: 0,
    fontSize: "12px",
    color: "#666"
  },
  dropdownItem: {
    width: "100%",
    padding: "10px 12px",
    border: "none",
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "13px"
  },
  divider: {
    margin: 0,
    borderTop: "1px solid #eee"
  }
};

export default Navbar;
