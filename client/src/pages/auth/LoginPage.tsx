import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/ui/useToast';
import api from '../../lib/api';
import { AlertCircle } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextEmailError = email.trim() ? '' : 'Enter your email address.';
    const nextPasswordError = password ? '' : 'Enter your password.';
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setAuthError('');
    if (nextEmailError || nextPasswordError) return;
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      addToast('Logged in successfully', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.error || 'We couldn’t sign you in. Check your details and try again.';
      setAuthError(message);
      addToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
        <Card className="auth-panel auth-form-panel rounded-3xl border border-[#e3e8f6] bg-white shadow-[0_6px_22px_rgba(30,45,99,0.08)]">
          <CardHeader className="space-y-2 pb-5 text-left">
            <CardTitle className="text-3xl font-extrabold tracking-tight text-[#14214a]">Welcome back</CardTitle>
            <CardDescription className="text-sm text-[#5d6985]">Sign in to continue building better surveys.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-5 pt-1">
              {authError && (
                <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-[#f1c7c4] bg-[#fff4f3] px-3.5 py-3 text-sm font-semibold text-[#b23d39]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{authError}</span>
                </div>
              )}
              <Input
                id="email"
                type="email"
                label="Email address"
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); setAuthError(''); }}
                error={emailError}
                required
                disabled={isLoading}
              />
              <Input
                id="password"
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(''); setAuthError(''); }}
                error={passwordError}
                required
                disabled={isLoading}
              />
              <div className="-mt-2 flex items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#5d6985]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[#c7d1e8] text-[#3b62c4] accent-[#3b62c4] focus:ring-2 focus:ring-[#3b62c4]/30"
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm font-bold text-[#3b62c4] hover:text-[#14214a] hover:underline">
                  Forgot password?
                </Link>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-5 pt-2">
              <Button type="submit" size="lg" className="w-full rounded-full" isLoading={isLoading}>
                Sign in
              </Button>
              <div className="text-center text-sm font-medium text-[#66718a]">
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-[#4169b2] hover:text-[#293b65] hover:underline">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
    </AuthLayout>
  );
};
