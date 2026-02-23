import { Link } from 'react-router-dom';
import { FiHome, FiArrowLeft } from 'react-icons/fi';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="text-center max-w-md">
                <div className="relative mb-8">
                    <h1 className="text-[140px] font-black text-gray-200 leading-none select-none">404</h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center shadow-xl shadow-pink-200">
                            <span className="text-3xl">🔍</span>
                        </div>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">Page Not Found</h2>
                <p className="text-gray-500 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <button onClick={() => window.history.back()} className="flex items-center gap-2 px-5 py-2.5 text-gray-600 font-medium rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors">
                        <FiArrowLeft className="w-4 h-4" />Go Back
                    </button>
                    <Link to="/" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl shadow-lg shadow-pink-200 hover:shadow-xl transition-all">
                        <FiHome className="w-4 h-4" />Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
