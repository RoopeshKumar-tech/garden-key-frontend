import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const API_BASE = 'http://localhost:4000/api/users';

const Login = ({ setShowLogin }) => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [fpStep, setFpStep] = useState(1);
  const [fpPhoneMatched, setFpPhoneMatched] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const nameRegex = /^[A-Za-z\s]*$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'name') {
      setErrors((prev) => ({
        ...prev,
        name: nameRegex.test(value)
          ? ''
          : 'Full name should only contain alphabets and spaces',
      }));
    }
    if (name === 'email') {
      setErrors((prev) => ({
        ...prev,
        email: emailRegex.test(value)
          ? ''
          : 'Please enter a valid email address',
      }));
    }
    if (name === 'phone') {
      setErrors((prev) => ({
        ...prev,
        phone: phoneRegex.test(value)
          ? ''
          : 'Enter a valid 10-digit phone number',
      }));
    }
    if (name === 'password') {
      setErrors((prev) => ({
        ...prev,
        password: passwordRegex.test(value)
          ? ''
          : 'Password must be 8+ chars and include letters, numbers & special symbols',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (forgotMode) return;

    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match!');
        return;
      }
      if (errors.name || errors.email || errors.phone || errors.password) {
        toast.error('Please fix the validation errors before submitting');
        return;
      }
    }

    try {
      if (isLogin) {
        const response = await axios.post(`${API_BASE}/login`, {
          email: formData.email,
          password: formData.password,
        });

        if (response.data?.success) {
          const { token, user } = response.data;
          login(token);
          localStorage.setItem('token', token);
          localStorage.setItem('userData', JSON.stringify(user));
          toast.success('Welcome back!');
          setShowLogin(false);
        } else {
          toast.error(response.data?.message || 'Login failed');
        }
      } else {
        const payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        };

        const response = await axios.post(`${API_BASE}/register`, payload);

        if (response.data?.success) {
          toast.success('Account created successfully. Please login.');
          setFormData({
            name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
          });
          setErrors({ name: '', email: '', phone: '', password: '' });
          setIsLogin(true);
        } else {
          toast.error(response.data?.message || 'Registration failed');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    }
  };

  const handleStartForgot = () => {
    setForgotMode(true);
    setFpStep(1);
    setFpPhoneMatched(false);
    setFormData((prev) => ({
      ...prev,
      phone: '',
      password: '',
      confirmPassword: '',
    }));
    setErrors((prev) => ({ ...prev, phone: '', password: '' }));
  };

  const handleCancelForgot = () => {
    setForgotMode(false);
    setFpStep(1);
    setFpPhoneMatched(false);
    setErrors((prev) => ({ ...prev, phone: '', password: '' }));
  };

  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    const phone = formData.phone?.trim();
    if (!phoneRegex.test(phone)) {
      setErrors((prev) => ({
        ...prev,
        phone: 'Enter a valid 10-digit phone number',
      }));
      return;
    }
    try {
      const resp = await axios.post(`${API_BASE}/verify-phone`, { phone });
      if (resp.data?.matched) {
        setFpPhoneMatched(true);
        setFpStep(2);
        toast.success('Phone number matched. Please set a new password.');
      } else {
        setFpPhoneMatched(false);
        toast.error(resp.data?.message || 'Phone number not found.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error verifying phone number');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const { phone, password, confirmPassword } = formData;

    if (!passwordRegex.test(password)) {
      setErrors((prev) => ({
        ...prev,
        password:
          'Password must be 8+ chars and include letters, numbers & special symbols',
      }));
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    try {
      const resp = await axios.post(`${API_BASE}/reset-password`, {
        phone,
        newPassword: password,
      });

      if (resp.data?.success) {
        toast.success('Password updated successfully. Please login.');
        setForgotMode(false);
        setFpStep(1);
        setFpPhoneMatched(false);
        setFormData((prev) => ({
          ...prev,
          password: '',
          confirmPassword: '',
        }));
        setErrors((prev) => ({ ...prev, password: '' }));
        setIsLogin(true);
      } else {
        toast.error(resp.data?.message || 'Failed to update password');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating password');
    }
  };

  return (
    <div className="login">
      <div className="login-container">
        <button className="close-btn" onClick={() => setShowLogin(false)}>
          &times;
        </button>

        <div className="login-title">
          <h2>
            {forgotMode
              ? 'Forgot Password'
              : isLogin
                ? 'Welcome Back'
                : 'Create Account'}
          </h2>
        </div>

        {/* -------------------- FORGOT PASSWORD -------------------- */}
        {forgotMode ? (
          <form onSubmit={fpStep === 1 ? handleVerifyPhone : handleResetPassword}>
            <div className="login-inputs">
              {fpStep === 1 && (
                <>
                  <div className="input-group">
                    <label>Registered Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      placeholder="10-digit phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                    {errors.phone && (
                      <small className="error-text">{errors.phone}</small>
                    )}
                  </div>
                  <button type="submit" className="submit-button">
                    Verify Phone
                  </button>
                  <div className="toggle-state" style={{ marginTop: '0.6rem' }}>
                    <span
                      onClick={handleCancelForgot}
                      style={{ color: '#007bff', cursor: 'pointer' }}
                    >
                      Cancel
                    </span>
                  </div>
                </>
              )}

              {fpStep === 2 && (
                <>
                  <div className="input-group">
                    <label>New Password</label>
                    <div className="password-container">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="New password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <button
                        type="button"
                        className="show-password-button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    {errors.password && (
                      <small className="error-text">{errors.password}</small>
                    )}
                  </div>

                  <div className="input-group">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Re-enter new password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="submit-button"
                    style={{ marginTop: '10px' }}
                  >
                    Update Password
                  </button>

                  <div className="toggle-state" style={{ marginTop: '0.6rem' }}>
                    <span
                      onClick={handleCancelForgot}
                      style={{ color: '#007bff', cursor: 'pointer' }}
                    >
                      Cancel
                    </span>
                  </div>
                </>
              )}
            </div>
          </form>
        ) : (
          /* -------------------- LOGIN / SIGNUP FORM -------------------- */
          <form onSubmit={handleSubmit}>
            <div className="login-inputs">
              {!isLogin && (
                <>
                  <div className="input-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                    {errors.name && (
                      <small className="error-text">{errors.name}</small>
                    )}
                  </div>

                  <div className="input-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      placeholder="Enter 10-digit phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                    {errors.phone && (
                      <small className="error-text">{errors.phone}</small>
                    )}
                  </div>
                </>
              )}

              <div className="input-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && (
                  <small className="error-text">{errors.email}</small>
                )}
              </div>

              <div className="input-group">
                <label>Password</label>
                <div className="password-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="show-password-button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {!isLogin && errors.password && (
                  <small className="error-text">{errors.password}</small>
                )}
              </div>

              {!isLogin && (
                <div className="input-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}
            </div>

            <button type="submit" className="submit-button">
              {isLogin ? 'Login' : 'Create Account'}
            </button>
          </form>
        )}

        {!forgotMode && (
          <div
            style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}
          >
            <div className="toggle-state">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <span onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? ' Sign Up' : ' Login'}
              </span>
            </div>

            {isLogin && (
              <div style={{ alignSelf: 'center', fontSize: '0.9rem' }}>
                <button
                  type="button"
                  onClick={handleStartForgot}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#007bff',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;