import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { API_BASE_URL } from "../config/api";
import "./LoginPage.css";
import backgroundVideo from '../assets/background.mp4';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState("login");
  const { isAuthenticated, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [signupData, setSignupData] = useState({
    username: "",
    phone: "",
    email: "",
    password: "",
  });

  const [loginData, setLoginData] = useState({
    identifier: "",
    password: "",
  });

  const from = location.state?.from?.pathname || "/workers";

  const handleToggle = () => {
    setActiveTab((prev) => (prev === "login" ? "signup" : "login"));
  };

  const handleSignupChange = (e) => {
    setSignupData({
      ...signupData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
        username: signupData.username,
        phone: signupData.phone,
        email: signupData.email,
        password: signupData.password,
      });
      console.log("Signup response:", response.data);
      alert("Sign up successful! You can now log in.");
      setActiveTab("login");
    } catch (error) {
      console.error("Signup error:", error.response?.data || error.message);
      alert(error.response?.data?.error || "Signup failed");
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        identifier: loginData.identifier,
        password: loginData.password,
      });
      console.log("Login response:", response.data);
      const { token, user } = response.data;
      login(token, user);
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      alert(error.response?.data?.error || "Invalid credentials. Please check your username/email and password.");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  return (
    <div className="login-container">
      <video autoPlay muted loop className="background-video">
        <source src={backgroundVideo} type="video/mp4" />
      </video>
      <div className="content-overlay">
        <h1 className="login-heading">WELCOME TO LOCAL CONNECT</h1>
        <div className="switch-container">
          <span className={`switch-label ${activeTab === "login" ? "active" : ""}`}>
            LOG IN
          </span>
          <label className="switch">
            <input
              type="checkbox"
              checked={activeTab === "signup"}
              onChange={handleToggle}
            />
            <span className="slider round"></span>
          </label>
          <span className={`switch-label ${activeTab === "signup" ? "active" : ""}`}>
            SIGN UP
          </span>
        </div>
        <div className="card login-card">
          <div className="flip-container">
            <div className={`flipper ${activeTab === "signup" ? "flipped" : ""}`}>
              <div className="front">
                <h2 className="card-title">Log In</h2>
                <div className="card-body">
                  <form onSubmit={handleLoginSubmit}>
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control input-field"
                        name="identifier"
                        placeholder="Username or Email"
                        value={loginData.identifier}
                        onChange={handleLoginChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <input
                        type="password"
                        className="form-control input-field"
                        name="password"
                        placeholder="Password"
                        value={loginData.password}
                        onChange={handleLoginChange}
                        required
                      />
                    </div>
                    <button type="submit" className="btn login-btn">
                      LOG IN
                    </button>
                    <div className="mt-3 text-center">
                      <a href="/" className="forgot-password">
                        Forgot your password?
                      </a>
                    </div>
                  </form>
                </div>
              </div>
              <div className="back">
                <h2 className="card-title">Sign Up</h2>
                <div className="card-body">
                  <form onSubmit={handleSignupSubmit}>
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control input-field"
                        name="username"
                        placeholder="User Name"
                        value={signupData.username}
                        onChange={handleSignupChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control input-field"
                        name="phone"
                        placeholder="Phone Number"
                        value={signupData.phone}
                        onChange={handleSignupChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <input
                        type="email"
                        className="form-control input-field"
                        name="email"
                        placeholder="Email"
                        value={signupData.email}
                        onChange={handleSignupChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <input
                        type="password"
                        className="form-control input-field"
                        name="password"
                        placeholder="Set Password"
                        value={signupData.password}
                        onChange={handleSignupChange}
                        required
                      />
                    </div>
                    <button type="submit" className="btn login-btn">
                      Sign Up
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
