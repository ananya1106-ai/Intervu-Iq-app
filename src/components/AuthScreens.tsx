import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Eye, EyeOff, Mail, Lock, User, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase';
import { ensureUserDocument } from '../services/userService';
import { PageType } from '../types';
import { IntervuIqLogo } from './IntervuIqLogo';

interface AuthScreensProps {
  initialMode: 'login' | 'register' | 'forgot-password';
  onNavigate: (page: PageType) => void;
  onLoginSuccess: (userName: string, targetRole: string) => void;
}

export const AuthScreens: React.FC<AuthScreensProps> = ({ initialMode, onNavigate, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password' | 'verify-email'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [targetRole, setTargetRole] = useState('Full Stack Engineer');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (mode === 'login') {
      if (!email || !password) {
        setError('Email or password is incorrect');
        setIsLoading(false);
        return;
      }

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        if (!fbUser.emailVerified) {
          // Block access if email is not verified and show verification screen
          await signOut(auth);
          setUnverifiedEmail(fbUser.email || email);
          setMode('verify-email');
          setIsLoading(false);
          return;
        }

        const displayName = name || fbUser.displayName || email.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ') || 'User';
        
        // Ensure user's Firestore document exists at users/{uid} without overwriting existing data
        const userDoc = await ensureUserDocument(fbUser.uid, {
          fullName: displayName,
          email: fbUser.email || email,
          targetRole: targetRole
        });

        onLoginSuccess(userDoc.fullName || displayName, userDoc.targetRole || targetRole);
        onNavigate('dashboard');
      } catch (err: any) {
        console.error('Firebase Auth Sign In Error:', err);
        setError('Email or password is incorrect');
      } finally {
        setIsLoading(false);
      }
    } else if (mode === 'register') {
      if (!email || !password) {
        setError('Please enter both email and password.');
        setIsLoading(false);
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        // Send verification email
        await sendEmailVerification(fbUser);

        // Do not sign them in automatically
        await signOut(auth);

        setUnverifiedEmail(email);
        setMode('verify-email');
      } catch (err: any) {
        console.error('Firebase Auth Sign Up Error:', err);
        if (err.code === 'auth/email-already-in-use') {
          setError('User already exists. Please sign in');
        } else if (err.code === 'auth/weak-password') {
          setError('Password should be at least 6 characters.');
        } else if (err.code === 'auth/invalid-email') {
          setError('Invalid email address format.');
        } else {
          setError(err.message || 'Failed to create account. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Forgot password
      if (!email) {
        setError('Please enter your email to receive recovery instructions.');
        setIsLoading(false);
        return;
      }

      try {
        await sendPasswordResetEmail(auth, email);
        setSuccess('Security reset link sent! Check your inbox for instructions.');
      } catch (err: any) {
        console.error('Firebase Password Reset Error:', err);
        setError(err.message || 'Failed to send recovery email.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div id="auth-container" className="min-h-screen bg-[#07080c] flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      {/* Background glow meshes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand logo link to Landing */}
      <div 
        onClick={() => onNavigate('landing')}
        className="flex items-center gap-2.5 mb-8 cursor-pointer select-none group hover:opacity-90 transition-opacity"
      >
        <IntervuIqLogo size="lg" />
      </div>

      {/* Main Container Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#0d0f17] border border-zinc-800/80 rounded-2xl p-8 shadow-2xl shadow-emerald-950/5 relative z-10"
      >
        {mode === 'login' && (
          <div id="login-view">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-xs text-zinc-500 mb-6">Access your mock workspace, historical resume logs, and coaching statistics.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.rivera@stanford.edu"
                    className="w-full bg-[#121520] border border-zinc-800 focus:border-emerald-500 text-sm text-white px-10 py-3 rounded-xl focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Security Password</label>
                  <button 
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#121520] border border-zinc-800 focus:border-emerald-500 text-sm text-white px-10 py-3 rounded-xl focus:outline-none transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-emerald-400 hover:bg-emerald-300 disabled:bg-emerald-500/40 text-zinc-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Sign In to Coach <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-zinc-500 border-t border-zinc-800/80 pt-6">
              Don't have an elite account?{' '}
              <button 
                onClick={() => { setMode('register'); setError(''); }}
                className="text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Sign Up Now
              </button>
            </div>
          </div>
        )}

        {mode === 'register' && (
          <div id="register-view">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Establish Account</h2>
            <p className="text-xs text-zinc-500 mb-6">Unlock live biometric modules and unlimited custom resume grades.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Your Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full bg-[#121520] border border-zinc-800 focus:border-emerald-500 text-sm text-white px-10 py-3 rounded-xl focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Target Career Role</label>
                <select 
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-[#121520] border border-zinc-800 focus:border-emerald-500 text-sm text-white px-4 py-3 rounded-xl focus:outline-none transition-all"
                >
                  <option value="Full Stack Engineer">Full Stack Engineer</option>
                  <option value="Frontend Engineer">Frontend Engineer</option>
                  <option value="Backend Engineer">Backend Engineer</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="Data Scientist">Data Scientist</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.rivera@stanford.edu"
                    className="w-full bg-[#121520] border border-zinc-800 focus:border-emerald-500 text-sm text-white px-10 py-3 rounded-xl focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Choose Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#121520] border border-zinc-800 focus:border-emerald-500 text-sm text-white px-10 py-3 rounded-xl focus:outline-none transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-emerald-400 hover:bg-emerald-300 disabled:bg-emerald-500/40 text-zinc-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Create Elite Account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-zinc-500 border-t border-zinc-800/80 pt-6">
              Already have an account?{' '}
              <button 
                onClick={() => { setMode('login'); setError(''); }}
                className="text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {mode === 'forgot-password' && (
          <div id="forgot-password-view">
            <button 
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors mb-6 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
            </button>

            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Recovery Lock</h2>
            <p className="text-xs text-zinc-500 mb-6">Enter your email and we will send you secure instructions to reset your biometrics key.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Registered Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.rivera@stanford.edu"
                    className="w-full bg-[#121520] border border-zinc-800 focus:border-emerald-500 text-sm text-white px-10 py-3 rounded-xl focus:outline-none transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {!success && (
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-emerald-400 hover:bg-emerald-300 disabled:bg-emerald-500/40 text-zinc-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Send Recovery Code <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </form>
          </div>
        )}

        {mode === 'verify-email' && (
          <div id="verify-email-view" className="text-center py-2">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Verify Your Email</h2>
            <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
              We have sent you a verification email to <span className="font-semibold text-emerald-400">{unverifiedEmail || email}</span>. Please verify it and log in.
            </p>

            <button 
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className="w-full py-3.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
            >
              Login
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
