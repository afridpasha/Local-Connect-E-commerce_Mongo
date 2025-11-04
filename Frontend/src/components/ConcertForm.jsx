import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import './TicketForm.css';

const ConcertForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Event Details
    performerName: '',
    eventDate: '',
    eventTime: '',
    venue: '',
    
    // Ticket Holder Information
    seatNumber: '',
    ticketHolderName: '',
    
    // Pricing Information
    ticketPrice: '',
    additionalFees: '',
    availableTickets: '',
    
    // Terms and Conditions
    admissionPolicies: '',
    resaleRestrictions: '',
    refundPolicies: '',
    
    // Ticket Image
    ticketImage: null
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState({ success: false, message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      ticketImage: e.target.files[0]
    }));
  };

  const validateForm = () => {
    const errors = {};
    const now = new Date();
    const eventDate = new Date(formData.eventDate);
    
    // Basic validation
    if (!formData.performerName) errors.performerName = 'Performer name is required';
    if (!formData.eventDate) errors.eventDate = 'Event date is required';
    if (!formData.eventTime) errors.eventTime = 'Event time is required';
    if (!formData.venue) errors.venue = 'Venue is required';
    if (!formData.seatNumber) errors.seatNumber = 'Seat number is required';
    if (!formData.ticketHolderName) errors.ticketHolderName = 'Ticket holder name is required';
    if (!formData.ticketPrice) errors.ticketPrice = 'Ticket price is required';
    if (!formData.availableTickets) errors.availableTickets = 'Number of available tickets is required';
    if (!formData.ticketImage) errors.ticketImage = 'Ticket image is required';
    
    // Date validation
    if (eventDate < now) {
      errors.eventDate = 'Event date cannot be in the past';
    }
    
    // Price validation
    if (formData.ticketPrice && isNaN(formData.ticketPrice)) {
      errors.ticketPrice = 'Ticket price must be a number';
    }
    
    if (formData.additionalFees && isNaN(formData.additionalFees)) {
      errors.additionalFees = 'Additional fees must be a number';
    }

    // Available tickets validation
    if (formData.availableTickets && isNaN(formData.availableTickets)) {
      errors.availableTickets = 'Number of available tickets must be a number';
    }

    if (formData.availableTickets && Number(formData.availableTickets) <= 0) {
      errors.availableTickets = 'Number of available tickets must be greater than 0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!validateForm()) {
      window.scrollTo(0, 0);
      return;
    }
    
    // Create FormData for multipart/form-data (due to image upload)
    const data = new FormData();
    
    // Append all form fields to the FormData object
    Object.keys(formData).forEach(key => {
      if (key === 'ticketImage') {
        if (formData.ticketImage) {
          data.append('ticketImage', formData.ticketImage);
        }
      } else {
        data.append(key, formData[key]);
      }
    });
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/tickets/concert`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Show success message
      setSubmitStatus({
        success: true,
        message: 'The details have been updated.'
      });
      
      // Reset form after success
      setTimeout(() => {
        navigate('/tickets');
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting concert ticket:', error);
      setSubmitStatus({
        success: false,
        message: error.response?.data?.error || 'Submission failed, please try again.'
      });
    }
  };

  return (
    <div className="ticket-form-container">
      <h2>Sell Concert Tickets</h2>
      
      {/* Status Messages */}
      {submitStatus.message && (
        <div className={`status-message ${submitStatus.success ? 'success' : 'error'}`}>
          {submitStatus.message}
        </div>
      )}
      
      {/* Error summary */}
      {Object.keys(formErrors).length > 0 && (
        <div className="error-summary">
          <p>Please correct the following errors:</p>
          <ul>
            {Object.values(formErrors).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="ticket-form">
        <div className="form-section">
          <h3>Event Details</h3>
          
          <div className="form-group">
            <label htmlFor="performerName">Performer Name*</label>
            <input
              type="text"
              id="performerName"
              name="performerName"
              value={formData.performerName}
              onChange={handleChange}
              className={formErrors.performerName ? 'error' : ''}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="eventDate">Date*</label>
              <input
                type="date"
                id="eventDate"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                className={formErrors.eventDate ? 'error' : ''}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="eventTime">Time*</label>
              <input
                type="time"
                id="eventTime"
                name="eventTime"
                value={formData.eventTime}
                onChange={handleChange}
                className={formErrors.eventTime ? 'error' : ''}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="venue">Venue*</label>
            <input
              type="text"
              id="venue"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              className={formErrors.venue ? 'error' : ''}
            />
          </div>
        </div>
        
        <div className="form-section">
          <h3>Ticket Holder Information</h3>
          
          <div className="form-group">
            <label htmlFor="seatNumber">Seat Number*</label>
            <input
              type="text"
              id="seatNumber"
              name="seatNumber"
              value={formData.seatNumber}
              onChange={handleChange}
              className={formErrors.seatNumber ? 'error' : ''}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="ticketHolderName">Ticket Holder's Name*</label>
            <input
              type="text"
              id="ticketHolderName"
              name="ticketHolderName"
              value={formData.ticketHolderName}
              onChange={handleChange}
              className={formErrors.ticketHolderName ? 'error' : ''}
            />
          </div>
        </div>
        
        <div className="form-section">
          <h3>Pricing Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ticketPrice">Ticket Price ($)*</label>
              <input
                type="text"
                id="ticketPrice"
                name="ticketPrice"
                value={formData.ticketPrice}
                onChange={handleChange}
                className={formErrors.ticketPrice ? 'error' : ''}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="additionalFees">Additional Fees ($)</label>
              <input
                type="text"
                id="additionalFees"
                name="additionalFees"
                value={formData.additionalFees}
                onChange={handleChange}
                className={formErrors.additionalFees ? 'error' : ''}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="availableTickets">Number of Available Tickets*</label>
            <input
              type="number"
              id="availableTickets"
              name="availableTickets"
              value={formData.availableTickets}
              onChange={handleChange}
              min="1"
              className={formErrors.availableTickets ? 'error' : ''}
            />
          </div>
        </div>
        
        <div className="form-section">
          <h3>Terms and Conditions</h3>
          
          <div className="form-group">
            <label htmlFor="admissionPolicies">Admission Policies</label>
            <textarea
              id="admissionPolicies"
              name="admissionPolicies"
              value={formData.admissionPolicies}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="resaleRestrictions">Resale Restrictions</label>
            <textarea
              id="resaleRestrictions"
              name="resaleRestrictions"
              value={formData.resaleRestrictions}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="refundPolicies">Refund and Cancellation Policies</label>
            <textarea
              id="refundPolicies"
              name="refundPolicies"
              value={formData.refundPolicies}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Ticket Image</h3>
          
          <div className="form-group">
            <label htmlFor="ticketImage">Upload Ticket Image (HD clarity)*</label>
            <input
              type="file"
              id="ticketImage"
              name="ticketImage"
              onChange={handleFileChange}
              accept="image/*"
              className={formErrors.ticketImage ? 'error' : ''}
            />
            <small>Please upload a clear image of the ticket</small>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="submit-button">Submit Ticket</button>
          <button type="button" className="cancel-button" onClick={() => navigate('/tickets')}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default ConcertForm; 
