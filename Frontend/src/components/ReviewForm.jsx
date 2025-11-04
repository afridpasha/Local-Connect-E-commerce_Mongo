import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import './ReviewForm.css';
import { FaCheckCircle, FaStar, FaUserCircle } from 'react-icons/fa';

const StarRating = ({ label, rating, setRating }) => {
  const getRatingText = (rating) => {
    if (rating === 0) return '';
    if (rating === 1) return 'Poor';
    if (rating === 2) return 'Fair';
    if (rating === 3) return 'Good';
    if (rating === 4) return 'Very Good';
    if (rating === 5) return 'Excellent';
  };

  return (
    <div className="star-rating-container">
      <label>{label}</label>
      <div className="star-rating">
        {[...Array(5)].map((_, index) => {
          const starValue = index + 1;
          return (
            <span
              key={index}
              className={`star ${starValue <= rating ? 'active' : ''}`}
              onClick={() => setRating(starValue)}
            >
              <FaStar />
            </span>
          );
        })}
        {rating > 0 && <span className="rating-text">{getRatingText(rating)}</span>}
      </div>
    </div>
  );
};

const ReviewForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [formError, setFormError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    reviewDescription: "",
    cleanlinessRating: 0,
    communicationRating: 0,
    skillRating: 0,
    valueRating: 0,
    overallRating: 0,
    // Database schema fields using snake_case to match MySQL database
    name: "",
    email: "",
    is_anonymous: false,
    order_number: "N/A",
    product_name: "N/A",
    overall_satisfaction: 0,
    quality_of_work: 0,
    timeliness: 0,
    accuracy: 0,
    written_review: "",
    worker_name: "",
    communication_skills: 0, 
    professionalism: 5,
    would_recommend: true,
    follow_up_needed: false,
    has_issue: false,
    issue_type: "",
    issue_description: "",
    consent_to_publish: true,
    status: "pending",
    reviewTitle: "Review" // Kept for frontend compatibility only
  });

  // File state
  const [reviewImages, setReviewImages] = useState([]);
  const [additionalImages, setAdditionalImages] = useState([]);

  // Get current user from localStorage (simplified)
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setFormData(prevData => ({
          ...prevData,
          name: user.username || "",
          email: user.email || ""
        }));
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
  }, []);

  // Fetch workers from the database
  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/worker-form/all`);
        setWorkers(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching workers:', error);
        setWorkers([]); // Empty array if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Handle checkbox inputs differently
    const inputValue = type === 'checkbox' ? checked : value;
    
    // Special handling for worker selection to extract profession
    if (name === 'worker_name' && value) {
      const selectedWorker = workers.find(worker => worker.fullName === value);
      if (selectedWorker) {
        // Extract the profession (first worker type that is true)
        const profession = Object.entries(selectedWorker.workerTypes)
          .filter(([_, isSelected]) => isSelected)
          .map(([type]) => type)[0] || 'N/A';
        
        // Update both worker_name and product_name (profession)
        setFormData({
          ...formData,
          [name]: inputValue,
          product_name: profession // Set the profession in product_name field
        });
        return;
      }
    }
    
    // Default handling for other fields
    setFormData({
      ...formData,
      [name]: inputValue,
    });
  };

  const handleRatingChange = (name, value) => {
    const numValue = Number(value); // Ensure the value is a number
    // Map to corresponding fields
    let updates = { [name]: numValue };
    
    // Map display ratings to database fields (using snake_case)
    if (name === 'cleanlinessRating') updates.accuracy = numValue;
    if (name === 'communicationRating') updates.communication_skills = numValue;
    if (name === 'skillRating') updates.quality_of_work = numValue;
    if (name === 'valueRating') updates.timeliness = numValue;
    if (name === 'overallRating') updates.overall_satisfaction = numValue;
    
    setFormData({
      ...formData,
      ...updates
    });
  };

  // Handle review images
  const handleReviewImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setReviewImages(files);
  };

  // Handle additional images
  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setAdditionalImages(files);
  };

  const validateForm = () => {
    console.log('Validating form with data:', formData);
    
    // Ensure worker name is selected
    if (!formData.worker_name || formData.worker_name.trim() === '') {
      setFormError("Please select a worker");
      console.log('Validation failed: No worker selected');
      return false;
    }
    
    // Ensure description is filled
    if (!formData.written_review || formData.written_review.trim() === '') {
      setFormError("Please provide a review description");
      console.log('Validation failed: No review description');
      return false;
    }
    
    // Ensure at least one rating is provided
    if (!formData.overall_satisfaction || formData.overall_satisfaction === 0) {
      setFormError("Please provide an overall rating");
      console.log('Validation failed: No overall rating');
      return false;
    }
    
    // Ensure name and email are provided
    if (!formData.name || formData.name.trim() === '') {
      setFormError("Please provide your name");
      console.log('Validation failed: No name');
      return false;
    }
    
    if (!formData.email || formData.email.trim() === '') {
      setFormError("Please provide your email");
      console.log('Validation failed: No email');
      return false;
    }
    
    console.log('Form validation passed!');
    setFormError(null);
    return true;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submission started');
    console.log('Current form data:', formData);
    
    // Validate form before submission
    if (!validateForm()) {
      console.log('Form validation failed, stopping submission');
      return;
    }
    
    setIsSubmitting(true);
    console.log('Form validation passed, proceeding with submission...');

    try {
      // Create form data object for multipart/form-data
      const data = new FormData();
      
      // Map form data to match server expectations (snake_case)
      const serverFormData = {
        name: formData.name || '',
        email: formData.email || '',
        is_anonymous: formData.is_anonymous ? 1 : 0,
        order_number: formData.order_number || 'N/A',
        product_name: formData.product_name || 'N/A',
        overall_satisfaction: formData.overall_satisfaction || 5,
        quality_of_work: formData.quality_of_work || 5,
        timeliness: formData.timeliness || 5,
        accuracy: formData.accuracy || 5,
        written_review: formData.written_review || '',
        worker_name: formData.worker_name || '',
        communication_skills: formData.communication_skills || 5,
        professionalism: formData.professionalism || 5,
        would_recommend: formData.would_recommend ? 1 : 0,
        follow_up_needed: formData.follow_up_needed ? 1 : 0,
        has_issue: formData.has_issue ? 1 : 0,
        issue_type: formData.issue_type || '',
        issue_description: formData.issue_description || '',
        consent_to_publish: formData.consent_to_publish ? 1 : 0,
        status: formData.status || 'pending'
      };
      
      console.log('Current formData state:', formData);
      console.log('Mapped serverFormData:', serverFormData);
      
      // Add each field to FormData
      Object.entries(serverFormData).forEach(([key, value]) => {
        data.append(key, value);
        console.log(`Adding field: ${key} = ${value}`);
      });
      
      // Append review images - Using the exact field name expected by the server
      if (reviewImages.length > 0) {
        for (const file of reviewImages) {
          data.append('reviewImages', file);
          console.log(`Adding image: ${file.name}`);
        }
      }
      
      // Append additional images if any
      if (additionalImages.length > 0) {
        for (const file of additionalImages) {
          data.append('additionalImages', file);
        }
      }
      
      console.log('Submitting review data:', serverFormData);
      console.log('FormData entries:');
      for (let pair of data.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]));
      }
      
      // Additional debug: Check if FormData has any entries
      const formDataEntries = Array.from(data.entries());
      console.log('Total FormData entries:', formDataEntries.length);
      if (formDataEntries.length === 0) {
        console.error('ERROR: FormData is empty!');
        setFormError('Form data is empty. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      // Send data to server - Don't set Content-Type header for FormData
      console.log('Sending request to:', `${API_BASE_URL}/api/reviews`);
      
      const response = await axios.post(`${API_BASE_URL}/api/reviews`, data);
      
      console.log('Form submitted successfully:', response.data);
      setSubmissionStatus('success');
      
      // Redirect after successful submission and trigger refresh
      setTimeout(() => {
        navigate('/reviews', { state: { refreshNeeded: true } });
      }, 2000);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionStatus('error');
      setFormError(error.response?.data?.message || "An error occurred while submitting the review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="review-form-container">
      <h1 className="review-form-title">Write a Review</h1>
      
      {formError && (
        <div className="error-message">
          {formError}
        </div>
      )}
      
      {submissionStatus === 'success' && (
        <div className="success-message">
          <FaCheckCircle /> Your review has been submitted successfully! Redirecting...
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="review-form">
        <div className="form-content">
          {/* User Information */}
          <section className="form-section">
            <h2>Your Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                  disabled={currentUser}
                  className={currentUser ? "auto-filled" : ""}
                />
                {currentUser && <div className="auto-filled-note">Auto-filled from your account</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Your Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your email address"
                  required
                  disabled={currentUser}
                  className={currentUser ? "auto-filled" : ""}
                />
                {currentUser && <div className="auto-filled-note">Auto-filled from your account</div>}
              </div>
            </div>
          </section>
          
          {/* Review Content */}
          <section className="form-section">
            <h2>Your Review</h2>
            <div className="form-group worker-select">
              <label htmlFor="workerName">Select Worker</label>
              <select
                id="workerName"
                name="worker_name" 
                value={formData.worker_name}
                onChange={handleChange}
                required
              >
                <option value="">Select Worker</option>
                {loading ? (
                  <option disabled>Loading workers...</option>
                ) : workers && Array.isArray(workers) && workers.length > 0 ? (
                  workers.map((worker) => (
                    <option key={worker._id} value={worker.fullName}>
                      {worker.fullName} - {Object.entries(worker.workerTypes || {})
                        .filter(([_, value]) => value)
                        .map(([key]) => key)
                        .join(', ')}
                    </option>
                  ))
                ) : (
                  <option disabled>No workers found. Please add workers first.</option>
                )}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="reviewDescription">Review Description</label>
              <textarea
                id="reviewDescription"
                name="written_review"
                value={formData.written_review}
                onChange={handleChange}
                placeholder="Share your experience with this worker"
                required
                rows={4}
              />
            </div>

            <div className="review-ratings-container">
              <h3>Rate Your Experience</h3>
              <div className="ratings-grid">
                <StarRating 
                  label="Cleanliness"
                  rating={formData.cleanlinessRating}
                  setRating={(value) => handleRatingChange("cleanlinessRating", value)}
                />
                
                <StarRating 
                  label="Communication"
                  rating={formData.communicationRating}
                  setRating={(value) => handleRatingChange("communicationRating", value)}
                />
                
                <StarRating 
                  label="Skill"
                  rating={formData.skillRating}
                  setRating={(value) => handleRatingChange("skillRating", value)}
                />
                
                <StarRating 
                  label="Value"
                  rating={formData.valueRating}
                  setRating={(value) => handleRatingChange("valueRating", value)}
                />
                
                <StarRating 
                  label="Overall Rating"
                  rating={formData.overallRating}
                  setRating={(value) => handleRatingChange("overallRating", value)}
                />
              </div>
            </div>
          </section>

          {/* Image Upload */}
          <section className="form-section">
            <h2>Image Upload <span className="optional-label">(Optional)</span></h2>
            <div className="form-group">
              <label htmlFor="reviewImages" className="upload-label">
                <i className="upload-icon">📷</i>
                <span>Upload Photos</span>
              </label>
              <p className="upload-hint">Images of great work help others understand your experience better</p>
              <input
                type="file"
                id="reviewImages"
                name="reviewImages"
                onChange={handleReviewImagesChange}
                accept=".jpg,.jpeg,.png"
                multiple
                className="file-input"
              />
              <p className="file-restrictions">Accepted formats: JPG, PNG. Max 5MB per file.</p>
            </div>
          </section>

          {/* Submit Button */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
