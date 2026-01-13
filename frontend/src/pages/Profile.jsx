import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const Profile = () => {
  const { user, reloadUser } = useAuth();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    password: '',
    confirmPassword: ''
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(
    user?.profilePhoto 
      ? `${import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'https://greenvista-1.onrender.com'}/${user.profilePhoto}`
      : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update photoPreview whenever user changes
  useEffect(() => {
    if (user?.profilePhoto) {
      const photoUrl = `${import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'https://greenvista-1.onrender.com'}/${user.profilePhoto}`;
      setPhotoPreview(photoUrl);
      console.log('Photo URL set to:', photoUrl);
    } else {
      setPhotoPreview(null);
      console.log('No profile photo found');
    }
  }, [user?.profilePhoto, user?._id]);

  // Fetch the latest user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get the current user's profile to ensure we have the latest photo
        const userData = localStorage.getItem('user');
        if (userData) {
          const currentUser = JSON.parse(userData);
          console.log('Current user from localStorage:', currentUser);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };
    
    fetchUserProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.name.trim()) {
      setError('Username cannot be empty');
      setLoading(false);
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Create FormData for file upload
      const updateData = new FormData();
      updateData.append('name', formData.name);
      if (formData.password) {
        updateData.append('password', formData.password);
      }
      if (profilePhoto) {
        updateData.append('profilePhoto', profilePhoto);
      }

      const response = await api.put('/api/auth/profile', updateData);

      // Update user in local storage and context
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        // Update photoPreview with new photo
        if (response.data.user.profilePhoto) {
          setPhotoPreview(`${import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'https://greenvista-1.onrender.com'}/${response.data.user.profilePhoto}`);
        }
        // Reload user in context to update the global user state
        if (reloadUser) {
          reloadUser();
        }
      }
      
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      setFormData({ ...formData, password: '', confirmPassword: '' });
      setProfilePhoto(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1>My Profile</h1>
          <button
            onClick={() => navigate(-1)}
            style={styles.backBtn}
          >
            ← Back
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <div style={styles.profileSection}>
          <div style={styles.photoSection}>
            <div style={styles.photoFrame}>
              {photoPreview ? (
                <img 
                  src={photoPreview} 
                  alt="Profile" 
                  style={styles.photo}
                  onError={(e) => {
                    console.error('Photo failed to load:', photoPreview);
                    e.target.style.display = 'none';
                    e.target.parentElement.querySelector('[id="photo-placeholder"]').style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                style={{...styles.photoPlaceholder, display: photoPreview ? 'none' : 'flex'}}
                id="photo-placeholder"
              >
                <span style={styles.photoIcon}>📷</span>
              </div>
            </div>
            {editMode && (
              <label style={styles.photoUploadLabel}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
                <span style={styles.uploadBtn}>Change Photo</span>
              </label>
            )}
          </div>

          <div style={styles.infoSection}>
            <div style={styles.infoGroup}>
              <label style={styles.label}>Email</label>
              <p style={styles.readOnlyValue}>{user?.email}</p>
              <small style={styles.hint}>(Cannot be changed)</small>
            </div>

            {!editMode ? (
              <>
                <div style={styles.infoGroup}>
                  <label style={styles.label}>Username</label>
                  <p style={styles.value}>{user?.name}</p>
                </div>
                <div style={styles.infoGroup}>
                  <label style={styles.label}>Phone</label>
                  <p style={styles.value}>{user?.phone}</p>
                </div>
                {user?.apartmentNumber && (
                  <div style={styles.infoGroup}>
                    <label style={styles.label}>Apartment Number</label>
                    <p style={styles.value}>{user.apartmentNumber}</p>
                  </div>
                )}
                {user?.address && (
                  <div style={styles.infoGroup}>
                    <label style={styles.label}>Address</label>
                    <p style={styles.value}>{user.address}</p>
                  </div>
                )}
                <button
                  onClick={() => setEditMode(true)}
                  style={styles.editBtn}
                >
                  ✏️ Edit Profile
                </button>
              </>
            ) : (
              <form onSubmit={handleSaveProfile}>
                <div style={styles.infoGroup}>
                  <label style={styles.label}>Username</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.infoGroup}>
                  <label style={styles.label}>New Password (Optional)</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Leave blank to keep current password"
                    style={styles.input}
                  />
                </div>

                <div style={styles.infoGroup}>
                  <label style={styles.label}>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm new password"
                    style={styles.input}
                  />
                </div>

                <div style={styles.buttonGroup}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setFormData({ ...formData, password: '', confirmPassword: '' });
                      setProfilePhoto(null);
                      setPhotoPreview(user?.profilePhoto ? `${import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'https://greenvista-1.onrender.com'}/${user.profilePhoto}` : null);
                    }}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={styles.saveBtn}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    maxWidth: '600px',
    width: '100%',
    padding: '30px',
    animation: 'slideIn 0.3s ease-out'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '1px solid #eee'
  },
  backBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#3498db',
    fontWeight: '600',
    padding: '8px 12px',
    borderRadius: '4px',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#ecf0f1'
    }
  },
  error: {
    backgroundColor: '#fadbd8',
    color: '#c0392b',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500'
  },
  success: {
    backgroundColor: '#d5f4e6',
    color: '#27ae60',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500'
  },
  profileSection: {
    display: 'flex',
    gap: '30px',
    flexWrap: 'wrap'
  },
  photoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '20px'
  },
  photoFrame: {
    width: '180px',
    height: '180px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '4px solid #27ae60',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    boxShadow: '0 8px 25px rgba(39, 174, 96, 0.35)',
    position: 'relative'
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    backgroundSize: 'cover'
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f8f5',
    flexDirection: 'column',
    gap: '10px'
  },
  photoIcon: {
    fontSize: '56px',
    color: '#27ae60'
  },
  photoUploadLabel: {
    cursor: 'pointer'
  },
  uploadBtn: {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'background-color 0.3s ease',
    display: 'inline-block'
  },
  infoSection: {
    flex: 1,
    minWidth: '250px'
  },
  infoGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '700',
    color: '#7f8c8d',
    textTransform: 'uppercase',
    marginBottom: '8px',
    letterSpacing: '0.5px'
  },
  value: {
    fontSize: '16px',
    color: '#2c3e50',
    margin: '0',
    fontWeight: '500'
  },
  readOnlyValue: {
    fontSize: '16px',
    color: '#2c3e50',
    margin: '0',
    fontWeight: '500',
    padding: '8px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px'
  },
  hint: {
    fontSize: '11px',
    color: '#95a5a6',
    display: 'block',
    marginTop: '4px'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s ease'
  },
  editBtn: {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'background-color 0.3s ease',
    marginTop: '20px',
    width: '100%'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    color: '#2c3e50',
    padding: '10px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'background-color 0.3s ease'
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#27ae60',
    color: 'white',
    padding: '10px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'background-color 0.3s ease'
  }
};

export default Profile;
