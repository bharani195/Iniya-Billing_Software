import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { FiMail, FiLock, FiEye, FiEyeOff, FiPrinter, FiX, FiUser, FiAlertCircle, FiCheckCircle, FiZap, FiShield, FiBarChart2, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Login() {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Forgot password modal state
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [resetData, setResetData] = useState({ username: '', new_password: '', new_password_confirm: '' });
    const [resetLoading, setResetLoading] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Animated particles
    const [particles] = useState(Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5
    })));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.username || !formData.password) {
            toast.error('Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            await login(formData);
            toast.success('Welcome back!');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!resetData.username || !resetData.new_password || !resetData.new_password_confirm) {
            toast.error('Please fill in all fields'); return;
        }
        if (resetData.new_password !== resetData.new_password_confirm) {
            toast.error('Passwords do not match'); return;
        }
        if (resetData.new_password.length < 8) {
            toast.error('Password must be at least 8 characters'); return;
        }
        setResetLoading(true);
        try {
            await authAPI.resetPassword(resetData);
            toast.success('Password reset successfully!');
            setShowForgotModal(false);
            setResetData({ username: '', new_password: '', new_password_confirm: '' });
            setFormData({ ...formData, username: resetData.username });
        } catch (error) {
            const errorMsg = error.response?.data?.username?.[0] || error.response?.data?.new_password?.[0] || error.response?.data?.error || 'Failed to reset password';
            toast.error(errorMsg);
        } finally {
            setResetLoading(false);
        }
    };

    const features = [
        { icon: FiFileText, title: 'GST Invoicing', desc: 'Compliant billing with automatic tax calculation', color: 'from-blue-400 to-cyan-400' },
        { icon: FiBarChart2, title: 'Reports & Analytics', desc: 'Real-time business insights and trends', color: 'from-violet-400 to-purple-400' },
        { icon: FiZap, title: 'Job Orders', desc: 'Track printing jobs from start to finish', color: 'from-amber-400 to-orange-400' },
        { icon: FiShield, title: 'Secure & Reliable', desc: 'Your data is safe and always backed up', color: 'from-emerald-400 to-teal-400' },
    ];

    return (
        <div className="min-h-screen flex overflow-hidden">
            <style>{`
                @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } }
                @keyframes pulse-glow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.1); } }
                @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes particle-float { 0% { transform: translateY(100vh) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; } }
                @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                @keyframes wave { 0%, 100% { transform: translateX(-50%) translateY(0) rotate(0deg); } 50% { transform: translateX(-50%) translateY(-10px) rotate(2deg); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } }
                @keyframes typewriter { from { width: 0; } to { width: 100%; } }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
                .animate-gradient { background-size: 200% 200%; animation: gradient-shift 8s ease infinite; }
                .animate-particle { animation: particle-float linear infinite; }
                .animate-shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }
                .animate-wave { animation: wave 4s ease-in-out infinite; }
                .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
                .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
                .input-glow:focus { box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2), 0 0 20px rgba(139, 92, 246, 0.15); }
                .btn-glow { box-shadow: 0 10px 40px -10px rgba(139, 92, 246, 0.5); transition: all 0.3s ease; }
                .btn-glow:hover { box-shadow: 0 20px 50px -10px rgba(139, 92, 246, 0.7); transform: translateY(-2px); }
                .feature-card { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
                .feature-card:hover { transform: translateY(-5px) scale(1.02); }
            `}</style>

            {/* Left Panel - Premium Decorative */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Animated Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 animate-gradient"></div>

                {/* Mesh Gradient Overlay */}
                <div className="absolute inset-0 opacity-50" style={{
                    background: 'radial-gradient(at 20% 30%, rgba(236, 72, 153, 0.4) 0%, transparent 50%), radial-gradient(at 80% 20%, rgba(59, 130, 246, 0.4) 0%, transparent 50%), radial-gradient(at 50% 80%, rgba(34, 211, 238, 0.3) 0%, transparent 50%)'
                }}></div>

                {/* Animated Particles */}
                <div className="absolute inset-0 overflow-hidden">
                    {particles.map(p => (
                        <div
                            key={p.id}
                            className="absolute rounded-full bg-white animate-particle"
                            style={{
                                left: `${p.x}%`,
                                width: `${p.size}px`,
                                height: `${p.size}px`,
                                opacity: 0.6,
                                animationDuration: `${p.duration}s`,
                                animationDelay: `${p.delay}s`
                            }}
                        />
                    ))}
                </div>

                {/* Floating Orbs */}
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full blur-3xl animate-float"></div>
                <div className="absolute top-1/3 -right-20 w-96 h-96 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }}></div>
                <div className="absolute -bottom-20 left-1/4 w-72 h-72 bg-gradient-to-br from-violet-500/30 to-indigo-500/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '-1.5s' }}></div>

                {/* Wave Effect at Bottom */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] animate-wave">
                    <svg viewBox="0 0 1440 320" className="w-full">
                        <path fill="rgba(255,255,255,0.1)" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,154.7C672,160,768,224,864,229.3C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-center">
                    {/* Glowing Logo Container */}
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl animate-pulse-glow"></div>
                        <div className="relative w-28 h-28 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-2xl border border-white/30 overflow-hidden">
                            <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                            <div className="hidden items-center justify-center w-full h-full">
                                <FiPrinter className="w-12 h-12 text-white" />
                            </div>
                            <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
                        </div>
                    </div>

                    <h1 className="text-4xl font-bold text-white mb-3 tracking-tight animate-fadeInUp">
                        Lakshmi Printing Works
                    </h1>
                    <p className="text-white/70 text-lg max-w-md mb-12 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                        Professional Billing & Inventory Management for Modern Printing Business
                    </p>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-2 gap-4 max-w-lg">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="feature-card group bg-white/10 backdrop-blur-md rounded-2xl p-5 text-left border border-white/20 cursor-default animate-fadeInUp"
                                style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
                            >
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-white font-semibold text-sm mb-1">{feature.title}</h3>
                                <p className="text-white/60 text-xs leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.15) 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }}></div>

                <div className="w-full max-w-md relative z-10 animate-fadeInUp">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                            <FiPrinter className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Lakshmi Printing Works</h1>
                    </div>

                    {/* Login Card */}
                    <div className="glass-card rounded-3xl p-8 border border-gray-200/50">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <FiUser className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                            <p className="text-gray-500 mt-2">Sign in to your account to continue</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Username Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Username</label>
                                <div className={`relative transition-all duration-300 ${focusedField === 'username' ? 'transform scale-[1.02]' : ''}`}>
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'username' ? 'text-violet-500' : 'text-gray-400'}`}>
                                        <FiUser className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        onFocus={() => setFocusedField('username')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full px-12 py-4 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-violet-500 focus:bg-white outline-none transition-all input-glow"
                                        placeholder="Enter your username"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Password</label>
                                <div className={`relative transition-all duration-300 ${focusedField === 'password' ? 'transform scale-[1.02]' : ''}`}>
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'password' ? 'text-violet-500' : 'text-gray-400'}`}>
                                        <FiLock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full px-12 py-4 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-violet-500 focus:bg-white outline-none transition-all input-glow pr-14"
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-500 transition-colors p-1"
                                    >
                                        {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember & Forgot */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative">
                                        <input type="checkbox" className="peer sr-only" />
                                        <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:bg-violet-500 peer-checked:border-violet-500 transition-all"></div>
                                        <FiCheckCircle className="absolute inset-0 w-5 h-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                    </div>
                                    <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Remember me</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(true)}
                                    className="text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl btn-glow disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Signing in...
                                        </>
                                    ) : (
                                        <>Sign In</>
                                    )}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-violet-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-400">Secure Login</span>
                            </div>
                        </div>

                        {/* Security Badge */}
                        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                            <FiShield className="w-4 h-4 text-emerald-500" />
                            <span>256-bit SSL Encrypted</span>
                        </div>
                    </div>

                    <p className="text-center text-gray-400 text-sm mt-6">
                        © 2024 Lakshmi Printing Works. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForgotModal(false)} />
                    <div className="relative glass-card rounded-3xl w-full max-w-md p-8 animate-fadeInUp border border-gray-200/50">
                        <button
                            onClick={() => setShowForgotModal(false)}
                            className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <FiX className="w-5 h-5 text-gray-500" />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <FiLock className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Reset Password</h3>
                            <p className="text-gray-500 text-sm mt-1">Enter your username and new password</p>
                        </div>

                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Username</label>
                                <div className="relative">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={resetData.username}
                                        onChange={(e) => setResetData({ ...resetData, username: e.target.value })}
                                        className="w-full px-12 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-amber-500 focus:bg-white outline-none transition-all"
                                        placeholder="Enter your username"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">New Password</label>
                                <div className="relative">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={resetData.new_password}
                                        onChange={(e) => setResetData({ ...resetData, new_password: e.target.value })}
                                        className="w-full px-12 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-amber-500 focus:bg-white outline-none transition-all pr-12"
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showNewPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                                <div className="relative">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={resetData.new_password_confirm}
                                        onChange={(e) => setResetData({ ...resetData, new_password_confirm: e.target.value })}
                                        className="w-full px-12 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-amber-500 focus:bg-white outline-none transition-all"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                                <FiAlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700">
                                    Password must be at least 8 characters long and contain a mix of letters and numbers.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={resetLoading}
                                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
                            >
                                {resetLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Resetting...
                                    </span>
                                ) : 'Reset Password'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
