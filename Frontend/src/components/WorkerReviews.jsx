import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { FaStar, FaUser, FaCalendarAlt, FaClock, FaThumbsUp, FaExclamationTriangle } from 'react-icons/fa';
import './WorkerReviews.css';

const WorkerReviews = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // Filter options: all, highRated, recent
  const [debugInfo, setDebugInfo] = useState(null); // For debugging
  const [lastUpdated, setLastUpdated] = useState(null); // Track last update time

  // Log component mounting
  useEffect(() => {
    console.log('🔵 WorkerReviews component mounted at:', new Date().toISOString());
    console.log('📍 Current pathname:', location.pathname);
    // Also check if we should pre-load debug info
    setDebugInfo({
      componentMounted: true,
      mountTime: new Date().toISOString(),
      pathname: location.pathname
    });
  }, [location.pathname]);

  // Fetch reviews from MySQL database
  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching reviews from server - " + new Date().toLocaleTimeString());
      
      // Use the general endpoint to get all reviews to ensure we're fetching data
      const response = await axios.get(`${API_BASE_URL}/api/reviews?t=${Date.now()}`, { 
        timeout: 10000,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log("Server response status:", response.status, response.statusText);
      console.log("Response data:", response.data);
      
      // Handle different response formats
      let reviewsData = [];
      
      if (response.data) {
        // Case 1: Reviews are directly in the response data array
        if (Array.isArray(response.data)) {
          console.log("Response is an array, using directly");
          reviewsData = response.data;
        } 
        // Case 2: Reviews are in a 'reviews' property as an array
        else if (response.data.reviews && Array.isArray(response.data.reviews)) {
          console.log("Found reviews array in response.data.reviews");
          reviewsData = response.data.reviews;
        } 
        // Case 3: Response contains review data but in a different structure
        else if (typeof response.data === 'object') {
          console.log("Response is an object, checking for keys");
          // If we received an object with review-like properties, treat it as a single review
          if (response.data.id || response.data.name || response.data.written_review) {
            console.log("Found single review object");
            reviewsData = [response.data];
          }
          // If we have a success property, log it for debugging
          if ('success' in response.data) {
            console.log("API response success:", response.data.success);
          }
          // If we have a message property, log it for debugging
          if ('message' in response.data) {
            console.log("API message:", response.data.message);
          }
        }
      }
      
      // Display comprehensive debug info
      console.log("Reviews data after processing:", reviewsData);
      
      // Set debug info based on what we found
      if (reviewsData.length > 0) {
        const firstReview = reviewsData[0];
        console.log("First review:", firstReview);
        setDebugInfo(prev => ({
          ...prev,
          totalReviews: reviewsData.length,
          firstReviewId: firstReview.id,
          firstReviewConsent: firstReview.consent_to_publish,
          firstReviewAnonymous: firstReview.is_anonymous,
          hasImages: firstReview.reviewImages && firstReview.reviewImages.length > 0,
          sampleReview: { 
            id: firstReview.id,
            name: firstReview.name,
            written_review: firstReview.written_review ? firstReview.written_review.substring(0, 50) + '...' : 'None'
          },
          allReviewFields: Object.keys(firstReview)
        }));
      } else {
        console.log("No reviews found in the response");
        setDebugInfo(prev => ({
          ...prev,
          totalReviews: 0, 
          message: "No reviews returned from server",
          responseStructure: Object.keys(response.data),
          fullResponse: response.data
        }));
        
        console.log('No reviews found, but continuing...');
      }
      
      setReviews(reviewsData);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      console.error('Error details:', err.response || err.message || err);
      
      // Show more detailed error information
      let errorMessage = 'Failed to load reviews. Please try again later.';
      
      if (err.response) {
        errorMessage = `Error ${err.response.status}: ${err.response.data?.message || 'Unknown server error'}`;
        setDebugInfo(prev => ({ 
          ...prev,
          error: 'Server response error', 
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        }));
      } else if (err.request) {
        // Request was made but no response was received
        errorMessage = err.code === 'ECONNABORTED' 
          ? 'Request timeout: Server took too long to respond. Please try again.'
          : 'Network error: Server did not respond. Please check your connection.';
        
        setDebugInfo(prev => ({ 
          ...prev,
          error: 'Network error', 
          message: 'No response from server',
          request: {
            method: err.request.method,
            path: err.request.path,
            host: err.request.host
          },
          code: err.code
        }));
      } else {
        setDebugInfo(prev => ({ 
          ...prev,
          error: 'Request setup error', 
          message: err.message,
          stack: err.stack
        }));
      }
      
      // Server status check removed for MongoDB version
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Initial fetch on component mount and when navigated from form
  useEffect(() => {
    fetchReviews();
    
    // Check if we came from form submission
    if (location.state?.refreshNeeded) {
      console.log('🎆 New review submitted! Fetching latest data...');
      // Clear the state to prevent repeated refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing reviews...');
      fetchReviews();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (err) {
      console.error('Error formatting date:', dateString, err);
      return 'Invalid date';
    }
  };

  // Function to format time
  const formatTime = (dateString) => {
    if (!dateString) return 'Unknown time';
    try {
      const options = { hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleTimeString(undefined, options);
    } catch (err) {
      console.error('Error formatting time:', dateString, err);
      return 'Invalid time';
    }
  };

  // Improved render stars function to handle null or undefined ratings
  const renderStars = (rating) => {
    const ratingValue = Number(rating) || 0;
    return [...Array(5)].map((_, index) => (
      <FaStar 
        key={index} 
        className={index < ratingValue ? 'star filled' : 'star empty'} 
      />
    ));
  };

  // Add function to check if a review object is valid
  const isValidReview = (review) => {
    return review && typeof review === 'object' && (
      review.id || review.written_review || review.worker_name
    );
  };

  // Filter reviews based on selection, ensuring valid reviews
  const filteredReviews = () => {
    // Filter out invalid reviews first
    const validReviews = reviews.filter(isValidReview);
    
    switch(filter) {
      case 'highRated':
        return [...validReviews].sort((a, b) => 
          (Number(b.overall_satisfaction) || 0) - (Number(a.overall_satisfaction) || 0)
        );
      case 'recent':
        return [...validReviews].sort((a, b) => 
          new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0)
        );
      default:
        return [...validReviews].sort((a, b) => 
          new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0)
        );
    }
  };

  // Group reviews by worker, handling edge cases
  const reviewsByWorker = filteredReviews().reduce((acc, review) => {
    if (!review) return acc;
    const workerName = review.worker_name || 'Unknown Worker';
    if (!acc[workerName]) {
      acc[workerName] = [];
    }
    acc[workerName].push(review);
    return acc;
  }, {});

  // If no worker grouping possible, show all reviews under "All Reviews"
  const hasWorkerNames = filteredReviews().some(review => review.worker_name);
  const displayReviews = hasWorkerNames ? reviewsByWorker : { 'All Reviews': filteredReviews() };

  return (
    <div className="worker-reviews-container">
      <div className="reviews-header">
        <h1>Worker Reviews</h1>
        <Link to="/add-review" className="feedback-btn">
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>✍️ Write a Review</span>
        </Link>
      </div>

      {/* Add server status display for troubleshooting */}
      {debugInfo && debugInfo.error && (
        <div className="server-status-alert">
          <p>
            <strong>Server Connection:</strong> There might be an issue connecting to the server. 
            Please make sure the backend server is running on port 5003.
            <button 
              className="check-server-button" 
              onClick={() => window.open('https://local-connect-e-commerce-r4i5.onrender.com/health', '_blank')}
            >
              Check Server
            </button>
          </p>
        </div>
      )}

      <div className="filter-controls">
        <label htmlFor="filter-select">Filter Reviews:</label>
        <select 
          id="filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Reviews</option>
          <option value="highRated">Highest Rated</option>
          <option value="recent">Most Recent</option>
        </select>
        <button 
          className="refresh-button"
          onClick={fetchReviews}
          disabled={loading}
        >
          {loading ? 'Loading...' : '🔄 Refresh Now'}
        </button>
        {lastUpdated && (
          <span className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading reviews...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <FaExclamationTriangle className="error-icon" />
          <h3>Unable to load reviews</h3>
          <p>{error}</p>
          <button 
            className="retry-button" 
            onClick={fetchReviews}
          >
            Retry
          </button>
          
          {/* Debug information - can be removed in production */}
          {debugInfo && (
            <details className="debug-info">
              <summary>Debug Information</summary>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </details>
          )}
        </div>
      ) : filteredReviews().length === 0 ? (
        <div className="no-reviews">
          <p>No reviews available yet. Be the first to leave a review!</p>
          <Link to="/add-review" className="write-review-btn">
            Write a Review
          </Link>
          
          {/* Debug information - can be removed in production */}
          {debugInfo && (
            <details className="debug-info">
              <summary>Debug Information</summary>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </details>
          )}
        </div>
      ) : (
        <div className="reviews-grid">
          {Object.keys(displayReviews).length > 0 ? (
            Object.entries(displayReviews).map(([workerName, workerReviews]) => (
              <div className="worker-card" key={workerName}>
                <div className="worker-card-header">
                  <h2>{workerName}</h2>
                  <div className="average-rating">
                    {renderStars(
                      Math.round(
                        workerReviews.reduce((sum, review) => sum + (Number(review.overall_satisfaction) || 0), 0) / 
                        workerReviews.length
                      )
                    )}
                    <span>
                      {(
                        workerReviews.reduce((sum, review) => sum + (Number(review.overall_satisfaction) || 0), 0) / 
                        workerReviews.length
                      ).toFixed(1)}
                    </span>
                  </div>
                </div>
                
                <div className="reviews-list">
                  {workerReviews.map((review) => (
                    <div className="review-item" key={review.id || Math.random()}>
                      <div className="review-header">
                        <div className="review-user">
                          <FaUser className="user-icon" />
                          <span>{review.name || review.reviewer_name || 'Anonymous'}</span>
                        </div>
                        <div className="review-date">
                          <FaCalendarAlt className="calendar-icon" />
                          <span>{formatDate(review.createdAt || review.created_at)}</span>
                          <FaClock className="clock-icon" />
                          <span>{formatTime(review.createdAt || review.created_at)}</span>
                        </div>
                      </div>
                      
                      <h3 className="review-title">{review.product_name || review.worker_category || 'Service Review'}</h3>
                      
                      <div className="review-ratings">
                        <div className="rating-item">
                          <span>Overall:</span>
                          {renderStars(review.overall_satisfaction)}
                        </div>
                        {review.quality_of_work && (
                          <div className="rating-item">
                            <span>Quality:</span>
                            {renderStars(review.quality_of_work)}
                          </div>
                        )}
                        {review.timeliness && (
                          <div className="rating-item">
                            <span>Timeliness:</span>
                            {renderStars(review.timeliness)}
                          </div>
                        )}
                        {review.communication_skills && (
                          <div className="rating-item">
                            <span>Communication:</span>
                            {renderStars(review.communication_skills)}
                          </div>
                        )}
                      </div>
                      
                      <p className="review-text">{review.written_review || 'No review text provided'}</p>
                      
                      {(review.would_recommend === 1 || review.would_recommend === true) && (
                        <div className="recommend-badge">
                          <FaThumbsUp className="thumbs-up" />
                          <span>Recommends this worker</span>
                        </div>
                      )}
                      
                      {review.images && review.images.length > 0 && (
                        <div className="review-images">
                          {review.images.map((imagePath, index) => {
                            // Handle image path - it's already a string path
                            const fullImagePath = imagePath.startsWith('/uploads') 
                              ? `${API_BASE_URL}${imagePath}` 
                              : imagePath;
                            
                            return (
                              <img 
                                key={index} 
                                src={fullImagePath} 
                                alt={`Review ${index + 1}`}
                                onError={(e) => {
                                  console.error(`Error loading image: ${fullImagePath}`);
                                  e.target.src = 'https://via.placeholder.com/100x100?text=Image+Not+Found';
                                }}
                                className="review-image"
                                style={{ width: '100px', height: '100px', objectFit: 'cover', margin: '5px' }}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="no-reviews-after-filter">
              <p>No reviews match the current filter. Try changing the filter or add new reviews.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkerReviews;