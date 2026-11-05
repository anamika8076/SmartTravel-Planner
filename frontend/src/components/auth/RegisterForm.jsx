import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, ArrowRight, Loader2 } from 'lucide-react';
import AuthInput from './AuthInput';
import PasswordInput from './PasswordInput';
import { Alert } from '../ui/Feedback';
import { useAuth } from '../../context/AuthContext';
import { splitFormErrors } from '../../api/client';

export default function RegisterForm() {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const clearError = (field) => {
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[\w.@+-]+$/.test(username.trim())) {
      newErrors.username = 'Use only letters, numbers and @ . + - _';
    }

    if (!email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the Terms & Conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validateForm()) return;

    setIsLoading(true);
    const creds = { username: username.trim(), email: email.trim(), password };

    try {
      await register(creds);
    } catch (err) {
      const { fieldErrors, formError: msg } = splitFormErrors(err, ['username', 'email', 'password']);
      setErrors(fieldErrors);
      setFormError(msg);
      setIsLoading(false);
      return;
    }

    // Account exists now — sign straight in. If that fails, fall back to the login page.
    try {
      await login({ username: creds.username, password: creds.password, remember: true });
      navigate('/trips', { replace: true });
    } catch {
      navigate('/login', { replace: true, state: { registered: true } });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-left">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Create an account 🚀
        </h2>
        <p className="text-slate-500 text-sm">
          Start planning your personalized trips today.
        </p>
      </div>

      <Alert>{formError}</Alert>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthInput
          label="Username"
          id="username"
          icon={User}
          placeholder="e.g. lav"
          autoComplete="username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            clearError('username');
          }}
          error={errors.username}
          required
        />

        <AuthInput
          label="Email"
          id="email"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError('email');
          }}
          error={errors.email}
          required
        />

        <PasswordInput
          label="Password"
          id="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearError('password');
          }}
          error={errors.password}
          required
        />

        <PasswordInput
          label="Confirm Password"
          id="confirmPassword"
          placeholder="Confirm your password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            clearError('confirmPassword');
          }}
          error={errors.confirmPassword}
          required
        />

        {/* Terms & Conditions Checkbox */}
        <div className="space-y-1 pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none text-slate-600 hover:text-slate-900 transition-colors">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                clearError('agreeTerms');
              }}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 transition"
            />
            <span className="text-xs sm:text-sm leading-snug">
              I agree to the Terms & Conditions and Privacy Policy
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="text-xs text-rose-500 font-medium pl-6">{errors.agreeTerms}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-75 disabled:pointer-events-none transition-all duration-200 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2">
        <p className="text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="text-teal-600 hover:text-teal-700 font-semibold hover:underline transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
