import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import AuthInput from './AuthInput';
import PasswordInput from './PasswordInput';
import SocialLoginButton from './SocialLoginButton';

export default function LoginForm({ onNavigateToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMessage('');
    
    if (!validateForm()) return;

    setIsLoading(true);

    // Mock API authentication call
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('Logged in successfully! Redirecting to Trip Details...');
    }, 1200);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('Google authentication successful! Redirecting...');
    }, 1000);
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

      {/* Alert Messages */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5 shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Email Field */}
        <AuthInput
          label="Email"
          id="email"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors({ ...errors, email: '' });
          }}
          error={errors.email}
          required
        />

        {/* Password Field */}
        <PasswordInput
          label="Password"
          id="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors({ ...errors, password: '' });
          }}
          error={errors.password}
          required
        />

        {/* Remember me & Forgot password row */}
        <div className="flex items-center justify-between text-sm pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900 transition-colors">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 transition"
            />
            <span>Remember me</span>
          </label>
          <a
            href="#forgot-password"
            onClick={(e) => {
              e.preventDefault();
              alert('Password reset link sent to your email.');
            }}
            className="text-teal-600 hover:text-teal-700 font-medium text-xs sm:text-sm hover:underline transition-colors"
          >
            Forgot password?
          </a>
        </div>

        {/* Login Button */}
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

      {/* Divider */}
      <div className="relative flex items-center justify-center my-6">
        <div className="border-t border-slate-200 w-full" />
        <span className="bg-slate-50 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 absolute">
          OR
        </span>
      </div>

      {/* Google Login */}
      <SocialLoginButton
        text="Continue with Google"
        onClick={handleGoogleLogin}
      />

      {/* Switch to Register */}
      <div className="text-center pt-2">
        <p className="text-sm text-slate-600">
          Don’t have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToRegister}
            className="text-teal-600 hover:text-teal-700 font-semibold hover:underline transition-colors focus:outline-none"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
