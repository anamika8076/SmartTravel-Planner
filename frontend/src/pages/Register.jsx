import React from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import RegisterForm from '../components/auth/RegisterForm';

export default function Register({ onNavigateToLogin }) {
  return (
    <AuthLayout>
      <RegisterForm onNavigateToLogin={onNavigateToLogin} />
    </AuthLayout>
  );
}
