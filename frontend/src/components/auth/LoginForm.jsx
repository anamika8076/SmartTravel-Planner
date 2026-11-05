import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, ArrowRight, Loader2 } from 'lucide-react';
import AuthInput from './AuthInput';
import PasswordInput from './PasswordInput';
import { Alert } from '../ui/Feedback';
import { useAuth } from '../../context/AuthContext';
import { splitFormErrors } from '../../api/client';

export default function LoginForm() {
  const { login, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const justRegistered = location.state?.registered;

  const validateForm = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await login({ username: username.trim(), password, remember: rememberMe });
      const from = location.state?.from;
      navigate(from ? `${from.pathname}${from.search || ''}` : '/trips', { replace: true });
    } catch (err) {
      const { fieldErrors, formError: msg } = splitFormErrors(err, ['username', 'password']);
      setErrors(fieldErrors);
      setFormError(
        err.status === 401 ? 'Incorrect username or password. Please try again.' : msg
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-left">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Welcome back 👋
        </h2>
        <p className="text-slate-500 text-sm">
          Let’s continue planning your next adventure.
        </p>
      </div>

      {justRegistered && !formError && (
        <Alert type="success">Account created! Log in to start planning.</Alert>
      )}
      {sessionExpired && !formError && !justRegistered && (
        <Alert type="info">Your session expired. Please log in again.</Alert>
      )}
      <Alert>{formError}</Alert>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthInput
          label="Username"
          id="username"
          icon={User}
          placeholder="Your username"
          autoComplete="username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (errors.username) setErrors({ ...errors, username: '' });
          }}
          error={errors.username}
          required
        />

        <PasswordInput
          label="Password"
          id="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors({ ...errors, password: '' });
          }}
          error={errors.password}
          required
        />

        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-600 hover:text-slate-900 transition-colors pt-0.5">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 transition"
          />
          <span>Keep me logged in</span>
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-75 disabled:pointer-events-none transition-all duration-200"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Logging in...</span>
            </>
          ) : (
            <>
              <span>Log In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2 space-y-3">
        <p className="text-sm text-slate-600">
          Don’t have an account?{' '}
          <Link to="/register" className="text-teal-600 hover:text-teal-700 font-semibold hover:underline transition-colors">
            Sign up
          </Link>
        </p>
        <p className="text-xs text-slate-500">
          Just looking?{' '}
          <Link to="/destinations" className="text-slate-700 font-medium hover:underline">
            Browse destinations
          </Link>
        </p>
      </div>
    </div>
  );
}
