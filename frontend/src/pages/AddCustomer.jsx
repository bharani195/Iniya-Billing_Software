import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiPhone, FiMail, FiMapPin, FiArrowRight, FiArrowLeft, FiSearch, FiUsers, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { customersAPI } from '../services/api';

export default function AddCustomer() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [searchMode, setSearchMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        gstin: '',
    });

    // Search existing customers
    useEffect(() => {
        if (searchQuery.length >= 2) {
            const timer = setTimeout(async () => {
                try {
                    const response = await customersAPI.getAll({ search: searchQuery });
                    setSearchResults(response.data.results || response.data || []);
                } catch (error) {
                    console.error('Search error:', error);
                }
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSelectedCustomer(null);
    };

    const selectExistingCustomer = (customer) => {
        setSelectedCustomer(customer);
        setFormData({
            name: customer.name || '',
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || '',
            city: customer.city || '',
            state: customer.state || '',
            pincode: customer.pincode || '',
            gstin: customer.gstin || '',
        });
        setSearchQuery('');
        setSearchResults([]);
        setSearchMode(false);
        toast.success(`Selected: ${customer.name}`);
    };

    const handleNext = async () => {
        if (!formData.name.trim()) {
            toast.error('Customer name is required');
            return;
        }

        try {
            setLoading(true);
            let customerId = selectedCustomer?.id;
            let customerName = formData.name;

            // If not using existing customer, create new one
            if (!selectedCustomer) {
                const response = await customersAPI.create(formData);
                customerId = response.data.id;
                toast.success(`Customer "${formData.name}" created!`);
            }

            // Navigate to CreateJobOrder with customer data
            navigate('/joborders/create', {
                state: {
                    fromQuickOrder: true,
                    customerId: customerId,
                    customerName: customerName,
                    customerPhone: formData.phone,
                    customerAddress: formData.address,
                }
            });
        } catch (error) {
            console.error('Error:', error);
            // If customer already exists, try to use that
            if (error.response?.status === 400) {
                toast.error('Customer with this name may already exist. Try searching.');
            } else {
                toast.error('Failed to save customer');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); }
            `}</style>

            {/* Progress Indicator */}
            <div className="glass-card rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white flex items-center justify-center font-bold shadow-lg">
                            1
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Step 1 of 3</p>
                            <p className="font-semibold text-gray-900">Customer Details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <div className="w-8 h-1 bg-gray-200 rounded-full"></div>
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">2</div>
                        <div className="w-8 h-1 bg-gray-200 rounded-full"></div>
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">3</div>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-cyan-600 to-teal-600 p-6 shadow-xl">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                        <FiArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <FiUsers className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-white">
                                <h1 className="text-2xl font-bold">Add Customer</h1>
                                <p className="text-white/70 text-sm">Create new or select existing customer</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search/Create Toggle */}
            <div className="glass-card rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex gap-2">
                    <button
                        onClick={() => { setSearchMode(false); setSelectedCustomer(null); }}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${!searchMode
                                ? 'bg-cyan-500 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <FiUser className="inline w-4 h-4 mr-2" />
                        New Customer
                    </button>
                    <button
                        onClick={() => setSearchMode(true)}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${searchMode
                                ? 'bg-cyan-500 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <FiSearch className="inline w-4 h-4 mr-2" />
                        Existing Customer
                    </button>
                </div>
            </div>

            {/* Search Section */}
            {searchMode && (
                <div className="glass-card rounded-2xl p-6 shadow-sm border border-gray-100 animate-fadeIn">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Search Customer
                    </label>
                    <div className="relative">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Type customer name or phone..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none"
                        />
                    </div>
                    {searchResults.length > 0 && (
                        <div className="mt-3 max-h-60 overflow-y-auto border border-gray-100 rounded-xl divide-y">
                            {searchResults.map((customer) => (
                                <button
                                    key={customer.id}
                                    onClick={() => selectExistingCustomer(customer)}
                                    className="w-full p-3 text-left hover:bg-cyan-50 transition-colors flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                                        <FiUser className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">{customer.name}</p>
                                        <p className="text-sm text-gray-500">{customer.phone} • {customer.city}</p>
                                    </div>
                                    <FiArrowRight className="w-4 h-4 text-gray-400" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Customer Form */}
            <div className="glass-card rounded-2xl p-6 shadow-sm border border-gray-100">
                {selectedCustomer && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                        <FiCheck className="w-5 h-5 text-green-600" />
                        <span className="text-green-700 font-medium">Using existing customer: {selectedCustomer.name}</span>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <FiUser className="inline w-4 h-4 mr-1" />
                            Customer Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter customer name"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <FiPhone className="inline w-4 h-4 mr-1" />
                                Phone
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Phone number"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <FiMail className="inline w-4 h-4 mr-1" />
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email address"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">GSTIN</label>
                        <input
                            type="text"
                            name="gstin"
                            value={formData.gstin}
                            onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                            placeholder="15 digit GSTIN"
                            maxLength={15}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <FiMapPin className="inline w-4 h-4 mr-1" />
                            Address
                        </label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Full address"
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
                            <input
                                type="text"
                                name="pincode"
                                value={formData.pincode}
                                onChange={handleChange}
                                maxLength={6}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <FiArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <button
                    onClick={handleNext}
                    disabled={loading || !formData.name.trim()}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Saving...
                        </>
                    ) : (
                        <>
                            Next: Order Details
                            <FiArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
