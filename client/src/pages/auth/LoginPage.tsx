import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/ui/useToast';
import api from '../../lib/api';
import { ArrowUpRight } from 'lucide-react';
import { LunarLogo } from '../../components/common/LunarLogo';
import { StarfieldBackground } from '../../components/ui/StarfieldBackground';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      addToast('Logged in successfully', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to login', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 sm:p-6 lg:p-8">
      <StarfieldBackground />
      <div className="auth-layout relative z-10 w-full">
        <div className="auth-brand auth-brand-panel">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600 shadow-xs">
            <span>✦</span> Welcome to Lunar
          </div>
          <LunarLogo size={144} showText={true} stacked subtitle="Survey Builder Platform" className="auth-logo" />
        </div>
        <Card className="auth-panel auth-form-panel rounded-3xl border border-white/90 bg-white/85 shadow-2xl backdrop-blur-2xl">
          <CardHeader className="space-y-1.5 text-center pb-2">
            <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome back</CardTitle>
            <CardDescription className="text-sm text-slate-500">Enter your credentials to access your workspace</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-2">
              <Input
                id="email"
                type="email"
                label="Email"
                authStyle
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <div className="space-y-2">
                <div className="flex justify-end px-1">
                  <Link to="/forgot-password" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  label="Password"
                  authStyle
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-4">
              <Button type="submit" size="lg" className="w-full rounded-full" isLoading={isLoading}>
                Sign in
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
              <div className="text-center text-sm font-medium text-slate-500">
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
