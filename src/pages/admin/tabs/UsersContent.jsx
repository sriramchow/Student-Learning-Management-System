import React, { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaUserEdit, 
  FaUserSlash, 
  FaUserCheck, 
  FaTrash, 
  FaSearch, 
  FaFilter,
  FaSort,
  FaEllipsisV,
  FaCalendarAlt,
  FaEnvelope,
  FaPhone
} from 'react-icons/fa';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';

const UsersContent = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(null);
  
  const db = getFirestore();
  const auth = getAuth();
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Fetch users from Firestore
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(usersQuery);
      
      // Convert query snapshot to array of user objects, excluding the admin
      const usersList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() 
            ? doc.data().createdAt.toDate().toLocaleDateString() 
            : 'Unknown'
        }))
        .filter(user => !user.isAdmin && user.email !== 'admin@questor.com'); // Exclude admin users
      
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };
  
  // Enable or disable a user account
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        isActive: !currentStatus
      });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? {...user, isActive: !currentStatus} : user
        )
      );
      
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      setActionMenuOpen(null);
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    }
  };
  
  // Delete a user
  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    
    try {
      // Delete user document from Firestore
      await deleteDoc(doc(db, "users", userId));
      
      // Update local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      toast.success("User deleted successfully");
      setActionMenuOpen(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };
  
  // Toggle action menu for a user
  const toggleActionMenu = (userId) => {
    setActionMenuOpen(actionMenuOpen === userId ? null : userId);
  };
  
  // Toggle user details view
  const toggleUserDetails = (userId) => {
    setUserDetailsOpen(userDetailsOpen === userId ? null : userId);
  };
  
  // Handle search and filtering
  const getFilteredUsers = () => {
    return users
      .filter(user => {
        // Search by name or email
        const matchesSearch = 
          (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
        // Filter by status
        const matchesFilter = 
          filterStatus === 'all' || 
          (filterStatus === 'active' && user.isActive !== false) || 
          (filterStatus === 'inactive' && user.isActive === false);
        
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        // Sort users
        let aValue = (a[sortBy] || '').toString().toLowerCase();
        let bValue = (b[sortBy] || '').toString().toLowerCase();
        
        if (sortBy === 'createdAt') {
          // Parse dates for proper sorting
          aValue = a.createdAt && a.createdAt !== 'Unknown' 
            ? new Date(a.createdAt) 
            : new Date(0);
          bValue = b.createdAt && b.createdAt !== 'Unknown' 
            ? new Date(b.createdAt) 
            : new Date(0);
        }
        
        // Apply sort order
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
  };
  
  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      // If clicking the same field, toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set as the sort field and default to ascending
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  const filteredUsers = getFilteredUsers();
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading users...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        {/* Search Box */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg px-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
        </div>
        
        {/* Filter and Sort Controls */}
        <div className="flex space-x-4">
          {/* Filter by status */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Users</option>
              <option value="active">Active Users</option>
              <option value="inactive">Inactive Users</option>
            </select>
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
          </div>
          
          {/* Sort by field */}
          <div className="relative">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="appearance-none bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="email-asc">Email (A-Z)</option>
              <option value="email-desc">Email (Z-A)</option>
              <option value="createdAt-asc">Join Date (Oldest)</option>
              <option value="createdAt-desc">Join Date (Newest)</option>
            </select>
            <FaSort className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
          </div>
        </div>
      </div>
      
      {/* User Count Summary */}
      <div className="bg-blue-900 bg-opacity-20 rounded-lg p-4 border border-blue-800">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="bg-blue-700 p-2 rounded-full mr-2">
              <FaUsers className="text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-300">Total Users</p>
              <p className="text-white font-medium">{users.length}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="bg-green-700 p-2 rounded-full mr-2">
              <FaUserCheck className="text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-300">Active Users</p>
              <p className="text-white font-medium">
                {users.filter(u => u.isActive !== false).length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="bg-red-700 p-2 rounded-full mr-2">
              <FaUserSlash className="text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-300">Inactive Users</p>
              <p className="text-white font-medium">
                {users.filter(u => u.isActive === false).length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="bg-blue-900 bg-opacity-20 rounded-xl p-8 text-center border border-blue-800">
          <FaUsers className="text-4xl text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl text-white font-medium mb-2">No Users Found</h3>
          <p className="text-blue-300">
            {users.length === 0
              ? "There are no registered users in the system."
              : "No users match your search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="bg-blue-900 bg-opacity-20 rounded-xl border border-blue-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-blue-300 border-b border-blue-800 bg-blue-900 bg-opacity-50">
                  <th className="px-6 py-3 cursor-pointer" onClick={() => handleSortChange('name')}>
                    <div className="flex items-center">
                      User 
                      {sortBy === 'name' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 cursor-pointer" onClick={() => handleSortChange('email')}>
                    <div className="flex items-center">
                      Email
                      {sortBy === 'email' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 cursor-pointer" onClick={() => handleSortChange('createdAt')}>
                    <div className="flex items-center">
                      Joined
                      {sortBy === 'createdAt' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <React.Fragment key={user.id}>
                    <tr className={`border-b border-blue-800 ${userDetailsOpen === user.id ? 'bg-blue-800 bg-opacity-30' : 'hover:bg-blue-800 hover:bg-opacity-30'} transition duration-150`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center mr-3 text-sm">
                            {user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
                          </div>
                          <span 
                            className="text-white cursor-pointer hover:text-blue-300"
                            onClick={() => toggleUserDetails(user.id)}
                          >
                            {user.name || 'Unnamed User'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-blue-200">{user.email || 'No email'}</td>
                      <td className="px-6 py-4 text-blue-200">{user.createdAt}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                          user.isActive !== false 
                            ? 'bg-green-900 text-green-300' 
                            : 'bg-red-900 text-red-300'
                        }`}>
                          {user.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center">
                          <div className="relative">
                            <button
                              onClick={() => toggleActionMenu(user.id)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <FaEllipsisV />
                            </button>
                            
                            {/* Action Menu Dropdown */}
                            {actionMenuOpen === user.id && (
                              <div className="absolute right-0 z-10 mt-2 w-48 rounded-md shadow-lg bg-blue-800 ring-1 ring-black ring-opacity-5">
                                <div className="py-1">
                                  <button
                                    onClick={() => toggleUserStatus(user.id, user.isActive !== false)}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-blue-200 hover:bg-blue-700 hover:text-white"
                                  >
                                    {user.isActive !== false ? (
                                      <>
                                        <FaUserSlash className="mr-2" />
                                        Deactivate User
                                      </>
                                    ) : (
                                      <>
                                        <FaUserCheck className="mr-2" />
                                        Activate User
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => deleteUser(user.id)}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900 hover:bg-opacity-50 hover:text-red-200"
                                  >
                                    <FaTrash className="mr-2" />
                                    Delete User
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expandable User Details */}
                    {userDetailsOpen === user.id && (
                      <tr className="bg-blue-800 bg-opacity-30">
                        <td colSpan="5" className="px-6 py-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <h4 className="text-white font-medium">User Details</h4>
                              
                              <div className="flex items-center">
                                <FaEnvelope className="text-blue-400 mr-2" />
                                <div>
                                  <p className="text-xs text-blue-300">Email</p>
                                  <p className="text-white">{user.email || 'No email'}</p>
                                </div>
                              </div>
                              
                              {user.phone && (
                                <div className="flex items-center">
                                  <FaPhone className="text-blue-400 mr-2" />
                                  <div>
                                    <p className="text-xs text-blue-300">Phone</p>
                                    <p className="text-white">{user.phone}</p>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center">
                                <FaCalendarAlt className="text-blue-400 mr-2" />
                                <div>
                                  <p className="text-xs text-blue-300">Joined</p>
                                  <p className="text-white">{user.createdAt}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              {user.bio && (
                                <div>
                                  <h4 className="text-white font-medium mb-1">Bio</h4>
                                  <p className="text-blue-200 bg-blue-900 bg-opacity-40 p-3 rounded-lg">{user.bio}</p>
                                </div>
                              )}
                              
                              {user.interests && user.interests.length > 0 && (
                                <div>
                                  <h4 className="text-white font-medium mb-1">Interests</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {user.interests.map((interest, index) => (
                                      <span 
                                        key={index} 
                                        className="bg-blue-900 text-blue-200 px-3 py-1 rounded-full text-xs"
                                      >
                                        {interest}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {user.socialMedia && Object.values(user.socialMedia).some(value => value) && (
                                <div>
                                  <h4 className="text-white font-medium mb-1">Social Media</h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    {user.socialMedia.facebook && (
                                      <a 
                                        href={user.socialMedia.facebook}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-300 hover:text-blue-200 transition text-sm"
                                      >
                                        Facebook
                                      </a>
                                    )}
                                    {user.socialMedia.twitter && (
                                      <a 
                                        href={user.socialMedia.twitter}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-300 hover:text-blue-200 transition text-sm"
                                      >
                                        Twitter
                                      </a>
                                    )}
                                    {user.socialMedia.linkedin && (
                                      <a 
                                        href={user.socialMedia.linkedin}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-300 hover:text-blue-200 transition text-sm"
                                      >
                                        LinkedIn
                                      </a>
                                    )}
                                    {user.socialMedia.instagram && (
                                      <a 
                                        href={user.socialMedia.instagram}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-300 hover:text-blue-200 transition text-sm"
                                      >
                                        Instagram
                                      </a>
                                    )}
                                    {user.socialMedia.github && (
                                      <a 
                                        href={user.socialMedia.github}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-300 hover:text-blue-200 transition text-sm"
                                      >
                                        GitHub
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersContent;