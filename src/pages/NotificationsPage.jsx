import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  doc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';

const NotificationsPage = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const db = getFirestore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Check if user is authenticated
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // If not authenticated, redirect to login
        navigate('/');
      }
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth, navigate]);
  
  // Fetch notifications
  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Two queries to get notifications
    // 1. User-specific notifications (if any)
    // 2. Global notifications based on target user type
    
    // For user-specific notifications
    const userSpecificQuery = query(
      collection(db, "notifications"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );
    
    // For global notifications
    const globalQuery = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc")
    );
    
    // Listen for global notifications
    const unsubscribeGlobal = onSnapshot(globalQuery, (snapshot) => {
      const currentTime = new Date();
      const userId = auth.currentUser.uid;
      
      // Get user email to check if the user is premium (contains 'premium' in email)
      const userEmail = auth.currentUser.email || '';
      const isPremiumUser = userEmail.includes('premium');
      
      // Filter notifications based on targetUserType
      const globalNotifications = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          read: doc.data().readBy?.includes(userId) || false
        }))
        .filter(notification => {
          // Check if notification has expired
          if (notification.expiresAt && notification.expiresAt.toDate) {
            const expiryDate = notification.expiresAt.toDate();
            if (expiryDate < currentTime) {
              return false; // Skip expired notifications
            }
          }
          
          // Check target user type
          const targetType = notification.targetUserType || 'all';
          
          if (targetType === 'all') {
            return true; // Show to all users
          } else if (targetType === 'premium' && isPremiumUser) {
            return true; // Show to premium users only
          } else if (targetType === 'new_users') {
            // Check if user account is less than 30 days old
            if (auth.currentUser.metadata && auth.currentUser.metadata.creationTime) {
              const creationTime = new Date(auth.currentUser.metadata.creationTime);
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              return creationTime > thirtyDaysAgo;
            }
            return false;
          } else if (targetType === 'students') {
            // Here you'd need custom logic to determine if a user is a student
            // For now, let's assume all non-premium users are students
            return !isPremiumUser;
          }
          
          return false;
        });
      
      setNotifications(globalNotifications);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
      setLoading(false);
    });
    
    return () => {
      unsubscribeGlobal();
    };
  }, [auth.currentUser, db]);
  
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      
      // Add current user's ID to the readBy array
      await updateDoc(notificationRef, {
        readBy: arrayUnion(auth.currentUser.uid)
      });
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      toast.success("Marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to update notification");
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      
      // Filter only unread notifications
      const unreadNotifications = notifications.filter(notification => !notification.read);
      
      if (unreadNotifications.length === 0) {
        toast.info("No unread notifications");
        return;
      }
      
      // Update each notification
      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, "notifications", notification.id);
        batch.update(notificationRef, {
          readBy: arrayUnion(auth.currentUser.uid)
        });
      });
      
      await batch.commit();
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to update notifications");
    }
  };
  
  // Delete notification (just hide it for the current user)
  const deleteNotification = async (notificationId) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      
      // Add to deletedBy array instead of actually deleting
      await updateDoc(notificationRef, {
        deletedBy: arrayUnion(auth.currentUser.uid)
      });
      
      // Remove from local state
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
      
      toast.success("Notification removed");
    } catch (error) {
      console.error("Error removing notification:", error);
      toast.error("Failed to remove notification");
    }
  };
  
  // Clear all notifications (just hide them for the current user)
  const clearAllNotifications = async () => {
    try {
      const batch = writeBatch(db);
      
      if (notifications.length === 0) {
        toast.info("No notifications to clear");
        return;
      }
      
      // Mark all as deleted for this user
      notifications.forEach(notification => {
        const notificationRef = doc(db, "notifications", notification.id);
        batch.update(notificationRef, {
          deletedBy: arrayUnion(auth.currentUser.uid)
        });
      });
      
      await batch.commit();
      
      // Clear local state
      setNotifications([]);
      
      toast.success("All notifications cleared");
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast.error("Failed to clear notifications");
    }
  };
  
  // Determine notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return (
          <div className="w-10 h-10 rounded-full bg-green-600 bg-opacity-20 flex items-center justify-center text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="w-10 h-10 rounded-full bg-yellow-600 bg-opacity-20 flex items-center justify-center text-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-10 h-10 rounded-full bg-red-600 bg-opacity-20 flex items-center justify-center text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'course':
        return (
          <div className="w-10 h-10 rounded-full bg-purple-600 bg-opacity-20 flex items-center justify-center text-purple-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        );
      case 'user':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-600 bg-opacity-20 flex items-center justify-center text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      case 'announcement':
      case 'info':
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-blue-600 bg-opacity-20 flex items-center justify-center text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };
  
  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} ${diffInSeconds === 1 ? 'second' : 'seconds'} ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('en-US', options);
  };
  
  return (
    <div className="bg-[#050A30] min-h-screen text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Notifications</h1>
          
          <div className="flex gap-3">
            <button
              onClick={markAllAsRead}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Mark All as Read
            </button>
            <button
              onClick={clearAllNotifications}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
        
        <div className="bg-[#0A1045] rounded-xl border border-blue-800 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-blue-300">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-900 bg-opacity-20 flex items-center justify-center text-blue-400 mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Notifications</h3>
              <p className="text-blue-300">You don't have any notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-blue-800">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`flex gap-4 p-4 hover:bg-blue-900 hover:bg-opacity-30 transition-colors ${
                    notification.read ? 'opacity-70' : ''
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                  
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-semibold text-lg">
                        {notification.title}
                        {!notification.read && (
                          <span className="ml-2 bg-blue-500 rounded-full h-2 w-2 inline-block"></span>
                        )}
                      </h3>
                      <span className="text-xs text-blue-300">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-blue-200 mb-2">{notification.message}</p>
                    
                    <div className="flex gap-3 mt-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Mark as read
                        </button>
                      )}
                      
                      {notification.link && (
                        <button
                          onClick={() => {
                            markAsRead(notification.id);
                            navigate(notification.link);
                          }}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          View details
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-xs text-red-400 hover:text-red-300 ml-auto"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default NotificationsPage;