import React, { useState, useEffect } from 'react';
import { 
  FaUserCircle, 
  FaEdit, 
  FaCog, 
  FaSignOutAlt, 
  FaLock, 
  FaEnvelope, 
  FaPhoneAlt, 
  FaCalendarAlt,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaGithub
} from 'react-icons/fa';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Initialize Firebase services
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();
  
  // User profile data state
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    joinDate: '',
    bio: '',
    interests: [],
    socialMedia: {
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: '',
      github: ''
    },
    profileImage: null
  });

  // New interest input state
  const [newInterest, setNewInterest] = useState('');
  
  // Fetch user data from Firestore on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) {
        navigate('/');
        return;
      }
      
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          // User data exists in Firestore
          const data = userSnap.data();
          setUserData({
            name: data.name || auth.currentUser.displayName || '',
            email: data.email || auth.currentUser.email || '',
            phone: data.phone || '',
            joinDate: data.joinDate ? new Date(data.joinDate.toDate()).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '',
            bio: data.bio || '',
            interests: data.interests || [],
            socialMedia: data.socialMedia || {
              facebook: '',
              twitter: '',
              linkedin: '',
              instagram: '',
              github: ''
            },
            profileImage: data.profileImage || null
          });
        } else {
          // User doesn't have a profile document yet, create with defaults
          const newUserData = {
            name: auth.currentUser.displayName || '',
            email: auth.currentUser.email || '',
            phone: '',
            joinDate: serverTimestamp(),
            bio: '',
            interests: [],
            socialMedia: {
              facebook: '',
              twitter: '',
              linkedin: '',
              instagram: '',
              github: ''
            },
            profileImage: null,
            createdAt: serverTimestamp()
          };
          
          // Create the user document
          await setDoc(userRef, newUserData);
          
          // Set in state
          setUserData({
            ...newUserData,
            joinDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [auth, db, navigate]);
  
  // Handle input change for form fields with focus preservation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested social media fields
    if (name.startsWith('social_')) {
      const socialPlatform = name.split('_')[1];
      setUserData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialPlatform]: value
        }
      }));
    } else {
      // Handle regular fields
      setUserData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Keep the focus on the current input after state update
    // Use setTimeout to ensure this happens after the state update
    setTimeout(() => {
      e.target.focus();
    }, 0);
  };
  
  // Handle adding interests
  const handleAddInterest = (e) => {
    e.preventDefault();
    if (newInterest.trim() === '') return;
    
    // Add interest if it doesn't already exist
    if (!userData.interests.includes(newInterest.trim())) {
      setUserData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
    }
    
    setNewInterest('');
  };
  
  // Handle removing interests
  const handleRemoveInterest = (interestToRemove) => {
    setUserData(prev => ({
      ...prev,
      interests: prev.interests.filter(interest => interest !== interestToRemove)
    }));
  };
  
  // Save profile changes to Firestore
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      
      // Format data for Firestore
      const updatedData = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        bio: userData.bio,
        interests: userData.interests,
        socialMedia: userData.socialMedia,
        updatedAt: serverTimestamp()
      };
      
      // Update document
      await setDoc(userRef, updatedData, { merge: true });
      
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle user logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };
  
  // Profile content component
  const ProfileContent = () => (
    <div className="bg-[#0A1045] bg-opacity-80 rounded-lg p-6 shadow-xl border border-blue-900">
      {!isEditing ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">Personal Information</h3>
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center text-blue-400 hover:text-blue-300 transition duration-300"
            >
              <FaEdit className="mr-2" /> Edit Profile
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <FaEnvelope className="text-blue-400 mr-3" />
              <div>
                <p className="text-sm text-blue-300">Email</p>
                <p className="text-white">{userData.email}</p>
              </div>
            </div>
            
            {userData.phone && (
              <div className="flex items-center">
                <FaPhoneAlt className="text-blue-400 mr-3" />
                <div>
                  <p className="text-sm text-blue-300">Phone</p>
                  <p className="text-white">{userData.phone}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center">
              <FaCalendarAlt className="text-blue-400 mr-3" />
              <div>
                <p className="text-sm text-blue-300">Member since</p>
                <p className="text-white">{userData.joinDate}</p>
              </div>
            </div>
          </div>
          
          {userData.bio && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-white mb-4">Bio</h3>
              <p className="text-blue-200">{userData.bio}</p>
            </div>
          )}
          
          {userData.interests && userData.interests.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-white mb-4">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {userData.interests.map((interest, index) => (
                  <span 
                    key={index} 
                    className="bg-blue-800 text-blue-200 px-3 py-1 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-white mb-4">Social Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userData.socialMedia.facebook && (
                <a 
                  href={userData.socialMedia.facebook}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-300 hover:text-blue-200 transition"
                >
                  <FaFacebook className="mr-2" /> Facebook
                </a>
              )}
              
              {userData.socialMedia.twitter && (
                <a 
                  href={userData.socialMedia.twitter}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-300 hover:text-blue-200 transition"
                >
                  <FaTwitter className="mr-2" /> Twitter
                </a>
              )}
              
              {userData.socialMedia.linkedin && (
                <a 
                  href={userData.socialMedia.linkedin}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-300 hover:text-blue-200 transition"
                >
                  <FaLinkedin className="mr-2" /> LinkedIn
                </a>
              )}
              
              {userData.socialMedia.instagram && (
                <a 
                  href={userData.socialMedia.instagram}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-300 hover:text-blue-200 transition"
                >
                  <FaInstagram className="mr-2" /> Instagram
                </a>
              )}
              
              {userData.socialMedia.github && (
                <a 
                  href={userData.socialMedia.github}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-300 hover:text-blue-200 transition"
                >
                  <FaGithub className="mr-2" /> GitHub
                </a>
              )}
              
              {!userData.socialMedia.facebook && 
               !userData.socialMedia.twitter && 
               !userData.socialMedia.linkedin && 
               !userData.socialMedia.instagram && 
               !userData.socialMedia.github && (
                <p className="text-blue-400 col-span-2">No social media profiles added yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">Edit Profile</h3>
            <button 
              onClick={() => setIsEditing(false)}
              className="flex items-center text-blue-400 hover:text-blue-300 transition duration-300"
            >
              Cancel
            </button>
          </div>
          
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-blue-300 mb-1">Name</label>
              <input 
                type="text" 
                name="name" 
                value={userData.name}
                onChange={handleInputChange}
                className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-blue-300 mb-1">Email</label>
              <input 
                type="email" 
                name="email" 
                value={userData.email}
                onChange={handleInputChange}
                className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly
              />
              <p className="text-xs text-blue-400 mt-1">Email cannot be changed</p>
            </div>
            
            <div>
              <label className="block text-blue-300 mb-1">Phone</label>
              <input 
                type="text" 
                name="phone" 
                value={userData.phone}
                onChange={handleInputChange}
                placeholder="+1 (123) 456-7890"
                className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-blue-300 mb-1">Bio</label>
              <textarea 
                name="bio" 
                value={userData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself..."
                rows="4"
                className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-blue-300 mb-1">Interests</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {userData.interests.map((interest, index) => (
                  <div 
                    key={index} 
                    className="bg-blue-800 text-blue-200 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(interest)}
                      className="ml-2 text-blue-400 hover:text-blue-300"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex">
                <input 
                  type="text" 
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add a new interest"
                  className="flex-grow bg-blue-900 bg-opacity-50 border border-blue-700 rounded-l-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddInterest}
                  className="bg-blue-700 hover:bg-blue-600 text-white px-3 rounded-r-lg"
                >
                  Add
                </button>
              </div>
            </div>
            
            <div className="border-t border-blue-800 pt-4 mt-4">
              <h4 className="text-lg font-medium text-white mb-3">Social Media Links</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="flex items-center text-blue-300 mb-1">
                    <FaFacebook className="mr-2" /> Facebook
                  </label>
                  <input 
                    type="url" 
                    name="social_facebook" 
                    value={userData.socialMedia.facebook}
                    onChange={handleInputChange}
                    placeholder="https://facebook.com/yourusername"
                    className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="flex items-center text-blue-300 mb-1">
                    <FaTwitter className="mr-2" /> Twitter
                  </label>
                  <input 
                    type="url" 
                    name="social_twitter" 
                    value={userData.socialMedia.twitter}
                    onChange={handleInputChange}
                    placeholder="https://twitter.com/yourusername"
                    className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="flex items-center text-blue-300 mb-1">
                    <FaLinkedin className="mr-2" /> LinkedIn
                  </label>
                  <input 
                    type="url" 
                    name="social_linkedin" 
                    value={userData.socialMedia.linkedin}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/yourusername"
                    className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="flex items-center text-blue-300 mb-1">
                    <FaInstagram className="mr-2" /> Instagram
                  </label>
                  <input 
                    type="url" 
                    name="social_instagram" 
                    value={userData.socialMedia.instagram}
                    onChange={handleInputChange}
                    placeholder="https://instagram.com/yourusername"
                    className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="flex items-center text-blue-300 mb-1">
                    <FaGithub className="mr-2" /> GitHub
                  </label>
                  <input 
                    type="url" 
                    name="social_github" 
                    value={userData.socialMedia.github}
                    onChange={handleInputChange}
                    placeholder="https://github.com/yourusername"
                    className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <button 
                type="submit"
                disabled={loading}
                className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition duration-300 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  // Settings content component
  const SettingsContent = () => (
    <div className="bg-[#0A1045] bg-opacity-80 rounded-lg p-6 shadow-xl border border-blue-900">
      <h3 className="text-xl font-semibold text-white mb-6">Account Settings</h3>
      
      <div className="space-y-6">
        <div>
          <h4 className="flex items-center text-lg font-medium text-white mb-4">
            <FaLock className="mr-2" /> Password & Security
          </h4>
          <button className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-300">
            Change Password
          </button>
        </div>
        
        <div className="border-t border-blue-800 pt-6">
          <h4 className="flex items-center text-lg font-medium text-white mb-4">
            <FaEnvelope className="mr-2" /> Notification Settings
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="email-notifications"
                className="rounded bg-blue-900 border-blue-700 text-blue-500 focus:ring-blue-500 h-4 w-4"
                defaultChecked
              />
              <label htmlFor="email-notifications" className="ml-2 text-blue-200">
                Email notifications
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="course-updates"
                className="rounded bg-blue-900 border-blue-700 text-blue-500 focus:ring-blue-500 h-4 w-4"
                defaultChecked
              />
              <label htmlFor="course-updates" className="ml-2 text-blue-200">
                Course updates
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="promotional"
                className="rounded bg-blue-900 border-blue-700 text-blue-500 focus:ring-blue-500 h-4 w-4"
              />
              <label htmlFor="promotional" className="ml-2 text-blue-200">
                Promotional offers
              </label>
            </div>
          </div>
        </div>
        
        <div className="border-t border-blue-800 pt-6">
          <h4 className="flex items-center text-lg font-medium text-white mb-4">
            <FaSignOutAlt className="mr-2" /> Account Management
          </h4>
          <button className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-300">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );

  // Render different content based on active tab
  const renderContent = () => {
    switch(activeTab) {
      case 'profile':
        return <ProfileContent />;
      case 'settings':
        return <SettingsContent />;
      default:
        return <ProfileContent />;
    }
  };

  if (loading && !userData.email) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050A30] to-[#0A1045] flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050A30] to-[#0A1045]">
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar />
      
      {/* Profile Header */}
      <div className="pt-24 pb-10">
        <div className="container mx-auto px-4">
          <div className="bg-blue-900 bg-opacity-30 backdrop-blur-sm rounded-xl p-8 border border-blue-800 shadow-xl">
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-32 h-32 rounded-full bg-blue-800 flex items-center justify-center mb-6 md:mb-0 md:mr-8">
                {userData.profileImage ? (
                  <img 
                    src={userData.profileImage} 
                    alt={userData.name} 
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <FaUserCircle className="w-24 h-24 text-blue-300" />
                )}
              </div>
              
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold text-white mb-2">{userData.name}</h2>
                <div className="inline-block px-3 py-1 rounded-full bg-blue-800 bg-opacity-50 text-blue-200 text-sm font-medium mb-4">
                  Questor Member
                </div>
                {userData.bio && (
                  <p className="text-blue-200 max-w-lg">{userData.bio}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Profile Content */}
      <div className="container mx-auto px-4 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-[#0A1045] bg-opacity-80 rounded-lg p-4 shadow-xl border border-blue-900 sticky top-24">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                      activeTab === 'profile' 
                        ? 'bg-blue-700 text-white' 
                        : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                    } transition duration-300`}
                  >
                    <FaUserCircle className="mr-3" />
                    Profile
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                      activeTab === 'settings' 
                        ? 'bg-blue-700 text-white' 
                        : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                    } transition duration-300`}
                  >
                    <FaCog className="mr-3" />
                    Settings
                  </button>
                </li>
              </ul>
              
              <div className="mt-8 pt-6 border-t border-blue-800">
                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-3 rounded-lg flex items-center text-red-400 hover:bg-red-900 hover:bg-opacity-30 hover:text-red-300 transition duration-300"
                >
                  <FaSignOutAlt className="mr-3" />
                  Logout
                </button>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:w-3/4">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;