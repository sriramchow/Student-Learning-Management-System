import React, { useState, useEffect } from 'react';
import { 
  FaEnvelope, 
  FaTrash, 
  FaReply, 
  FaSearch, 
  FaFilter,
  FaSort,
  FaCheck,
  FaEye,
  FaEyeSlash,
  FaExclamationCircle,
  FaUser,
  FaCalendarAlt,
  FaInbox,
  FaArchive,
  FaPhoneAlt,
  FaArrowDown,
  FaArrowUp
} from 'react-icons/fa';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { toast } from 'react-toastify';

const ContactContent = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedMessage, setExpandedMessage] = useState(null);
  
  const db = getFirestore();
  
  useEffect(() => {
    fetchContacts();
  }, []);
  
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const contactsQuery = query(collection(db, "contactMessages"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(contactsQuery);
      
      const contactsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() 
          ? doc.data().createdAt.toDate().toLocaleDateString() 
          : 'Unknown',
        createdAtTimestamp: doc.data().createdAt?.toDate?.() 
          ? doc.data().createdAt.toDate() 
          : new Date(0)
      }));
      
      setContacts(contactsList);
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      toast.error("Failed to load contact messages");
    } finally {
      setLoading(false);
    }
  };
  
  // Mark message as read/answered
  const markMessageAsAnswered = async (messageId) => {
    try {
      const messageRef = doc(db, "contactMessages", messageId);
      await updateDoc(messageRef, {
        status: 'answered'
      });
      
      // Update local state
      setContacts(prevContacts => 
        prevContacts.map(contact => 
          contact.id === messageId ? {...contact, status: 'answered'} : contact
        )
      );
      
      toast.success("Message marked as answered");
    } catch (error) {
      console.error("Error updating message status:", error);
      toast.error("Failed to update message status");
    }
  };
  
  // Delete a message
  const deleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message? This action cannot be undone.")) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, "contactMessages", messageId));
      
      // Update local state
      setContacts(prevContacts => prevContacts.filter(contact => contact.id !== messageId));
      
      toast.success("Message deleted successfully");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };
  
  // Toggle expanded view of a message
  const toggleExpandMessage = (messageId) => {
    setExpandedMessage(expandedMessage === messageId ? null : messageId);
  };
  
  // Filter and sort contacts
  const getFilteredContacts = () => {
    return contacts
      .filter(contact => {
        // Search by name, email, subject or message content
        const matchesSearch = 
          (contact.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (contact.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (contact.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (contact.message?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
        // Filter by status
        const matchesStatus = 
          filterStatus === 'all' || 
          (filterStatus === 'new' && contact.status === 'new') || 
          (filterStatus === 'answered' && contact.status === 'answered');
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let aValue, bValue;
        
        if (sortBy === 'createdAt') {
          // Use the timestamp for date sorting
          aValue = a.createdAtTimestamp;
          bValue = b.createdAtTimestamp;
        } else if (sortBy === 'name') {
          aValue = a.name || '';
          bValue = b.name || '';
        } else if (sortBy === 'email') {
          aValue = a.email || '';
          bValue = b.email || '';
        } else if (sortBy === 'subject') {
          aValue = a.subject || '';
          bValue = b.subject || '';
        }
        
        // Handle string comparison
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        // Apply sort order
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
  };
  
  // Calculate stats
  const calculateStats = () => {
    const totalMessages = contacts.length;
    const newMessages = contacts.filter(c => c.status === 'new').length;
    const answeredMessages = contacts.filter(c => c.status === 'answered').length;
    const responseRate = totalMessages > 0 ? Math.round((answeredMessages / totalMessages) * 100) : 0;
    
    return {
      totalMessages,
      newMessages,
      answeredMessages,
      responseRate
    };
  };
  
  const stats = calculateStats();
  const filteredContacts = getFilteredContacts();
  
  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      // If clicking the same field, toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set as the sort field and default to descending for dates, ascending for others
      setSortBy(field);
      setSortOrder(field === 'createdAt' ? 'desc' : 'asc');
    }
  };
  
  // Format timestamp to show relative time
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const diff = now - timestamp;
    
    // Convert milliseconds to days/hours/minutes
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading contact messages...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-900 bg-opacity-20 rounded-lg p-4 border border-blue-800">
          <div className="flex items-center">
            <div className="bg-blue-700 p-2 rounded-full mr-3">
              <FaInbox className="text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-300">Total Messages</p>
              <p className="text-white text-2xl font-semibold">{stats.totalMessages}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-900 bg-opacity-20 rounded-lg p-4 border border-blue-800">
          <div className="flex items-center">
            <div className="bg-yellow-700 p-2 rounded-full mr-3">
              <FaExclamationCircle className="text-yellow-300" />
            </div>
            <div>
              <p className="text-sm text-blue-300">New Messages</p>
              <p className="text-white text-2xl font-semibold">{stats.newMessages}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-900 bg-opacity-20 rounded-lg p-4 border border-blue-800">
          <div className="flex items-center">
            <div className="bg-green-700 p-2 rounded-full mr-3">
              <FaCheck className="text-green-300" />
            </div>
            <div>
              <p className="text-sm text-blue-300">Answered Messages</p>
              <p className="text-white text-2xl font-semibold">{stats.answeredMessages}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-900 bg-opacity-20 rounded-lg p-4 border border-blue-800">
          <div className="flex items-center">
            <div className="bg-indigo-700 p-2 rounded-full mr-3">
              <FaArchive className="text-indigo-300" />
            </div>
            <div>
              <p className="text-sm text-blue-300">Response Rate</p>
              <p className="text-white text-2xl font-semibold">{stats.responseRate}%</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters Row */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Box */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg px-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
        </div>
        
        {/* Filter by Status */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Messages</option>
            <option value="new">New Messages</option>
            <option value="answered">Answered Messages</option>
          </select>
          <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
        </div>
        
        {/* Sort Options */}
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
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="email-asc">Email (A-Z)</option>
            <option value="email-desc">Email (Z-A)</option>
            <option value="subject-asc">Subject (A-Z)</option>
            <option value="subject-desc">Subject (Z-A)</option>
          </select>
          <FaSort className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
        </div>
      </div>
      
      {/* Contact Messages List */}
      {filteredContacts.length === 0 ? (
        <div className="bg-blue-900 bg-opacity-20 rounded-xl p-8 text-center border border-blue-800">
          <FaEnvelope className="text-4xl text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl text-white font-medium mb-2">No Messages Found</h3>
          <p className="text-blue-300">
            {contacts.length === 0
              ? "There are no contact messages in the system yet."
              : "No messages match your search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContacts.map(contact => (
            <div 
              key={contact.id}
              className={`bg-blue-900 bg-opacity-20 rounded-xl border ${
                contact.status === 'new' 
                  ? 'border-yellow-600' 
                  : 'border-blue-800'
              } overflow-hidden`}
            >
              {/* Message Header */}
              <div 
                className={`p-4 cursor-pointer ${
                  contact.status === 'new' ? 'bg-yellow-900 bg-opacity-10' : ''
                }`}
                onClick={() => toggleExpandMessage(contact.id)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center mr-3 text-sm">
                      {contact.name ? contact.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-white font-medium mr-2">{contact.name || 'Anonymous'}</h3>
                        {contact.status === 'new' && (
                          <span className="bg-yellow-900 text-yellow-300 text-xs px-2 py-1 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      
                      <p className="text-blue-300 text-sm">{contact.email}</p>
                      
                      <div className="mt-1">
                        <h4 className="text-white text-sm font-medium">{contact.subject || 'No Subject'}</h4>
                        <p className="text-blue-200 text-sm truncate pr-4 max-w-md">
                          {contact.message.substring(0, 60)}
                          {contact.message.length > 60 ? '...' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-2 md:mt-0">
                    <span className="text-blue-300 text-xs mr-2">
                      {formatRelativeTime(contact.createdAtTimestamp)}
                    </span>
                    {expandedMessage === contact.id ? (
                      <FaArrowUp className="text-blue-300" />
                    ) : (
                      <FaArrowDown className="text-blue-300" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Expanded Message Content */}
              {expandedMessage === contact.id && (
                <div className="px-4 pb-4 border-t border-blue-800 pt-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Message Details */}
                    <div className="bg-blue-800 bg-opacity-30 p-4 rounded-lg border border-blue-700">
                      <h4 className="text-white font-medium mb-3">Message</h4>
                      <p className="text-blue-100 whitespace-pre-line">{contact.message}</p>
                    </div>
                    
                    {/* Contact Information */}
                    <div className="space-y-4">
                      <div className="bg-blue-800 bg-opacity-30 p-4 rounded-lg border border-blue-700">
                        <h4 className="text-white font-medium mb-3">Contact Information</h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <FaUser className="text-blue-400 mt-1 mr-3" />
                            <div>
                              <p className="text-xs text-blue-300">Name</p>
                              <p className="text-white">{contact.name || 'Not provided'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <FaEnvelope className="text-blue-400 mt-1 mr-3" />
                            <div>
                              <p className="text-xs text-blue-300">Email</p>
                              <p className="text-white">{contact.email}</p>
                            </div>
                          </div>
                          
                          {contact.phone && (
                            <div className="flex items-start">
                              <FaPhoneAlt className="text-blue-400 mt-1 mr-3" />
                              <div>
                                <p className="text-xs text-blue-300">Phone</p>
                                <p className="text-white">{contact.phone}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-start">
                            <FaCalendarAlt className="text-blue-400 mt-1 mr-3" />
                            <div>
                              <p className="text-xs text-blue-300">Received</p>
                              <p className="text-white">{contact.createdAt}</p>
                            </div>
                          </div>
                          
                          {contact.userLoggedIn !== undefined && (
                            <div className="flex items-start">
                              <FaUser className="text-blue-400 mt-1 mr-3" />
                              <div>
                                <p className="text-xs text-blue-300">User Status</p>
                                <p className="text-white">
                                  {contact.userLoggedIn 
                                    ? `Logged in user (ID: ${contact.userId || 'Unknown'})` 
                                    : 'Not logged in'
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <a 
                          href={`mailto:${contact.email}?subject=Re: ${contact.subject || 'Your message to Questor'}`}
                          className="flex-1 bg-blue-700 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <FaReply className="mr-2" /> Reply by Email
                        </a>
                        
                        {contact.status === 'new' && (
                          <button 
                            onClick={() => markMessageAsAnswered(contact.id)}
                            className="flex-1 bg-green-700 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
                          >
                            <FaCheck className="mr-2" /> Mark as Answered
                          </button>
                        )}
                        
                        <button 
                          onClick={() => deleteMessage(contact.id)}
                          className="flex-1 bg-red-700 hover:bg-red-600 text-white py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <FaTrash className="mr-2" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactContent;