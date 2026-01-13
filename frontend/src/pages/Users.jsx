import React, { useState, useEffect } from 'react';
import api from '../api/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [sortBy, setSortBy] = useState('name');
  const [filterRole, setFilterRole] = useState('all'); // 'all', 'admin', 'owner'
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setError('');
      const response = await api.get('/api/users');
      const data = Array.isArray(response.data) ? response.data : response.data.users || [];
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to fetch users';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setError('');
        await api.delete(`/api/users/${userId}`);
        fetchUsers();
        setOpenMenu(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleMakeAdmin = async (userId) => {
    if (window.confirm('Are you sure you want to make this user an admin?')) {
      try {
        setError('');
        await api.put(`/api/users/${userId}/make-admin`);
        fetchUsers();
        setOpenMenu(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to update user role');
      }
    }
  };

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.phone && user.phone.includes(searchQuery));
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch(sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'email':
        return a.email.localeCompare(b.email);
      case 'date':
        return new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return 0;
    }
  });

  const admins = users.filter(u => u.role === 'admin');
  const owners = users.filter(u => u.role === 'owner');

  if (loading) return <div style={styles.container}><div style={styles.loadingSpinner}>Loading...</div></div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>👥 Registered Users</h1>
        <div style={styles.stats}>
          <div style={styles.stat}>
            <span style={styles.statNumber}>{admins.length}</span>
            <span style={styles.statLabel}>Admins</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statNumber}>{owners.length}</span>
            <span style={styles.statLabel}>Owners</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statNumber}>{users.length}</span>
            <span style={styles.statLabel}>Total</span>
          </div>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Search and Filter Bar */}
      <div style={styles.controlsBar}>
        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="🔍 Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.controls}>
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Users</option>
            <option value="admin">Admins Only</option>
            <option value="owner">Owners Only</option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.select}
          >
            <option value="name">Sort by Name</option>
            <option value="email">Sort by Email</option>
            <option value="date">Sort by Join Date</option>
          </select>

          <div style={styles.viewToggle}>
            <button 
              onClick={() => setViewMode('table')}
              style={{...styles.viewBtn, backgroundColor: viewMode === 'table' ? '#3498db' : '#bdc3c7'}}
            >
              📊 Table
            </button>
            <button 
              onClick={() => setViewMode('cards')}
              style={{...styles.viewBtn, backgroundColor: viewMode === 'cards' ? '#3498db' : '#bdc3c7'}}
            >
              🎴 Cards
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div style={styles.resultsInfo}>
        Showing <strong>{sortedUsers.length}</strong> of <strong>{users.length}</strong> users
      </div>

      {sortedUsers.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyIcon}>🔍</p>
          <p style={styles.emptyText}>No users found</p>
          <p style={styles.emptySubtext}>Try adjusting your search or filters</p>
        </div>
      ) : viewMode === 'table' ? (
        // Table View
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.th}>📷 Photo</th>
                <th style={styles.th}>👤 Name</th>
                <th style={styles.th}>📧 Email</th>
                <th style={styles.th}>📱 Phone</th>
                <th style={styles.th}>👔 Role</th>
                <th style={styles.th}>📅 Joined</th>
                <th style={styles.th}>📍 Address</th>
                <th style={styles.th}>⚙️ Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user._id} style={styles.row}>
                  <td style={styles.tdPhoto}>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                      {user.profilePhoto ? (
                        <img 
                          src={`${import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'https://greenvista-1.onrender.com'}/${user.profilePhoto}`}
                          alt={user.name}
                          style={styles.photoImg}
                          onError={(e) => {
                            console.log('Image failed:', user.profilePhoto);
                            e.target.style.display = 'none';
                            const placeholder = e.target.parentElement.querySelector('[id^="photo-placeholder"]');
                            if (placeholder) {
                              placeholder.style.display = 'inline-flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        style={{...styles.photoPlaceholder, display: user.profilePhoto ? 'none' : 'inline-flex'}}
                        id={`photo-placeholder-${user._id}`}
                      >
                        📷
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}><strong>{user.name}</strong></td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>{user.phone}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.roleBadge,
                      backgroundColor: user.role === 'admin' ? '#e74c3c' : '#27ae60'
                    }}>
                      {user.role === 'admin' ? '👨‍💼 Admin' : '🏠 Owner'}
                    </span>
                  </td>
                  <td style={styles.td}><small>{new Date(user.createdAt).toLocaleDateString()}</small></td>
                  <td style={styles.td}><small>{user.address?.substring(0, 20) || '-'}</small></td>
                  <td style={{...styles.td, position: 'relative'}}>
                    <button
                      onClick={() => setOpenMenu(openMenu === user._id ? null : user._id)}
                      style={styles.menuBtn}
                      title="More actions"
                    >
                      ⋮
                    </button>
                    {openMenu === user._id && (
                      <div style={styles.actionMenu}>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleMakeAdmin(user._id)}
                            style={styles.menuItem}
                          >
                            👨‍💼 Make Admin
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          style={{...styles.menuItem, color: '#e74c3c'}}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Card View
        <div style={styles.cardGrid}>
          {sortedUsers.map((user) => (
            <div key={user._id} style={{...styles.card, borderLeft: `4px solid ${user.role === 'admin' ? '#e74c3c' : '#27ae60'}`}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px'}}>
                <div>
                  <h3 style={styles.cardName}>{user.name}</h3>
                </div>
                <span style={{
                  ...styles.roleBadge,
                  backgroundColor: user.role === 'admin' ? '#e74c3c' : '#27ae60'
                }}>
                  {user.role === 'admin' ? '👨‍💼 Admin' : '🏠 Owner'}
                </span>
              </div>
              <div style={styles.cardInfo}>
                <p><strong>📧 Email:</strong></p>
                <p style={styles.cardValue}>{user.email}</p>
                <p><strong>📱 Phone:</strong></p>
                <p style={styles.cardValue}>{user.phone}</p>
                {user.apartmentNumber && (
                  <>
                    <p><strong>🏢 Apartment:</strong></p>
                    <p style={styles.cardValue}>{user.apartmentNumber}</p>
                  </>
                )}
                {user.address && (
                  <>
                    <p><strong>📍 Address:</strong></p>
                    <p style={styles.cardValue}>{user.address}</p>
                  </>
                )}
                <p><strong>📅 Joined:</strong></p>
                <p style={styles.cardValue}>{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px'
  },
  loadingSpinner: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#7f8c8d'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '3px solid #3498db'
  },
  stats: {
    display: 'flex',
    gap: '20px'
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#ecf0f1',
    borderRadius: '6px'
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  statLabel: {
    fontSize: '12px',
    color: '#7f8c8d',
    marginTop: '5px'
  },
  error: {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  controlsBar: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    alignItems: 'flex-end'
  },
  searchBox: {
    flex: 1,
    minWidth: '250px'
  },
  searchInput: {
    width: '100%',
    padding: '12px',
    border: '2px solid #bdc3c7',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  controls: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  select: {
    padding: '12px',
    border: '2px solid #bdc3c7',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  viewToggle: {
    display: 'flex',
    gap: '5px'
  },
  viewBtn: {
    padding: '10px 15px',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
    transition: 'background-color 0.3s ease'
  },
  resultsInfo: {
    padding: '10px 15px',
    backgroundColor: '#ecf0f1',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#2c3e50'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#7f8c8d'
  },
  emptyIcon: {
    fontSize: '48px',
    margin: '0 0 10px 0'
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '10px 0'
  },
  emptySubtext: {
    fontSize: '14px',
    margin: '5px 0'
  },
  tableWrapper: {
    overflowX: 'auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  headerRow: {
    backgroundColor: '#2c3e50',
    color: 'white'
  },
  th: {
    padding: '15px',
    textAlign: 'left',
    fontWeight: 'bold'
  },
  row: {
    borderBottom: '1px solid #ecf0f1',
    transition: 'background-color 0.2s ease'
  },
  td: {
    padding: '15px'
  },
  tdPhoto: {
    padding: '12px',
    textAlign: 'center',
    verticalAlign: 'middle',
    position: 'relative',
    display: 'table-cell',
    height: '74px'
  },
  photoImg: {
    width: '50px',
    height: '50px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '2px solid #27ae60',
    boxShadow: '0 2px 8px rgba(39, 174, 96, 0.2)',
    display: 'inline-block',
    margin: '0 auto'
  },
  photoPlaceholder: {
    width: '50px',
    height: '50px',
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f8f5',
    border: '2px solid #27ae60',
    fontSize: '24px',
    margin: '0 auto'
  },
  roleBadge: {
    color: 'white',
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    padding: '20px',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
  },
  cardHeader: {
    marginBottom: '15px'
  },
  cardAvatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#3498db',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 'bold'
  },
  cardName: {
    margin: '10px 0',
    fontSize: '18px',
    color: '#2c3e50'
  },
  cardInfo: {
    fontSize: '13px',
    color: '#555'
  },
  cardValue: {
    margin: '5px 0 15px 0',
    color: '#2c3e50',
    fontWeight: '500'
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px',
    color: '#34495e',
    transition: 'transform 0.2s ease',
    borderRadius: '4px'
  },
  actionMenu: {
    position: 'absolute',
    top: '100%',
    right: '0',
    backgroundColor: 'white',
    border: '1px solid #bdc3c7',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 100,
    minWidth: '150px',
    overflow: 'hidden'
  },
  menuItem: {
    display: 'block',
    width: '100%',
    padding: '12px 15px',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#2c3e50',
    transition: 'background-color 0.2s ease',
    borderBottom: '1px solid #ecf0f1'
  }
};

export default Users;
