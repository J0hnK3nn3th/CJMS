import React, { useState } from 'react';
import './LoginPage.css';
import { authService } from './services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const LoginPage = ({ onBack, onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    first_name: '',
    last_name: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const validateRegistration = () => {
    if (!formData.username || !formData.password) {
      setError('Username and password are required');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (isRegisterMode) {
        // Registration
        if (!validateRegistration()) {
          setIsLoading(false);
          return;
        }
        
        console.log('Attempting registration with:', formData.username);
        const response = await authService.register({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name
        });
        
        console.log('Registration successful:', response);
        
        // Store token and user data
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Call the callback to navigate to organizer page
        if (onLoginSuccess) {
          onLoginSuccess(response.user);
        }
      } else {
        // Login
        console.log('Attempting login with:', formData.username);
        const response = await authService.login({
          username: formData.username,
          password: formData.password
        });
        
        console.log('Login successful:', response);
        
        // Store token and user data
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Call the callback to navigate to organizer page
        if (onLoginSuccess) {
          onLoginSuccess(response.user);
        }
      }
    } catch (err) {
      console.error(isRegisterMode ? 'Registration error:' : 'Login error:', err);
      const errorMessage = err.response?.data?.error || err.message || 
        (isRegisterMode ? 'Registration failed. Please try again.' : 'Login failed. Please check your credentials.');
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      first_name: '',
      last_name: ''
    });
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <button className="close-btn" onClick={onBack} aria-label="Close">
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <div className="login-header">
          <h1>{isRegisterMode ? 'Create Account' : 'Welcome Back'}</h1>
          <p>{isRegisterMode ? 'Sign up for Campus Judging Management System' : 'Sign in to Campus Judging Management System'}</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          {isRegisterMode && (
            <>
              <div className="form-group">
                <label htmlFor="first_name">First Name</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="last_name">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                />
              </div>
            </>
          )}
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter your username"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={isRegisterMode ? "Enter password (min. 8 characters)" : "Enter your password"}
              required
            />
          </div>
          
          {isRegisterMode && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                required
              />
            </div>
          )}
          
          {!isRegisterMode && (
            <div className="form-options">
              <label className="checkbox-container">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Remember me
              </label>
            </div>
          )}
          
          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c33',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="login-submit-btn"
            disabled={isLoading}
          >
            {isLoading 
              ? (isRegisterMode ? 'Creating Account...' : 'Signing In...') 
              : (isRegisterMode ? 'Create Account' : 'Sign In')
            }
          </button>
        </form>
        
        <div className="login-footer">
          <p style={{ 
            marginBottom: '1rem', 
            color: '#70B2B2', 
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            {isRegisterMode ? 'Already have an account? ' : "Don't have an account? "}
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                toggleMode();
              }}
              style={{
                color: '#016B61',
                fontWeight: '600',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              {isRegisterMode ? 'Sign In' : 'Sign Up'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
