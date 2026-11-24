
import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  User,
  Building2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error: loginError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (loginError) throw loginError;
      } else {
        if (!fullName.trim() || !businessName.trim()) {
          throw new Error('Please complete all registration fields.');
        }

        const { error: signupError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              business_name: businessName.trim(),
            },
            emailRedirectTo: window.location.origin,
          },
        });

        if (signupError) throw signupError;

        setMessage(
          'Your account has been created! Please check your email and confirm your address. You can then sign in to set up your business workspace.'
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bizora-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-bizora-primary mb-5">
            <Building2 size={28} className="text-white" />
          </div>

          <h1 className="text-4xl font-bold text-white tracking-tight">
            Bizora
          </h1>

          <p className="text-gray-400 mt-2">
            Business operations, simplified.
          </p>
        </div>

        <div className="bg-bizora-surface border border-bizora-border rounded-2xl p-7 shadow-xl">
          <div className="mb-7">
            <h2 className="text-2xl font-semibold text-white">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>

            <p className="text-gray-400 text-sm mt-2">
              {isLogin
                ? 'Sign in to continue managing your business.'
                : 'Get started with your Bizora workspace.'}
            </p>
          </div>

          <div className="grid grid-cols-2 bg-bizora-background rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError('');
                setMessage('');
              }}
              className={`py-2 rounded-md text-sm font-medium transition ${
                isLogin
                  ? 'bg-bizora-elevated text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError('');
                setMessage('');
              }}
              className={`py-2 rounded-md text-sm font-medium transition ${
                !isLogin
                  ? 'bg-bizora-elevated text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Full name
                  </label>

                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-3 top-3.5 text-gray-500"
                    />

                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      required
                      className="w-full bg-bizora-background border border-bizora-border rounded-lg py-3 pl-10 pr-4 text-white outline-none focus:border-bizora-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Business name
                  </label>

                  <div className="relative">
                    <Building2
                      size={18}
                      className="absolute left-3 top-3.5 text-gray-500"
                    />

                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Your business name"
                      required
                      className="w-full bg-bizora-background border border-bizora-border rounded-lg py-3 pl-10 pr-4 text-white outline-none focus:border-bizora-primary"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-3.5 text-gray-500"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-bizora-background border border-bizora-border rounded-lg py-3 pl-10 pr-4 text-white outline-none focus:border-bizora-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3 top-3.5 text-gray-500"
                />

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  minLength={8}
                  required
                  className="w-full bg-bizora-background border border-bizora-border rounded-lg py-3 pl-10 pr-12 text-white outline-none focus:border-bizora-primary"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Password must contain at least 8 characters.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-bizora-success/10 border border-bizora-success/30 text-bizora-success rounded-lg p-3 text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-bizora-primary hover:bg-[#7666ed] disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading
                ? 'Please wait...'
                : isLogin
                  ? 'Sign in'
                  : 'Create account'}

              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-7">
            Secure business management powered by Bizora.
          </p>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          © 2026 Bizora. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
