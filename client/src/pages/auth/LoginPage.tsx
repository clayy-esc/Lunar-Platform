import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, LockKeyhole, Mail } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/ui/useToast';
import api from '../../lib/api';
import { AuthLayout } from '../../components/layout/AuthLayout';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const validate = () => {
    const nextEmailError = emailPattern.test(email.trim()) ? '' : 'Enter a valid email address';
    const nextPasswordError = password ? '' : 'Enter your password';
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError) emailRef.current?.focus();
    else if (nextPasswordError) passwordRef.current?.focus();
    return !nextEmailError && !nextPasswordError;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError('');
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      addToast('Logged in successfully', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.error || "That email and password don't match. Try again or reset your password.";
      setAuthError(message);
      addToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout variant="login">
      <section className="auth-form-panel" aria-labelledby="login-heading">
        <div className="auth-heading">
          <h1 id="login-heading">Welcome back</h1>
          <p>Sign in to continue building better surveys.</p>
        </div>
        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="auth-field-region">
            <Input
              ref={emailRef}
              id="login-email"
              type="email"
              label="Email address"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => { setEmail(event.target.value); setEmailError(''); setAuthError(''); }}
              onBlur={() => { if (email && !emailPattern.test(email.trim())) setEmailError('Enter a valid email address'); }}
              error={emailError}
              icon={<Mail className="h-[18px] w-[18px]" aria-hidden="true" />}
              autoComplete="email"
              aria-invalid={Boolean(emailError)}
              required
              disabled={isLoading}
            />
            <Input
              ref={passwordRef}
              id="login-password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => { setPassword(event.target.value); setPasswordError(''); setAuthError(''); }}
              onBlur={() => { if (!password) setPasswordError('Enter your password'); }}
              error={passwordError}
              icon={<LockKeyhole className="h-[18px] w-[18px]" aria-hidden="true" />}
              autoComplete="current-password"
              aria-invalid={Boolean(passwordError)}
              required
              disabled={isLoading}
            />
            <div className="auth-options-row">
              <label>
                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                Remember me
              </label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
            <div className="auth-error-slot">
              {authError && <div role="alert" className="auth-error-banner"><AlertCircle aria-hidden="true" />{authError}</div>}
            </div>
          </div>
          <Button type="submit" size="lg" className="auth-primary-button w-full" isLoading={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </Button>
          <div className="auth-footer">Don&apos;t have an account? <Link to="/register">Sign up</Link></div>
        </form>
      </section>
    </AuthLayout>
  );
};
