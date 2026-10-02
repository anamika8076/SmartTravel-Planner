import React from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';

export default function Login({ onNavigateToRegister }) {
  return (
    <AuthLayout>
      <LoginForm onNavigateToRegister={onNavigateToRegister} />
    </AuthLayout>
  );
}
