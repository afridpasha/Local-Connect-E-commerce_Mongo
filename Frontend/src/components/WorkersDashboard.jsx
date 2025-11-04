import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import './WorkersDashboard.css';

const WorkersDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [acceptedTasks, setAcceptedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Get token from either workerToken or authToken
      const token = localStorage.getItem('workerToken') || localStorage.getItem('authToken');
      
      if (!token) {
        setError('Please login to view your orders.');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/orders/worker`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setTasks(response.data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('workerToken');
        localStorage.removeItem('authToken');
      } else {
        setError('Failed to load tasks. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTask = async (taskId) => {
    // Move task from pending to accepted
    const acceptedTask = tasks.find(task => task._id === taskId);
    if (acceptedTask) {
      setAcceptedTasks(prev => [...prev, acceptedTask]);
      setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
    }
  };

  const handleDeclineTask = async (taskId) => {
    // Remove task from pending list
    setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTimeSlots = (timeSlots) => {
    return timeSlots && timeSlots.length > 0 ? timeSlots.join(', ') : 'No specific time';
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Worker Dashboard</h1>
        <button className="refresh-btn" onClick={fetchTasks}>Refresh Tasks</button>
      </header>
      <div className="tasks-section">
        <h2>Tasks ({tasks.length})</h2>
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchTasks}>Retry</button>
          </div>
        )}
        {tasks.length === 0 ? (
          <div className="no-tasks">
            <p>No pending tasks available.</p>
          </div>
        ) : (
          <div className="tasks-grid">
            {tasks.map((task) => (
              <div key={task._id} className="task-card">
                <div className="task-header">
                  <h3>Service Request</h3>
                  <span className={`service-category ${task.serviceCategory?.toLowerCase().replace(' ', '-')}`}>
                    {task.serviceCategory}
                  </span>
                </div>
                <div className="task-content">
                  <div className="customer-info">
                    <h4>Customer Details</h4>
                    <div className="info-row">
                      <span className="label">Name:</span>
                      <span className="value">{task.contactInfo?.fullName}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Email:</span>
                      <span className="value">{task.contactInfo?.email}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Phone:</span>
                      <span className="value">{task.contactInfo?.mobileNumber}</span>
                    </div>
                  </div>
                  <div className="service-info">
                    <h4>Service Details</h4>
                    <div className="info-row">
                      <span className="label">Location:</span>
                      <span className="value location">{task.location}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Date:</span>
                      <span className="value">{formatDate(task.date)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Time Slot:</span>
                      <span className="value">{formatTimeSlots(task.timeSlots)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Total Amount:</span>
                      <span className="value amount">₹{task.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="task-actions">
                  <button className="btn accept-btn" onClick={() => handleAcceptTask(task._id)}>
                    ✅ Accept
                  </button>
                  <button className="btn decline-btn" onClick={() => handleDeclineTask(task._id)}>
                    ❌ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {acceptedTasks.length > 0 && (
        <div className="tasks-section">
          <h2>Accepted Tasks ({acceptedTasks.length})</h2>
          <div className="tasks-grid">
            {acceptedTasks.map((task) => (
              <div key={task._id} className="task-card accepted">
                <div className="task-header">
                  <h3>Service Request - Accepted</h3>
                  <span className={`service-category ${task.serviceCategory?.toLowerCase().replace(' ', '-')}`}>
                    {task.serviceCategory}
                  </span>
                </div>
                <div className="task-content">
                  <div className="customer-info">
                    <h4>Customer Details</h4>
                    <div className="info-row">
                      <span className="label">Name:</span>
                      <span className="value">{task.contactInfo?.fullName}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Email:</span>
                      <span className="value">{task.contactInfo?.email}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Phone:</span>
                      <span className="value">{task.contactInfo?.mobileNumber}</span>
                    </div>
                  </div>
                  <div className="service-info">
                    <h4>Service Details</h4>
                    <div className="info-row">
                      <span className="label">Location:</span>
                      <span className="value location">{task.location}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Date:</span>
                      <span className="value">{formatDate(task.date)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Time Slot:</span>
                      <span className="value">{formatTimeSlots(task.timeSlots)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Total Amount:</span>
                      <span className="value amount">₹{task.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkersDashboard;
