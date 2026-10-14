import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/ui/useToast';
import api from '../../lib/api';
import { ArrowUpRight, KeyRound } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { SurveyNexusLogo } from '../../components/common/SurveyNexusLogo';
import { StarfieldBackground } from '../../components/ui/StarfieldBackground';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.post('/auth/register', { email, password });
      setRecoveryCode(res.data.recoveryCode);
      login(res.data.token, res.data.user);
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to create account', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseRecovery = () => {
    navigate('/dashboard');
  };

  return (
    <div className="auth-page relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 sm:p-6 lg:p-8">
      <StarfieldBackground />
      <div className="auth-layout relative z-10 w-full">
        <div className="auth-brand auth-brand-panel">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600 shadow-xs">
            <span>✦</span> Join SurveyNexus
          </div>
          <SurveyNexusLogo size={144} showText={true} stacked subtitle="Survey Builder Platform" className="auth-logo" />
        </div>
        <Card className="auth-panel auth-form-panel rounded-3xl border border-white/90 bg-white/85 shadow-2xl backdrop-blur-2xl">
          <CardHeader className="space-y-1.5 text-center pb-2">
            <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">Create an account</CardTitle>
            <CardDescription className="text-sm text-slate-500">Enter your details below to set up your workspace</CardDescription>
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
                minLength={8}
              />
              <Input
                id="confirm-password"
                type="password"
                label="Confirm Password"
                authStyle
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
              />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-4">
              <Button type="submit" size="lg" className="w-full rounded-full" isLoading={isLoading}>
                Create account
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
              <div className="text-center text-sm font-medium text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>

      <Modal isOpen={!!recoveryCode} onClose={handleCloseRecovery} title="Save Your Recovery Code">
        <div className="space-y-4 py-4 text-center">
          <div className="mx-auto w-12 h-12 bg-amber-50 border border-amber-200 text-amber-600 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            This is your one-time recovery code. If you forget your password, you will need this code to reset it.
            <strong className="block text-slate-900 mt-1">Please copy it and store it in a secure place.</strong>
          </p>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl font-mono text-2xl font-bold tracking-widest my-6 text-slate-800">
            {recoveryCode}
          </div>
          <Button onClick={handleCloseRecovery} size="lg" className="w-full rounded-full">
            I have saved it securely
          </Button>
        </div>
      </Modal>
    </div>
  );
};
