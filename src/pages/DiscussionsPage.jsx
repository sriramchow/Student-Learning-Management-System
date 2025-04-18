import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  getFirestore, 
  collection, 
  doc,
  addDoc, 
  updateDoc,
  deleteDoc,
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  increment,
  arrayUnion,
  arrayRemove,
  getDocs
} from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';

// Icons for the discussion forum
const UpvoteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);

const DownvoteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const CommentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
  </svg>
);

const DiscussionsPage = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const db = getFirestore();
  
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [commentForms, setCommentForms] = useState({});
  const [commentContents, setCommentContents] = useState({});
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  
  // Check if user is authenticated
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // If not authenticated, redirect to login
        navigate('/');
      } else {
        setUserDetails({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email.split('@')[0]}&background=0D8ABC&color=fff`
        });
      }
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth, navigate]);
  
  // Fetch discussion groups
  useEffect(() => {
    if (!auth.currentUser) return;
    
    const groupsQuery = query(
      collection(db, "discussionGroups"),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(groupsQuery, (snapshot) => {
      const fetchedGroups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroups(fetchedGroups);
      setLoading(false);
      
      // Auto-select the first group if none is selected
      if (!selectedGroup && fetchedGroups.length > 0) {
        setSelectedGroup(fetchedGroups[0]);
      }
    }, (error) => {
      console.error("Error fetching groups:", error);
      toast.error("Failed to load discussion groups");
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [auth.currentUser, db, selectedGroup]);
  
  // Fetch posts for selected group
  useEffect(() => {
    if (!selectedGroup) return;
    
    const postsQuery = query(
      collection(db, "discussionPosts"),
      where("groupId", "==", selectedGroup.id),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        comments: []
      }));
      
      // Fetch comments for each post
      const fetchComments = async () => {
        for (const post of fetchedPosts) {
          const commentsQuery = query(
            collection(db, "postComments"),
            where("postId", "==", post.id),
            orderBy("createdAt", "asc")
          );
          
          const commentsSnapshot = await getDocs(commentsQuery);
          post.comments = commentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        }
        setPosts([...fetchedPosts]);
      };
      
      fetchComments();
    }, (error) => {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load discussion posts");
    });
    
    return () => unsubscribe();
  }, [db, selectedGroup]);
  
  // Create a new discussion group
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
    if (!newGroupName.trim()) {
      toast.error("Group name cannot be empty");
      return;
    }
    
    try {
      const groupRef = await addDoc(collection(db, "discussionGroups"), {
        name: newGroupName.trim(),
        createdBy: auth.currentUser.uid,
        createdByName: userDetails.displayName,
        createdAt: serverTimestamp(),
        memberCount: 1,
        members: [auth.currentUser.uid]
      });
      
      setNewGroupName('');
      setIsCreatingGroup(false);
      setSelectedGroup({ id: groupRef.id, name: newGroupName.trim() });
      toast.success("Group created successfully!");
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
    }
  };
  
  // Create a new post in the selected group
  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    if (!newPostContent.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }
    
    if (!selectedGroup) {
      toast.error("Please select a group first");
      return;
    }
    
    try {
      await addDoc(collection(db, "discussionPosts"), {
        content: newPostContent.trim(),
        groupId: selectedGroup.id,
        groupName: selectedGroup.name,
        userId: auth.currentUser.uid,
        userName: userDetails.displayName,
        userPhotoURL: userDetails.photoURL,
        createdAt: serverTimestamp(),
        upvotes: 0,
        downvotes: 0,
        upvotedBy: [],
        downvotedBy: [],
        commentCount: 0
      });
      
      setNewPostContent('');
      setShowNewPostForm(false);
      toast.success("Post created successfully!");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    }
  };
  
  // Add a comment to a post
  const handleAddComment = async (postId) => {
    const commentContent = commentContents[postId];
    
    if (!commentContent || !commentContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    
    try {
      const commentRef = await addDoc(collection(db, "postComments"), {
        content: commentContent.trim(),
        postId: postId,
        userId: auth.currentUser.uid,
        userName: userDetails.displayName,
        userPhotoURL: userDetails.photoURL,
        createdAt: serverTimestamp(),
        upvotes: 0,
        downvotes: 0,
        upvotedBy: [],
        downvotedBy: []
      });
      
      // Update comment count in the post
      const postRef = doc(db, "discussionPosts", postId);
      await updateDoc(postRef, {
        commentCount: increment(1)
      });
      
      // Clear comment form
      setCommentContents(prev => ({ ...prev, [postId]: '' }));
      setCommentForms(prev => ({ ...prev, [postId]: false }));
      
      toast.success("Comment added successfully!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };
  
  // Handle voting for posts and comments
  const handleVote = async (itemId, itemType, voteType) => {
    if (!auth.currentUser) return;
    
    const userId = auth.currentUser.uid;
    const isPost = itemType === 'post';
    const collectionName = isPost ? "discussionPosts" : "postComments";
    const itemRef = doc(db, collectionName, itemId);
    
    try {
      // Get current item data
      const items = isPost ? posts : 
        posts.flatMap(post => post.comments.map(comment => ({ ...comment, postId: post.id })));
      const item = items.find(item => item.id === itemId);
      
      if (!item) {
        console.error("Item not found");
        return;
      }
      
      const alreadyUpvoted = item.upvotedBy?.includes(userId);
      const alreadyDownvoted = item.downvotedBy?.includes(userId);
      
      let updateData = {};
      
      // Handle upvote
      if (voteType === 'upvote') {
        if (alreadyUpvoted) {
          // Remove upvote
          updateData = {
            upvotes: increment(-1),
            upvotedBy: arrayRemove(userId)
          };
        } else {
          // Add upvote
          updateData = {
            upvotes: increment(1),
            upvotedBy: arrayUnion(userId)
          };
          
          // If already downvoted, remove downvote
          if (alreadyDownvoted) {
            updateData.downvotes = increment(-1);
            updateData.downvotedBy = arrayRemove(userId);
          }
        }
      } 
      // Handle downvote
      else if (voteType === 'downvote') {
        if (alreadyDownvoted) {
          // Remove downvote
          updateData = {
            downvotes: increment(-1),
            downvotedBy: arrayRemove(userId)
          };
        } else {
          // Add downvote
          updateData = {
            downvotes: increment(1),
            downvotedBy: arrayUnion(userId)
          };
          
          // If already upvoted, remove upvote
          if (alreadyUpvoted) {
            updateData.upvotes = increment(-1);
            updateData.upvotedBy = arrayRemove(userId);
          }
        }
      }
      
      await updateDoc(itemRef, updateData);
    } catch (error) {
      console.error("Error updating vote:", error);
      toast.error("Failed to register vote");
    }
  };
  
  // Handle joining a group
  const handleJoinGroup = async (groupId) => {
    if (!auth.currentUser) return;
    
    try {
      const groupRef = doc(db, "discussionGroups", groupId);
      await updateDoc(groupRef, {
        memberCount: increment(1),
        members: arrayUnion(auth.currentUser.uid)
      });
      
      toast.success("Joined group successfully!");
    } catch (error) {
      console.error("Error joining group:", error);
      toast.error("Failed to join group");
    }
  };
  
  // Handle leaving a group
  const handleLeaveGroup = async (groupId) => {
    if (!auth.currentUser) return;
    
    try {
      const groupRef = doc(db, "discussionGroups", groupId);
      await updateDoc(groupRef, {
        memberCount: increment(-1),
        members: arrayRemove(auth.currentUser.uid)
      });
      
      toast.success("Left group successfully!");
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error("Failed to leave group");
    }
  };
  
  // Delete a post (only for post creator)
  const handleDeletePost = async (postId) => {
    if (!auth.currentUser) return;
    
    try {
      // Delete the post
      await deleteDoc(doc(db, "discussionPosts", postId));
      
      // Delete all comments for this post
      const commentsQuery = query(
        collection(db, "postComments"),
        where("postId", "==", postId)
      );
      
      const commentsSnapshot = await getDocs(commentsQuery);
      commentsSnapshot.docs.forEach(async (commentDoc) => {
        await deleteDoc(doc(db, "postComments", commentDoc.id));
      });
      
      toast.success("Post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };
  
  // Delete a comment (only for comment creator)
  const handleDeleteComment = async (commentId, postId) => {
    if (!auth.currentUser) return;
    
    try {
      // Delete the comment
      await deleteDoc(doc(db, "postComments", commentId));
      
      // Update comment count in the post
      const postRef = doc(db, "discussionPosts", postId);
      await updateDoc(postRef, {
        commentCount: increment(-1)
      });
      
      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };
  
  // Function to format timestamp
  const formatTimestamp = (timestamp) => {
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
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
  };
  
  // Toggle comment form
  const toggleCommentForm = (postId) => {
    setCommentForms(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };
  
  // Handle comment content change
  const handleCommentChange = (postId, content) => {
    setCommentContents(prev => ({
      ...prev,
      [postId]: content
    }));
  };
  
  // Check if user is member of a group
  const isGroupMember = (group) => {
    if (!auth.currentUser || !group) return false;
    return group.members?.includes(auth.currentUser.uid);
  };
  
  return (
    <div className="bg-[#050A30] max-h-[2048px] text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar - Discussion Groups */}
          <div className="w-full md:w-1/4 bg-[#0A1045] rounded-xl p-4 border border-blue-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Discussion Groups</h2>
              <button 
                onClick={() => setIsCreatingGroup(!isCreatingGroup)}
                className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
              >
                Create Group
              </button>
            </div>
            
            {/* Create Group Form */}
            {isCreatingGroup && (
              <form onSubmit={handleCreateGroup} className="mb-4 p-3 bg-blue-900 bg-opacity-20 rounded-lg">
                <input
                  type="text"
                  placeholder="Group Name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-[#050A30] border border-blue-700 rounded-lg px-3 py-2 text-white placeholder-blue-300 mb-2"
                  maxLength={50}
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingGroup(false)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            
            {/* Groups List */}
            {loading ? (
              <div className="text-blue-300 text-center py-8">Loading groups...</div>
            ) : groups.length === 0 ? (
              <div className="text-blue-300 text-center py-8">
                No discussion groups yet. Be the first to create one!
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                {groups.map(group => (
                  <div 
                    key={group.id} 
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedGroup?.id === group.id
                        ? "bg-blue-800 bg-opacity-50"
                        : "bg-blue-900 bg-opacity-20 hover:bg-blue-800 hover:bg-opacity-30"
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium truncate">{group.name}</h3>
                      <span className="text-xs text-blue-300">{group.memberCount || 0} members</span>
                    </div>
                    {isGroupMember(group) ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeaveGroup(group.id);
                        }}
                        className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Leave Group
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinGroup(group.id);
                        }}
                        className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Join Group
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Main Content - Posts */}
          <div className="w-full md:w-3/4 bg-[#0A1045] rounded-xl p-4 border border-blue-800">
            {selectedGroup ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">{selectedGroup.name}</h1>
                  <button
                    onClick={() => setShowNewPostForm(!showNewPostForm)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    New Post
                  </button>
                </div>
                
                {/* New Post Form */}
                {showNewPostForm && (
                  <form onSubmit={handleCreatePost} className="mb-6 p-4 bg-blue-900 bg-opacity-20 rounded-lg">
                    <textarea
                      placeholder="What's on your mind?"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="w-full bg-[#050A30] border border-blue-700 rounded-lg px-4 py-3 text-white placeholder-blue-300 mb-3 min-h-[100px]"
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Post
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewPostForm(false);
                          setNewPostContent('');
                        }}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
                
                {/* Posts List */}
                {posts.length === 0 ? (
                  <div className="text-blue-300 text-center py-16">
                    No posts in this group yet. Be the first to start a discussion!
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                    {posts.map(post => (
                      <div key={post.id} className="bg-blue-900 bg-opacity-20 rounded-lg p-4 border border-blue-800">
                        {/* Post Header */}
                        <div className="flex justify-between mb-3">
                          <div className="flex items-center">
                            <img 
                              src={post.userPhotoURL} 
                              alt={post.userName}
                              className="w-8 h-8 rounded-full mr-3"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${post.userName}&background=0D8ABC&color=fff`;
                              }}
                            />
                            <div>
                              <div className="font-medium">{post.userName}</div>
                              <div className="text-xs text-blue-300">{formatTimestamp(post.createdAt)}</div>
                            </div>
                          </div>
                          
                          {/* Delete option for post creator */}
                          {auth.currentUser && post.userId === auth.currentUser.uid && (
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        
                        {/* Post Content */}
                        <div className="mb-4 whitespace-pre-wrap">{post.content}</div>
                        
                        {/* Post Actions */}
                        <div className="flex items-center gap-4 mb-3">
                          {/* Upvote */}
                          <button 
                            onClick={() => handleVote(post.id, 'post', 'upvote')}
                            className={`flex items-center gap-1 ${
                              post.upvotedBy?.includes(auth.currentUser?.uid)
                                ? "text-green-400"
                                : "text-blue-300 hover:text-green-400"
                            } transition-colors`}
                          >
                            <UpvoteIcon />
                            <span>{post.upvotes || 0}</span>
                          </button>
                          
                          {/* Downvote */}
                          <button 
                            onClick={() => handleVote(post.id, 'post', 'downvote')}
                            className={`flex items-center gap-1 ${
                              post.downvotedBy?.includes(auth.currentUser?.uid)
                                ? "text-red-400"
                                : "text-blue-300 hover:text-red-400"
                            } transition-colors`}
                          >
                            <DownvoteIcon />
                            <span>{post.downvotes || 0}</span>
                          </button>
                          
                          {/* Comment */}
                          <button 
                            onClick={() => toggleCommentForm(post.id)}
                            className="flex items-center gap-1 text-blue-300 hover:text-blue-200 transition-colors"
                          >
                            <CommentIcon />
                            <span>{post.commentCount || 0}</span>
                          </button>
                        </div>
                        
                        {/* Comment Form */}
                        {commentForms[post.id] && (
                          <div className="mb-4 pl-4 border-l-2 border-blue-700">
                            <textarea
                              placeholder="Write a comment..."
                              value={commentContents[post.id] || ''}
                              onChange={(e) => handleCommentChange(post.id, e.target.value)}
                              className="w-full bg-[#050A30] border border-blue-700 rounded-lg px-3 py-2 text-white placeholder-blue-300 mb-2 min-h-[80px]"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAddComment(post.id)}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                              >
                                Comment
                              </button>
                              <button
                                onClick={() => toggleCommentForm(post.id)}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Comments */}
                        {post.comments && post.comments.length > 0 && (
                          <div className="pl-4 mt-4 border-l-2 border-blue-700 space-y-3">
                            <h4 className="text-sm font-medium text-blue-300 mb-2">Comments</h4>
                            {post.comments.map(comment => (
                              <div key={comment.id} className="bg-blue-900 bg-opacity-10 rounded-lg p-3">
                                {/* Comment Header */}
                                <div className="flex justify-between mb-2">
                                  <div className="flex items-center">
                                    <img 
                                      src={comment.userPhotoURL} 
                                      alt={comment.userName}
                                      className="w-6 h-6 rounded-full mr-2"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `https://ui-avatars.com/api/?name=${comment.userName}&background=0D8ABC&color=fff`;
                                      }}
                                    />
                                    <div>
                                      <div className="text-sm font-medium">{comment.userName}</div>
                                      <div className="text-xs text-blue-300">{formatTimestamp(comment.createdAt)}</div>
                                    </div>
                                  </div>
                                  
                                  {/* Delete option for comment creator */}
                                  {auth.currentUser && comment.userId === auth.currentUser.uid && (
                                    <button
                                      onClick={() => handleDeleteComment(comment.id, post.id)}
                                      className="text-red-400 hover:text-red-300 text-xs"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                                
                                {/* Comment Content */}
                                <div className="mb-2 text-sm whitespace-pre-wrap">{comment.content}</div>
                                
                                {/* Comment Actions */}
                                <div className="flex items-center gap-3">
                                  {/* Upvote */}
                                  <button 
                                    onClick={() => handleVote(comment.id, 'comment', 'upvote')}
                                    className={`flex items-center gap-1 text-xs ${
                                      comment.upvotedBy?.includes(auth.currentUser?.uid)
                                        ? "text-green-400"
                                        : "text-blue-300 hover:text-green-400"
                                    } transition-colors`}
                                  >
                                    <UpvoteIcon />
                                    <span>{comment.upvotes || 0}</span>
                                  </button>
                                  
                                  {/* Downvote */}
                                  <button 
                                    onClick={() => handleVote(comment.id, 'comment', 'downvote')}
                                    className={`flex items-center gap-1 text-xs ${
                                      comment.downvotedBy?.includes(auth.currentUser?.uid)
                                        ? "text-red-400"
                                        : "text-blue-300 hover:text-red-400"
                                    } transition-colors`}
                                  >
                                    <DownvoteIcon />
                                    <span>{comment.downvotes || 0}</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-4">Welcome to Discussions</h2>
                <p className="text-blue-300 mb-6">Select a group from the sidebar or create a new one to start discussing!</p>
                <button
                  onClick={() => setIsCreatingGroup(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create a Group
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default DiscussionsPage;