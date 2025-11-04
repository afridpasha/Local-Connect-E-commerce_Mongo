// src/components/WorkerForm.jsx
import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from '../config/api';
import "./WorkerForm.css";
import { useNavigate } from "react-router-dom";

const WorkerForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    workerTypes: {
      acRepair: false,
      mechanicRepair: false,
      electricalRepair: false,
      electronicRepair: false,
      plumber: false,
    },
    address: "",
    city: "",
    state: "",
    email: "",
    age: "",
    gender: "",
    country: "",
    costPerHour: "",
    profilePhoto: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      workerTypes: {
        ...prev.workerTypes,
        [name]: checked,
      },
    }));
  };

  // Handle file input for profile photo
  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      profilePhoto: e.target.files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare form data (multipart) to include file and text fields
    const data = new FormData();
    data.append("fullName", formData.fullName);
    data.append("phoneNumber", formData.phoneNumber);
    data.append("workerTypes", JSON.stringify(formData.workerTypes));
    data.append("address", formData.address);
    data.append("city", formData.city);
    data.append("state", formData.state);
    data.append("country", formData.country);
    data.append("email", formData.email);
    data.append("age", formData.age);
    data.append("gender", formData.gender);
    data.append("costPerHour", formData.costPerHour);
    if (formData.profilePhoto) {
      data.append("profilePhoto", formData.profilePhoto);
    }

    try {
      await axios.post(`${API_BASE_URL}/api/worker-form`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Worker details submitted successfully!");
      navigate("/workers-dashboard");
    } catch (error) {
      alert(error.response?.data?.error || "Submission failed");
    }
  };

  return (
    <div className="worker-form-container">
      <div className="form-header">
        <div className="header-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <h1>Professional Profile Setup</h1>
        <p>Register your service details to start getting clients</p>
      </div>

      <form className="worker-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Ex: Michael Chen"
              required
            />
          </div>

          <div className="form-group">
            <label>Contact Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Ex: +1 (555) 123-4567"
              required
            />
          </div>
        </div>

        <fieldset className="skills-section">
          <legend>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
            Offered Services
          </legend>
          <div className="checkbox-grid">
            <label
              className={`checkbox-label ${
                formData.workerTypes.acRepair ? "checked" : ""
              }`}
            >
              <input
                type="checkbox"
                name="acRepair"
                checked={formData.workerTypes.acRepair}
                onChange={handleCheckboxChange}
              />
              <span className="checkmark"></span>
              <span className="service-title">AC Repair & Maintenance</span>
              <span className="service-desc">Cooling system services</span>
            </label>

            <label
              className={`checkbox-label ${
                formData.workerTypes.mechanicRepair ? "checked" : ""
              }`}
            >
              <input
                type="checkbox"
                name="mechanicRepair"
                checked={formData.workerTypes.mechanicRepair}
                onChange={handleCheckboxChange}
              />
              <span className="checkmark"></span>
              <span className="service-title">Auto Mechanic Services</span>
              <span className="service-desc">Vehicle repair & maintenance</span>
            </label>

            <label
              className={`checkbox-label ${
                formData.workerTypes.electricalRepair ? "checked" : ""
              }`}
            >
              <input
                type="checkbox"
                name="electricalRepair"
                checked={formData.workerTypes.electricalRepair}
                onChange={handleCheckboxChange}
              />
              <span className="checkmark"></span>
              <span className="service-title">Electrical Services</span>
              <span className="service-desc">
                Wiring &amp; fixture installation
              </span>
            </label>

            <label
              className={`checkbox-label ${
                formData.workerTypes.electronicRepair ? "checked" : ""
              }`}
            >
              <input
                type="checkbox"
                name="electronicRepair"
                checked={formData.workerTypes.electronicRepair}
                onChange={handleCheckboxChange}
              />
              <span className="checkmark"></span>
              <span className="service-title">Electronic Repair</span>
              <span className="service-desc">Devices &amp; appliances repair</span>
            </label>

            <label
              className={`checkbox-label ${
                formData.workerTypes.plumber ? "checked" : ""
              }`}
            >
              <input
                type="checkbox"
                name="plumber"
                checked={formData.workerTypes.plumber}
                onChange={handleCheckboxChange}
              />
              <span className="checkmark"></span>
              <span className="service-title">Plumbing Services</span>
              <span className="service-desc">Pipes &amp; sanitation systems</span>
            </label>
          </div>
        </fieldset>

        <div className="form-group">
          <label>Service Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Ex: 123 Main St, Apt 4B | Include landmarks if needed"
            rows="3"
            required
          ></textarea>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Ex: San Francisco"
              required
            />
          </div>

          <div className="form-group">
            <label>State</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="Ex: California"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Country</label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            placeholder="Ex: United States"
            required
          />
        </div>

        <div className="form-group">
          <label>Professional Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Ex: contact@michaelservices.com"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Ex: 28"
              required
            />
          </div>

          <div className="form-group">
            <label>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* New Cost per hour field */}
        <div className="form-group">
          <label>Cost per hour</label>
          <input
            type="text"
            name="costPerHour"
            value={formData.costPerHour}
            onChange={handleChange}
            placeholder="Enter the amount in Rupees"
            required
          />
        </div>

        <div className="form-group">
          <label>Profile Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
          />
        </div>

        <button type="submit" className="submit-btn">
          Complete Professional Profile
          <svg className="arrow-icon" viewBox="0 0 24 24" width="20" height="20">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default WorkerForm;
