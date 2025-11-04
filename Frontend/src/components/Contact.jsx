import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from '../config/api';
import "./Contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({
    success: false,
    message: "",
    error: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ success: false, message: "", error: false });

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/email/send`,
        formData
      );

      if (response.data.success) {
        setSubmitStatus({
          success: true,
          message: "Message sent successfully!",
          error: false,
        });
        setFormData({ name: "", email: "", subject: "", message: "" });
      }
    } catch (error) {
      setSubmitStatus({
        success: false,
        message: error.response?.data?.message || "Failed to send message",
        error: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-container">
      <div className="contact-wrapper">
        <div className="contact-info">
          <h2>Get in Touch</h2>
          <p className="contact-description">
            Have questions about our services? Need help with your booking? We're
            here to help! Fill out the form and our team will get back to you
            shortly.
          </p>

          <div className="info-items">
            <div className="info-item">
              <div className="info-icon">📍</div>
              <div>
                <h3>Our Location</h3>
                <p>123 Business Street</p>
                <p>Hyderabad, Telangana 500032</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">📞</div>
              <div>
                <h3>Phone Number</h3>
                <p>+91 (123) 456-7890</p>
                <p>Mon-Fri, 9:00 AM - 6:00 PM</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">✉️</div>
              <div>
                <h3>Email Address</h3>
                <p>info@localconnect.com</p>
                <p>support@localconnect.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-form">
          <h2>Send us a Message</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your Name"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your Email"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Subject"
                required
              />
            </div>

            <div className="form-group">
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Your Message"
                rows="5"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Sending..."
              ) : (
                <>
                  Send Message
                  <span className="send-icon">➤</span>
                </>
              )}
            </button>
          </form>

          {submitStatus.message && (
            <div
              className={
                submitStatus.success ? "success-message" : "error-message"
              }
            >
              {submitStatus.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
