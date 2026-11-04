import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/ui/useToast';
import api from '../../lib/api';
import { KeyRound } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { AuthLayout } from '../../components/layout/AuthLayout';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const strength = useMemo(() => {
    if (!password) return 0;
    return Math.min(4, Number(password.length >= 8) + Number(/[A-Z]/.test(password)) + Number(/\d/.test(password)) + Number(/[^A-Za-z0-9]/.test(password)));
  }, [password]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      addToast('Use at least 8 characters for your password', 'error');
      return;
    }
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

  return (
    <AuthLayout variant="register">
      <section className="auth-form-panel" aria-labelledby="register-heading">
        <div className="auth-heading">
          <h1 id="register-heading">Create your account</h1>
          <p>Start collecting insights today.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field-region auth-register-fields">
            <Input id="full-name" type="text" label="Full name" placeholder="Your name" value={fullName} onChange={(event) => setFullName(event.target.value)} icon={<UserRound className="h-[18px] w-[18px]" aria-hidden="true" />} autoComplete="name" disabled={isLoading} />
            <Input id="register-email" type="email" label="Email address" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} icon={<Mail className="h-[18px] w-[18px]" aria-hidden="true" />} autoComplete="email" required disabled={isLoading} />
            <Input id="register-password" type="password" label="Password" placeholder="Create a password" value={password} onChange={(event) => setPassword(event.target.value)} icon={<LockKeyhole className="h-[18px] w-[18px]" aria-hidden="true" />} autoComplete="new-password" required minLength={8} disabled={isLoading} />
            <div className="auth-password-hint">
              <div className="auth-strength-meter" aria-label={`Password strength: ${strength} of 4`}>
                {[1, 2, 3, 4].map((level) => <span key={level} className={level <= strength ? 'is-filled' : ''} />)}
              </div>
              <span>At least 8 characters</span>
            </div>
            <Input id="confirm-password" type="password" label="Confirm password" placeholder="Re-enter your password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} icon={<LockKeyhole className="h-[18px] w-[18px]" aria-hidden="true" />} autoComplete="new-password" required disabled={isLoading} />
          </div>
          <Button type="submit" size="lg" className="auth-primary-button w-full" isLoading={isLoading}>{isLoading ? 'Creating account…' : 'Create account'}</Button>
          <p className="auth-terms">By creating an account you agree to the Terms and Privacy Policy.</p>
          <div className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></div>
        </form>
      </section>
      <Modal isOpen={!!recoveryCode} onClose={() => navigate('/dashboard')} title="Save your recovery code">
        <div className="space-y-4 py-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600"><KeyRound className="h-6 w-6" /></div>
          <p className="text-sm leading-relaxed text-[#6b7699]">Save this one-time recovery code somewhere secure. You will need it if you forget your password.</p>
          <div className="rounded-2xl border border-[#e3e8f6] bg-[#f4f6fd] p-4 text-2xl font-bold tracking-widest text-[#14214a]">{recoveryCode}</div>
          <Button onClick={() => navigate('/dashboard')} size="lg" className="w-full">I saved it</Button>
        </div>
      </Modal>
    </AuthLayout>
  );
};
