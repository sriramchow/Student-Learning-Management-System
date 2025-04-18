

import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import app from "./firebase"

// Create or update admin user in Firestore
const setupAdminUser = async () => {
  try {
    const auth = getAuth();
    const db = getFirestore();
    
    // Admin credentials
    const adminEmail = "admin@questor.com";
    const adminPassword = "admin123";
    
    let adminUid;
    
    try {
      // Try to create the admin user
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      adminUid = userCredential.user.uid;
      console.log("Admin user created successfully");
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        // Admin already exists, sign in to get UID
        const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        adminUid = userCredential.user.uid;
        console.log("Admin user already exists, signed in to get UID");
      } else {
        throw error;
      }
    }
    
    // Set admin user data in Firestore with isAdmin flag
    const adminUserData = {
      name: "Administrator",
      email: adminEmail,
      isAdmin: true,
      phone: "",
      bio: "System administrator",
      joinDate: serverTimestamp(),
      interests: ["administration", "education"],
      socialMedia: {
        facebook: "",
        twitter: "",
        linkedin: "",
        instagram: "",
        github: ""
      },
      profileImage: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, "users", adminUid), adminUserData, { merge: true });
    console.log("Admin user updated in Firestore with admin privileges");
    
    return {
      success: true,
      uid: adminUid
    };
    
  } catch (error) {
    console.error("Error setting up admin user:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Add this at the bottom of setupAdminUser.js
setupAdminUser().then(result => {
    if (result.success) {
      console.log('Admin setup complete with UID:', result.uid);
    } else {
      console.error('Admin setup failed:', result.error);
    }
  });

export default setupAdminUser;