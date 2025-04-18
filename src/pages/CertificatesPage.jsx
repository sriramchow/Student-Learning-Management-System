import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';
import { 
  FaCertificate, 
  FaDownload, 
  FaShare, 
  FaSearch,
  FaCalendarAlt,
  FaBook,
  FaTimes,
  FaInfoCircle
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CertificatesPage = () => {
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [courses, setCourses] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const certificateRef = useRef(null);
  const navigate = useNavigate();
  const db = getFirestore();
  const auth = getAuth();
  
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
  
  // Fetch user certificates
  useEffect(() => {
    const fetchCertificates = async () => {
      if (!auth.currentUser) return;
      
      try {
        setLoading(true);
        
        // Get user data
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          toast.error("User profile not found");
          return;
        }
        
        const userData = userSnap.data();
        const userCertificates = userData.certificates || [];
        
        // Get course details for each certificate
        const courseDetailsMap = {};
        
        for (const certificate of userCertificates) {
          if (!courseDetailsMap[certificate.courseId]) {
            const courseRef = doc(db, "courses", certificate.courseId);
            const courseSnap = await getDoc(courseRef);
            
            if (courseSnap.exists()) {
              courseDetailsMap[certificate.courseId] = {
                id: courseSnap.id,
                ...courseSnap.data()
              };
            }
          }
        }
        
        setCertificates(userCertificates);
        setFilteredCertificates(userCertificates);
        setCourses(courseDetailsMap);
      } catch (error) {
        console.error("Error fetching certificates:", error);
        toast.error("Failed to load certificates");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCertificates();
  }, [db, auth.currentUser, navigate]);
  
  // Filter certificates based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCertificates(certificates);
    } else {
      const filtered = certificates.filter(certificate => 
        certificate.courseName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCertificates(filtered);
    }
  }, [searchTerm, certificates]);
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    
    const d = date.toDate ? date.toDate() : new Date(date);
    
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Open certificate preview modal
  const openCertificateModal = (certificate) => {
    setSelectedCertificate(certificate);
    setShowModal(true);
  };
  
  // Close certificate preview modal
  const closeCertificateModal = () => {
    setShowModal(false);
    setSelectedCertificate(null);
  };
  
  // Download certificate as PDF
  const downloadCertificate = async () => {
    if (!certificateRef.current || !selectedCertificate) return;
    
    try {
      toast.info("Preparing your certificate for download...");
      
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${selectedCertificate.certificateId}.pdf`);
      
      toast.success("Certificate downloaded successfully");
    } catch (error) {
      console.error("Error downloading certificate:", error);
      toast.error("Failed to download certificate");
    }
  };
  
  // Share certificate
  const shareCertificate = async () => {
    if (!selectedCertificate) return;
    
    try {
      const shareData = {
        title: 'My Certificate',
        text: `I earned a certificate for completing ${selectedCertificate.courseName} on Questor!`,
        url: window.location.href
      };
      
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback if Web Share API not available
        navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast.success("Certificate link copied to clipboard");
      }
    } catch (error) {
      console.error("Error sharing certificate:", error);
      toast.error("Failed to share certificate");
    }
  };
  
  // View the corresponding course
  const viewCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };
  
  return (
    <div className="bg-[#050A30] min-h-screen text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 mt-16 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Certificates</h1>
        </div>
        
        {/* Search Box */}
        <div className="relative w-full md:w-64 mb-6">
          <input
            type="text"
            placeholder="Search certificates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg px-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
        </div>
        
        {/* Certificates Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="bg-blue-900 bg-opacity-20 rounded-xl p-8 text-center border border-blue-800">
            <div className="w-16 h-16 rounded-full bg-blue-800 flex items-center justify-center mx-auto mb-4">
              <FaInfoCircle className="text-blue-400 text-2xl" />
            </div>
            <h3 className="text-xl font-medium mb-2">
              {certificates.length === 0
                ? "No Certificates Yet"
                : "No Matching Certificates"}
            </h3>
            <p className="text-blue-300 mb-6">
              {certificates.length === 0
                ? "Complete courses to earn certificates and showcase your achievements."
                : "Try a different search term to find your certificates."}
            </p>
            {certificates.length === 0 && (
              <button
                onClick={() => navigate('/courses')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Browse Courses
              </button>
            )}
            {certificates.length > 0 && searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Show All Certificates
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((certificate, index) => (
              <div 
                key={index} 
                className="bg-blue-900 bg-opacity-20 rounded-xl overflow-hidden border border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* Certificate Preview */}
                <div 
                  className="relative h-48 bg-gradient-to-br from-blue-800 to-purple-900 p-4 flex flex-col justify-center items-center cursor-pointer"
                  onClick={() => openCertificateModal(certificate)}
                >
                  <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    {/* Background pattern */}
                    <div className="absolute top-2 left-2 right-2 bottom-2 border-2 border-white rounded-lg"></div>
                  </div>
                  
                  <FaCertificate className="text-yellow-400 text-5xl mb-2" />
                  <h3 className="text-white text-lg font-bold text-center">Certificate of Completion</h3>
                  <p className="text-blue-200 text-sm text-center">
                    {certificate.courseName}
                  </p>
                </div>
                
                {/* Certificate Info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">{certificate.courseName}</h3>
                      <p className="text-blue-300 text-sm flex items-center mt-1">
                        <FaCalendarAlt className="mr-1" />
                        Issued on {formatDate(certificate.issueDate)}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full">
                        Completed
                      </span>
                    </div>
                  </div>
                  
                  {/* Certificate ID */}
                  <p className="text-blue-300 text-xs mb-4">
                    Certificate ID: {certificate.certificateId}
                  </p>
                  
                  {/* Actions */}
                  <div className="flex justify-between">
                    <button
                      onClick={() => viewCourse(certificate.courseId)}
                      className="text-sm bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors flex items-center"
                    >
                      <FaBook className="mr-1" /> View Course
                    </button>
                    
                    <button
                      onClick={() => openCertificateModal(certificate)}
                      className="text-sm bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded-lg transition-colors flex items-center"
                    >
                      <FaCertificate className="mr-1" /> View Certificate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Certificate Modal */}
      {showModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A1045] rounded-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-blue-800">
              <h3 className="text-xl font-bold">Certificate Preview</h3>
              <button 
                onClick={closeCertificateModal}
                className="text-blue-300 hover:text-white transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="p-4">
              {/* Certificate Template */}
              <div 
                ref={certificateRef}
                className="bg-gradient-to-br from-blue-800 to-purple-900 p-8 rounded-lg border-8 border-blue-900 shadow-lg aspect-video relative"
              >
                <div className="absolute top-4 left-4 right-4 bottom-4 border-2 border-white border-opacity-20 rounded-lg pointer-events-none"></div>
                
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-1">Certificate of Completion</h2>
                  <p className="text-blue-200">This is to certify that</p>
                </div>
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-yellow-300 mb-1">{selectedCertificate.userName}</h3>
                  <p className="text-blue-200">has successfully completed the course</p>
                  <h3 className="text-2xl font-bold text-white mt-2">{selectedCertificate.courseName}</h3>
                </div>
                
                <div className="flex justify-between items-center mt-12">
                  <div className="text-left">
                    <p className="text-blue-200 text-sm">Issued On:</p>
                    <p className="font-medium text-white">{formatDate(selectedCertificate.issueDate)}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-blue-200 text-sm">Certificate ID:</p>
                    <p className="font-medium text-white">{selectedCertificate.certificateId}</p>
                  </div>
                </div>
                
                <div className="absolute bottom-8 left-0 right-0 text-center">
                  <h4 className="text-xl font-bold text-white">Questor Learning Platform</h4>
                </div>
              </div>
              
              {/* Certificate Actions */}
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={downloadCertificate}
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <FaDownload className="mr-2" /> Download PDF
                </button>
                
                <button
                  onClick={shareCertificate}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <FaShare className="mr-2" /> Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default CertificatesPage;