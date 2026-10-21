import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Boxes, Lock, Mail, User, ArrowRight, AlertCircle } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    const res = await register(username, email, password);
    setSubmitting(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F5F6F4]">
      <div className="max-w-md w-full space-y-6 bg-white border border-[#E5E9E6] p-8 rounded-2xl shadow-sm">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex p-2.5 rounded-xl bg-[#EDF3F2] border border-[#D0DFDD] text-[#477D78] mb-3">
            <Boxes className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#253746] tracking-tight">
            Create TwinWare Account
          </h2>
          <p className="mt-0.5 text-xs text-[#66736F]">
            New accounts are registered as Warehouse Manager
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#FDEEEF] border border-[#F9D2D4] text-[#C62828] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#66736F] mb-1">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#66736F]">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] text-xs placeholder-[#9AA5A1] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#66736F] mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#66736F]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@twinware.com"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] text-xs placeholder-[#9AA5A1] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#66736F] mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#66736F]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] text-xs placeholder-[#9AA5A1] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-[#477D78] hover:bg-[#3A6662] text-white font-semibold rounded-lg text-xs shadow-2xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-[#66736F]">
          Already registered?{' '}
          <Link to="/login" className="text-[#477D78] hover:underline font-semibold">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
