import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Boxes, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await login(email, password);
    setSubmitting(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message);
    }
  };

  const fillDemoAccount = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
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
            Twin<span className="text-[#477D78]">Ware</span> Portal
          </h2>
          <p className="mt-0.5 text-xs text-[#66736F]">
            Digital Twin Warehouse Management
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#FDEEEF] border border-[#F9D2D4] text-[#C62828] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
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
                placeholder="operator@twinware.com"
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
                placeholder="••••••••"
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
                <span>Sign In to TwinWare</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast-Login Assist */}
        <div className="pt-4 border-t border-[#E5E9E6]">
          <div className="text-[11px] font-semibold text-[#66736F] uppercase tracking-wider mb-2 text-center">
            Demo Credentials (1-Click Fill)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('admin@twinware.com', 'adminpassword123')}
              className="py-1.5 px-2.5 rounded-lg bg-[#F5F6F4] hover:bg-[#E5E9E6] text-xs text-[#253746] border border-[#E5E9E6] flex items-center justify-center gap-1.5 transition-colors font-medium"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#477D78]" />
              <span>Admin Demo</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('manager@twinware.com', 'managerpassword123')}
              className="py-1.5 px-2.5 rounded-lg bg-[#F5F6F4] hover:bg-[#E5E9E6] text-xs text-[#253746] border border-[#E5E9E6] flex items-center justify-center gap-1.5 transition-colors font-medium"
            >
              <Boxes className="w-3.5 h-3.5 text-[#477D78]" />
              <span>Manager Demo</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('viewer@twinware.com', 'viewerpassword123')}
              className="py-1.5 px-2.5 rounded-lg bg-[#F5F6F4] hover:bg-[#E5E9E6] text-xs text-[#253746] border border-[#E5E9E6] flex items-center justify-center gap-1.5 transition-colors font-medium"
            >
              <Boxes className="w-3.5 h-3.5 text-[#477D78]" />
              <span>Viewer Demo</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-[#66736F]">
          Need an account?{' '}
          <Link to="/register" className="text-[#477D78] hover:underline font-semibold">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
