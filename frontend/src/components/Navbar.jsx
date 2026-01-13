import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hoveredLink, setHoveredLink] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const handleEditProfile = () => {
    navigate('/profile');
    setProfileDropdownOpen(false);
  };

  return (
    <nav style={styles.navbar}>
      <style>{`
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .navbar-container {
          animation: slideInDown 0.5s ease-out;
        }
        .nav-link {
          position: relative;
          transition: color 0.3s ease;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: -5px;
          left: 0;
          background-color: #fff;
          transition: width 0.3s ease;
        }
        .nav-link:hover::after {
          width: 100%;
        }
        
        @media (max-width: 768px) {
          .nav-link::after {
            display: none;
          }
          .nav-link {
            padding: 10px 0;
          }
        }
      `}</style>
      <div style={styles.container} className="navbar-container">
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>🌿</span> 
          <span style={styles.logoText}>GREEN VISTA</span>
        </Link>
        
        {/* Mobile Menu Toggle */}
        <button 
          style={styles.hamburger}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span style={styles.hamburgerLine}></span>
          <span style={styles.hamburgerLine}></span>
          <span style={styles.hamburgerLine}></span>
        </button>

        {/* Desktop & Mobile Menu */}
        <div style={{
          ...styles.menu,
          display: mobileMenuOpen ? 'flex' : styles.menu.display
        }}>
          {user ? (
            <>
              <div style={styles.profileContainer}>
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  style={styles.userBadge}
                >
                  {user.role === 'admin' ? '🔐' : '👤'} {user.name}
                </button>
                {profileDropdownOpen && (
                  <div style={styles.profileDropdown}>
                    <div style={styles.profileDropdownHeader}>
                      <div style={styles.profileInfo}>
                        <p style={styles.profileName}>{user.name}</p>
                        <p style={styles.profileEmail}>{user.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleEditProfile}
                      style={styles.dropdownOption}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      ✏️ Edit Profile
                    </button>
                    <hr style={styles.dropdownDivider} />
                    <button 
                      onClick={handleLogout}
                      style={{...styles.dropdownOption, color: '#e74c3c'}}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#fadbd8'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
              {user.role === 'admin' && (
                <>
                  <NavLink 
                    to="/dashboard" 
                    label="Admin Dashboard"
                    icon="📊"
                    hovered={hoveredLink === 'dashboard'}
                    onHover={() => setHoveredLink('dashboard')}
                  />
                  <NavLink 
                    to="/users" 
                    label="Users"
                    icon="👥"
                    hovered={hoveredLink === 'users'}
                    onHover={() => setHoveredLink('users')}
                  />
                </>
              )}
              {user.role === 'owner' && (
                <>
                  <NavLink 
                    to="/dashboard" 
                    label="My Dashboard"
                    icon="🏠"
                    hovered={hoveredLink === 'dashboard'}
                    onHover={() => setHoveredLink('dashboard')}
                  />
                  <NavLink 
                    to="/requests" 
                    label="Requests"
                    icon="📋"
                    hovered={hoveredLink === 'requests'}
                    onHover={() => setHoveredLink('requests')}
                  />
                </>
              )}
              <NavLink 
                to="/invoices" 
                label="Invoices"
                icon="💰"
                hovered={hoveredLink === 'invoices'}
                onHover={() => setHoveredLink('invoices')}
              />
              <NavLink 
                to="/notices" 
                label="Notices"
                icon="📢"
                hovered={hoveredLink === 'notices'}
                onHover={() => setHoveredLink('notices')}
              />
            </>
          ) : (
            <>
              <NavLink 
                to="/login" 
                label="Login"
                hovered={hoveredLink === 'login'}
                onHover={() => setHoveredLink('login')}
              />
              <NavLink 
                to="/register" 
                label="Register"
                hovered={hoveredLink === 'register'}
                onHover={() => setHoveredLink('register')}
              />
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, label, icon, hovered, onHover }) => (
  <Link 
    to={to} 
    style={{
      ...styles.link,
      color: hovered ? '#fff' : 'white',
      transform: hovered ? 'scale(1.05)' : 'scale(1)',
      transition: 'all 0.3s ease'
    }}
    className="nav-link"
    onMouseEnter={onHover}
  >
    {icon && <span style={{ marginRight: '5px' }}>{icon}</span>}
    {label}
  </Link>
);

const styles = {
  navbar: {
    backgroundColor: '#27ae60',
    padding: '15px 0',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    '@media (maxWidth: 768px)': {
      padding: '0 15px'
    }
  },
  logo: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: 'white',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'transform 0.3s ease',
    minWidth: 'max-content'
  },
  logoIcon: {
    fontSize: '28px'
  },
  logoText: {
    '@media (maxWidth: 768px)': {
      fontSize: '16px'
    }
  },
  menu: {
    display: 'flex',
    gap: '25px',
    alignItems: 'center',
    flexWrap: 'wrap',
    '@media (maxWidth: 768px)': {
      flexDirection: 'column',
      position: 'absolute',
      top: '60px',
      left: 0,
      right: 0,
      backgroundColor: '#229954',
      padding: '20px',
      gap: '10px',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
    }
  },
  hamburger: {
    display: 'none',
    flexDirection: 'column',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '5px',
    '@media (maxWidth: 768px)': {
      display: 'flex'
    }
  },
  hamburgerLine: {
    width: '25px',
    height: '3px',
    backgroundColor: 'white',
    margin: '5px 0',
    transition: 'all 0.3s ease',
    borderRadius: '2px'
  },
  userBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    padding: '8px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    whiteSpace: 'nowrap',
    '@media (maxWidth: 768px)': {
      padding: '10px 16px',
      fontSize: '12px'
    }
  },
  link: {
    color: 'rgba(255, 255, 255, 0.9)',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    '@media (maxWidth: 768px)': {
      fontSize: '15px',
      width: '100%',
      padding: '10px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    }
  },
  logoutBtn: {
    padding: '10px 18px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 8px rgba(231, 76, 60, 0.3)',
    marginLeft: '10px',
    '@media (maxWidth: 768px)': {
      marginLeft: 0,
      width: '100%',
      padding: '12px 16px',
      fontSize: '14px'
    }
  },
  profileContainer: {
    position: 'relative'
  },
  userBadge: {
    backgroundColor: '#1a1a1a',
    color: 'white',
    padding: '10px 16px',
    borderRadius: '50px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    '&:hover': {
      backgroundColor: '#333',
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.4)'
    }
  },
  profileDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
    minWidth: '250px',
    zIndex: 1001,
    marginTop: '8px',
    overflow: 'hidden'
  },
  profileDropdownHeader: {
    padding: '15px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#f9f9f9'
  },
  profileInfo: {
    margin: 0
  },
  profileName: {
    margin: '0 0 5px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50'
  },
  profileEmail: {
    margin: 0,
    fontSize: '12px',
    color: '#7f8c8d'
  },
  dropdownOption: {
    width: '100%',
    padding: '12px 15px',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s ease',
    color: '#2c3e50'
  },
  dropdownDivider: {
    margin: '0',
    border: 'none',
    borderTop: '1px solid #eee'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    maxWidth: '400px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto'
  },
  modalHeader: {
    padding: '20px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#7f8c8d',
    padding: '5px 10px',
    '&:hover': {
      color: '#2c3e50'
    }
  },
  dropdownOption: {
    width: '100%',
    padding: '12px 15px',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s ease',
    color: '#2c3e50'
  },
  dropdownDivider: {
    margin: '0',
    border: 'none',
    borderTop: '1px solid #eee'
  }
};

export default Navbar;
