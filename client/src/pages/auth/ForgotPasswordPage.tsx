import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/useToast';
import api from '../../lib/api';
import { RefreshCcw, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { LunarLogo } from '../../components/common/LunarLogo';
import { AmbientBackground } from '../../components/ui/AmbientBackground';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newCode, setNewCode] = useState('');
  
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email, recoveryCode, newPassword });
      setNewCode(res.data.recoveryCode);
      setSuccess(true);
      addToast('Password reset successfully', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to reset password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 sm:p-6 lg:p-8">
        <AmbientBackground />
        <div className="auth-layout relative z-10 w-full">
          <div className="auth-brand auth-brand-panel">
            <LunarLogo size={56} showText={true} subtitle="Survey Builder Platform" />
          </div>
          <Card className="auth-panel auth-form-panel rounded-3xl border border-white/90 bg-white/85 text-center shadow-2xl backdrop-blur-2xl">
            <CardHeader className="pb-2">
              <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <span>✓</span> Reset Successful
              </div>
              <CardTitle className="text-3xl font-extrabold text-slate-900">Password Changed</CardTitle>
              <CardDescription className="text-sm text-slate-500">Your account credentials have been updated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-6 pt-2">
              <p className="text-sm text-slate-600 leading-relaxed">
                A <strong>new</strong> recovery code has been generated. Please save this immediately as the previous code is invalid:
              </p>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl font-mono text-2xl font-bold tracking-widest my-4 text-slate-900">
                {newCode}
              </div>
              <Button onClick={() => navigate('/login')} size="lg" className="w-full rounded-full mt-4">
                Return to Login
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 sm:p-6 lg:p-8">
      <AmbientBackground />
      <div className="auth-layout relative z-10 w-full">
        <div className="auth-brand auth-brand-panel">
          <LunarLogo size={144} showText={true} stacked subtitle="Survey Builder Platform" className="auth-logo" />
        </div>
        <Card className="auth-panel auth-form-panel rounded-3xl border border-white/90 bg-white/85 shadow-2xl backdrop-blur-2xl">
          <CardHeader className="space-y-1.5 text-center pb-2">
            <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">Reset Password</CardTitle>
            <CardDescription className="text-sm text-slate-500">Enter your email and 8-character recovery code</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-2">
              <Input
                id="email"
                type="email"
                label="Account Email"
                authStyle
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <Input
                id="code"
                type="text"
                label="Recovery Code"
                placeholder="8-character code"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                required
                disabled={isLoading}
                className="font-mono uppercase tracking-wider"
              />
              <Input
                id="new-password"
                type="password"
                label="New Password"
                authStyle
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
              />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-4">
              <Button type="submit" size="lg" className="w-full rounded-full" isLoading={isLoading}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Reset Password
              </Button>
              <Link to="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-900 flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to login
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
