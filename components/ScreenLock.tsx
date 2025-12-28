import React, { useState, useEffect, useRef } from 'react';
import { Lock, UserCircle, X, LogIn } from 'lucide-react';
import { User } from '../types';

interface ScreenLockProps {
  currentUser: User;
  onUnlock: (password: string) => void;
  onUnlockWithLogin: (username: string, password: string) => Promise<void>;
  onLogout: () => void;
}

export const ScreenLock: React.FC<ScreenLockProps> = ({ currentUser, onUnlock, onUnlockWithLogin, onLogout }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your screen lock password');
      return;
    }

    setIsUnlocking(true);
    setError('');
    
    try {
      await onUnlock(password);
      setPassword('');
    } catch (err) {
      setError('Incorrect password. Please try again.');
      setPassword('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setError('Please enter your username and password');
      return;
    }

    setIsUnlocking(true);
    setError('');
    
    try {
      await onUnlockWithLogin(loginUsername.trim(), loginPassword);
      setLoginUsername('');
      setLoginPassword('');
      setShowLogin(false);
    } catch (err: any) {
      setError(err?.message || 'Incorrect username or password. Please try again.');
      setLoginPassword('');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-[100] p-6">
      <div className="w-full max-w-md">
        {/* User Profile */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full border-4 border-white/20 overflow-hidden bg-slate-700 mb-4 flex items-center justify-center">
            {currentUser.profilePhoto ? (
              <img src={currentUser.profilePhoto} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              <UserCircle size={60} className="text-white/60" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">{currentUser.name}</h2>
          <p className="text-sm text-white/60">{currentUser.email}</p>
        </div>

        {/* Lock Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20">
              <Lock size={32} className="text-white" />
            </div>
          </div>

          <h3 className="text-xl font-bold text-white text-center mb-2">Screen Locked</h3>
          <p className="text-sm text-white/70 text-center mb-6">
            {showLogin ? 'Enter your login credentials to unlock' : 'Enter your screen lock password to continue'}
          </p>

          {!showLogin ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter screen lock password"
                  className="w-full px-4 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none transition-all text-center font-medium"
                  disabled={isUnlocking}
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-rose-400 mt-2 text-center">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isUnlocking || !password.trim()}
                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-bold text-lg hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUnlocking ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    <Lock size={20} />
                    Unlock
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => {
                    setLoginUsername(e.target.value);
                    setError('');
                  }}
                  placeholder="Username"
                  className="w-full px-4 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none transition-all text-center font-medium"
                  disabled={isUnlocking}
                  autoFocus
                />
              </div>
              <div>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Password"
                  className="w-full px-4 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none transition-all text-center font-medium"
                  disabled={isUnlocking}
                />
                {error && (
                  <p className="text-sm text-rose-400 mt-2 text-center">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isUnlocking || !loginUsername.trim() || !loginPassword.trim()}
                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-bold text-lg hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUnlocking ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    Unlock with Login
                  </>
                )}
              </button>
            </form>
          )}

          {!showLogin && (
            <button
              onClick={() => {
                setShowLogin(true);
                setError('');
                setPassword('');
              }}
              className="w-full mt-3 py-2 text-white/70 hover:text-white text-sm font-medium transition-all"
            >
              Forgot screen lock password? Use login instead
            </button>
          )}

          {showLogin && (
            <button
              onClick={() => {
                setShowLogin(false);
                setError('');
                setLoginUsername('');
                setLoginPassword('');
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }}
              className="w-full mt-3 py-2 text-white/70 hover:text-white text-sm font-medium transition-all"
            >
              Use screen lock password instead
            </button>
          )}

          <button
            onClick={onLogout}
            className="w-full mt-4 py-3 text-white/70 hover:text-white text-sm font-medium transition-all"
          >
            Sign out and use different account
          </button>
        </div>

        {/* App Info */}
        <div className="mt-8 text-center">
          <p className="text-white/40 text-xs font-medium">SRJ SOCIAL</p>
        </div>
      </div>
    </div>
  );
};

