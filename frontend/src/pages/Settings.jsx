import { useState, useEffect } from 'react';
import {
    FiSave, FiSettings, FiRefreshCw, FiUpload, FiBriefcase,
    FiMapPin, FiFileText, FiPrinter, FiBell, FiDollarSign, FiCheck
} from 'react-icons/fi';
import { settingsAPI, companyAPI } from '../services/api';
import toast from 'react-hot-toast';
import Dropdown from '../components/Dropdown';

const TABS = [
    { id: 'business', label: 'Business Profile', icon: FiBriefcase, color: '#A500FF' },
    { id: 'taxbank', label: 'Tax & Banking', icon: FiDollarSign, color: '#10B981' },
    { id: 'invoice', label: 'Invoice Settings', icon: FiFileText, color: '#F59E0B' },
    { id: 'printing', label: 'Printing', icon: FiPrinter, color: '#3B82F6' },
    { id: 'notifications', label: 'Notifications', icon: FiBell, color: '#EF4444' },
];

export default function Settings() {
    const [activeTab, setActiveTab] = useState('business');
    const [settings, setSettings] = useState({});
    const [company, setCompany] = useState({
        name: '', address: '', city: '', state: '', pincode: '', phone: '', email: '',
        website: '', gstin: '', pan: '', bank_name: '', account_number: '', ifsc_code: '',
        invoice_prefix: 'INV', invoice_start_number: 1, terms_and_conditions: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [settingsRes, companyRes] = await Promise.all([
                settingsAPI.getAll(),
                companyAPI.getProfile()
            ]);

            const settingsData = settingsRes.data;
            if (!settingsData || Object.keys(settingsData).length === 0) {
                await settingsAPI.initDefaults();
                const refreshed = await settingsAPI.getAll();
                setSettings(refreshed.data || getDefaultSettings());
            } else {
                setSettings(settingsData);
            }

            if (companyRes.data) {
                const cleanedData = Object.fromEntries(
                    Object.entries(companyRes.data).map(([key, value]) => [key, value ?? ''])
                );
                setCompany(prev => ({ ...prev, ...cleanedData }));
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            setSettings(getDefaultSettings());
        }
        finally { setLoading(false); }
    };

    const getDefaultSettings = () => ({
        currency: '₹',
        decimal_places: '2',
        low_stock_threshold: '15',
        default_tax_rate: '5',
        enable_stock_alert: 'true',
        enable_payment_reminder: 'true',
        paper_size: 'A4',
        print_logo: 'true'
    });

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            await settingsAPI.update(settings);
            const { logo, signature, logo_url, signature_url, id, created_at, updated_at, ...updateData } = company;
            await companyAPI.updateProfile(updateData);
            toast.success('Settings saved successfully!');
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save settings');
        }
        finally { setSaving(false); }
    };

    const initDefaults = async () => {
        try {
            await settingsAPI.initDefaults();
            toast.success('Defaults restored');
            fetchData();
        } catch { toast.error('Failed to reset defaults'); }
    };

    const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));
    const updateCompany = (key, value) => setCompany(prev => ({ ...prev, [key]: value }));

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('logo', file);
        try {
            await companyAPI.uploadLogo(formData);
            toast.success('Logo uploaded');
            fetchData();
        } catch { toast.error('Failed to upload logo'); }
    };

    const handleSignatureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('signature', file);
        try {
            await companyAPI.uploadSignature(formData);
            toast.success('Signature uploaded');
            fetchData();
        } catch { toast.error('Failed to upload signature'); }
    };

    const activeTabData = TABS.find(t => t.id === activeTab);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin border-t-[#A500FF]"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <FiSettings className="w-6 h-6 text-[#A500FF] animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Inline Styles for Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(165, 0, 255, 0.2); }
                    50% { box-shadow: 0 0 30px rgba(165, 0, 255, 0.4); }
                }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .animate-slideIn { animation: slideIn 0.3s ease-out; }
                .glass-card {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.8);
                }
                .input-pro {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .input-pro:focus {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 20px rgba(165, 0, 255, 0.15);
                }
                .tab-indicator {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .btn-save:not(:disabled):hover {
                    animation: pulse-glow 1.5s infinite;
                }
                .upload-zone:hover {
                    border-color: #A500FF;
                    background: linear-gradient(135deg, rgba(165, 0, 255, 0.03) 0%, rgba(165, 0, 255, 0.08) 100%);
                }
                .toggle-card {
                    transition: all 0.3s ease;
                }
                .toggle-card:hover {
                    transform: translateX(4px);
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
                }
            `}</style>

            {/* Header with Gradient Background */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#A500FF] via-[#8B00E6] to-[#6B00B3] p-6 shadow-xl">
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <FiSettings className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Business Settings</h1>
                                <p className="text-white/70 text-sm">Configure your business profile and preferences</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={initDefaults}
                            className="group flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
                        >
                            <FiRefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                            <span className="hidden sm:inline">Reset</span>
                        </button>
                        <button
                            onClick={handleSaveAll}
                            disabled={saving}
                            className="btn-save flex items-center gap-2 px-5 py-2.5 bg-white text-[#A500FF] font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60"
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-[#A500FF] border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <FiSave className="w-4 h-4" />
                            )}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="glass-card rounded-2xl shadow-xl overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-100 overflow-x-auto bg-gray-50/50">
                    {TABS.map((tab, index) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex-1 min-w-[120px] flex flex-col items-center gap-2 py-5 px-4 transition-all duration-300 group ${activeTab === tab.id
                                ? 'bg-white text-gray-900'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                                }`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === tab.id
                                    ? 'text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                                    }`}
                                style={{
                                    backgroundColor: activeTab === tab.id ? tab.color : undefined,
                                    boxShadow: activeTab === tab.id ? `0 4px 15px ${tab.color}40` : undefined
                                }}
                            >
                                <tab.icon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium text-center leading-tight">{tab.label}</span>
                            {activeTab === tab.id && (
                                <div
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-t-full tab-indicator"
                                    style={{ backgroundColor: tab.color }}
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-8 animate-slideIn" key={activeTab}>

                    {/* Business Profile Tab */}
                    {activeTab === 'business' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Logo Upload */}
                                <div className="upload-zone flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-gray-200 transition-all duration-300 cursor-pointer">
                                    {company.logo_url ? (
                                        <div className="relative group">
                                            <img src={company.logo_url} alt="Logo" className="w-32 h-32 object-contain rounded-2xl shadow-lg mb-4 transition-transform group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-white text-sm font-medium">Change Logo</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4 shadow-inner">
                                            <FiBriefcase className="w-14 h-14 text-gray-300" />
                                        </div>
                                    )}
                                    <label className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#A500FF] to-[#8B00E6] text-white font-medium text-sm rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                                        <FiUpload className="w-4 h-4" />
                                        Upload Logo
                                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                    </label>
                                    <p className="text-xs text-gray-400 mt-3">PNG, JPG • Max 2MB</p>
                                </div>

                                {/* Basic Info */}
                                <div className="lg:col-span-2 space-y-5">
                                    <div className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-[#A500FF] transition-colors">Business Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={company.name}
                                            onChange={(e) => updateCompany('name', e.target.value)}
                                            className="input-pro w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-100 text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#A500FF] focus:ring-4 focus:ring-[#A500FF]/10 outline-none"
                                            placeholder="Sri Mahalakshmi Printing Works"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="group">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-[#A500FF] transition-colors">Phone</label>
                                            <input type="tel" value={company.phone} onChange={(e) => updateCompany('phone', e.target.value)} className="input-pro w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-[#A500FF] focus:ring-4 focus:ring-[#A500FF]/10 outline-none" placeholder="+91 98765 43210" />
                                        </div>
                                        <div className="group">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-[#A500FF] transition-colors">Email</label>
                                            <input type="email" value={company.email} onChange={(e) => updateCompany('email', e.target.value)} className="input-pro w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-[#A500FF] focus:ring-4 focus:ring-[#A500FF]/10 outline-none" placeholder="email@business.com" />
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-[#A500FF] transition-colors">Website</label>
                                        <input type="url" value={company.website} onChange={(e) => updateCompany('website', e.target.value)} className="input-pro w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-[#A500FF] focus:ring-4 focus:ring-[#A500FF]/10 outline-none" placeholder="https://www.yourwebsite.com" />
                                    </div>
                                </div>
                            </div>

                            {/* Address Section */}
                            <div className="pt-8 border-t border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                        <FiMapPin className="w-5 h-5 text-white" />
                                    </div>
                                    Business Address
                                </h3>
                                <div className="space-y-4">
                                    <div className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                                        <textarea value={company.address} onChange={(e) => updateCompany('address', e.target.value)} className="input-pro w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-[#A500FF] focus:ring-4 focus:ring-[#A500FF]/10 outline-none resize-none" rows={2} placeholder="Enter your street address..." />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="group">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                                            <input type="text" value={company.city} onChange={(e) => updateCompany('city', e.target.value)} className="input-pro w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-[#A500FF] focus:ring-4 focus:ring-[#A500FF]/10 outline-none" />
                                        </div>
                                        <div className="group">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                                            <input type="text" value={company.state} onChange={(e) => updateCompany('state', e.target.value)} className="input-pro w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-[#A500FF] focus:ring-4 focus:ring-[#A500FF]/10 outline-none" />
                                        </div>
                                        <div className="group">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
                                            <input type="text" value={company.pincode} onChange={(e) => updateCompany('pincode', e.target.value)} className="input-pro w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-[#A500FF] focus:ring-4 focus:ring-[#A500FF]/10 outline-none" maxLength={6} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tax & Banking Tab */}
                    {activeTab === 'taxbank' && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                                        <FiFileText className="w-5 h-5 text-white" />
                                    </div>
                                    Tax Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">GSTIN</label>
                                        <input type="text" value={company.gstin} onChange={(e) => updateCompany('gstin', e.target.value.toUpperCase())} className="input-pro w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-100 font-mono tracking-wider focus:bg-white focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 outline-none" maxLength={15} placeholder="22AAAAA0000A1Z5" />
                                    </div>
                                    <div className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">PAN</label>
                                        <input type="text" value={company.pan} onChange={(e) => updateCompany('pan', e.target.value.toUpperCase())} className="input-pro w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-100 font-mono tracking-wider focus:bg-white focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 outline-none" maxLength={10} placeholder="AAAAA0000A" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                        <FiDollarSign className="w-5 h-5 text-white" />
                                    </div>
                                    Bank Account Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
                                        <input type="text" value={company.bank_name} onChange={(e) => updateCompany('bank_name', e.target.value)} className="input-pro w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 outline-none" placeholder="State Bank of India" />
                                    </div>
                                    <div className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
                                        <input type="text" value={company.account_number} onChange={(e) => updateCompany('account_number', e.target.value)} className="input-pro w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-100 font-mono focus:bg-white focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 outline-none" placeholder="1234567890" />
                                    </div>
                                    <div className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">IFSC Code</label>
                                        <input type="text" value={company.ifsc_code} onChange={(e) => updateCompany('ifsc_code', e.target.value.toUpperCase())} className="input-pro w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-100 font-mono tracking-wider focus:bg-white focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 outline-none" placeholder="SBIN0001234" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-6">Currency Settings</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Currency Symbol</label>
                                        <input type="text" value={settings.currency || '₹'} onChange={(e) => updateSetting('currency', e.target.value)} className="input-pro w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 outline-none" />
                                    </div>
                                    <div className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Decimal Places</label>
                                        <Dropdown
                                            options={[
                                                { value: '0', label: '0 decimal places' },
                                                { value: '2', label: '2 decimal places' },
                                                { value: '3', label: '3 decimal places' },
                                            ]}
                                            value={settings.decimal_places || '2'}
                                            onChange={(val) => updateSetting('decimal_places', val)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Invoice Settings Tab */}
                    {activeTab === 'invoice' && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
                                        <FiFileText className="w-5 h-5 text-white" />
                                    </div>
                                    Invoice Numbering
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice Prefix</label>
                                        <input type="text" value={company.invoice_prefix} onChange={(e) => updateCompany('invoice_prefix', e.target.value)} className="input-pro w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/10 outline-none" placeholder="INV" />
                                    </div>
                                    <div className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Starting Number</label>
                                        <input type="number" min="1" value={company.invoice_start_number} onChange={(e) => updateCompany('invoice_start_number', parseInt(e.target.value))} className="input-pro w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/10 outline-none" />
                                    </div>
                                    <div className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Default Tax Rate</label>
                                        <Dropdown
                                            options={[
                                                { value: '0', label: '0% (No Tax)' },
                                                { value: '5', label: '5% GST' },
                                                { value: '12', label: '12% GST' },
                                                { value: '18', label: '18% GST' },
                                                { value: '28', label: '28% GST' },
                                            ]}
                                            value={settings.default_tax_rate || '5'}
                                            onChange={(val) => updateSetting('default_tax_rate', val)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-6">Signature & Terms</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Authorized Signature</label>
                                        <div className="upload-zone flex items-center gap-5 p-5 rounded-xl border-2 border-dashed border-gray-200 transition-all duration-300">
                                            {company.signature_url ? (
                                                <img src={company.signature_url} alt="Signature" className="h-16 object-contain" />
                                            ) : (
                                                <div className="h-16 w-32 rounded-xl bg-gray-100 flex items-center justify-center">
                                                    <span className="text-gray-400 text-sm">No signature</span>
                                                </div>
                                            )}
                                            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium text-sm rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                                                <FiUpload className="w-4 h-4" />
                                                Upload
                                                <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">Appears on printed invoices</p>
                                    </div>

                                    <div className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Terms & Conditions</label>
                                        <textarea
                                            value={company.terms_and_conditions}
                                            onChange={(e) => updateCompany('terms_and_conditions', e.target.value)}
                                            className="input-pro w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/10 outline-none resize-none"
                                            rows={5}
                                            placeholder="Enter default invoice terms..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Printing Tab */}
                    {activeTab === 'printing' && (
                        <div className="space-y-6 max-w-xl">
                            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                    <FiPrinter className="w-5 h-5 text-white" />
                                </div>
                                Print Settings
                            </h3>

                            <div className="group">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Paper Size</label>
                                <Dropdown
                                    options={[
                                        { value: 'A4', label: 'A4 (210 × 297 mm)' },
                                        { value: 'A5', label: 'A5 (148 × 210 mm)' },
                                        { value: 'Letter', label: 'Letter (8.5 × 11 in)' },
                                        { value: 'Thermal', label: 'Thermal (80mm roll)' },
                                    ]}
                                    value={settings.paper_size || 'A4'}
                                    onChange={(val) => updateSetting('paper_size', val)}
                                />
                            </div>

                            <label className="toggle-card flex items-center gap-4 p-5 rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={settings.print_logo === 'true'}
                                        onChange={(e) => updateSetting('print_logo', e.target.checked ? 'true' : 'false')}
                                        className="sr-only peer"
                                    />
                                    <div className="w-12 h-7 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:shadow-sm after:transition-all peer-checked:bg-[#3B82F6]"></div>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">Include Company Logo</p>
                                    <p className="text-sm text-gray-500">Print your logo on invoices and receipts</p>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6 max-w-xl">
                            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-200">
                                    <FiBell className="w-5 h-5 text-white" />
                                </div>
                                Notification Settings
                            </h3>

                            <div className="group">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Low Stock Threshold</label>
                                <input
                                    type="number"
                                    value={settings.low_stock_threshold || '10'}
                                    onChange={(e) => updateSetting('low_stock_threshold', e.target.value)}
                                    className="input-pro w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-[#EF4444] focus:ring-4 focus:ring-[#EF4444]/10 outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-2">Alert when product quantity falls below this number</p>
                            </div>

                            <div className="space-y-3 pt-4">
                                <label className="toggle-card flex items-center gap-4 p-5 rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white cursor-pointer">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={settings.enable_stock_alert === 'true'}
                                            onChange={(e) => updateSetting('enable_stock_alert', e.target.checked ? 'true' : 'false')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-12 h-7 bg-gray-200 peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:shadow-sm after:transition-all peer-checked:bg-[#EF4444]"></div>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Low Stock Alerts</p>
                                        <p className="text-sm text-gray-500">Get notified when products are running low</p>
                                    </div>
                                </label>

                                <label className="toggle-card flex items-center gap-4 p-5 rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white cursor-pointer">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={settings.enable_payment_reminder === 'true'}
                                            onChange={(e) => updateSetting('enable_payment_reminder', e.target.checked ? 'true' : 'false')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-12 h-7 bg-gray-200 peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:shadow-sm after:transition-all peer-checked:bg-[#EF4444]"></div>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Payment Reminders</p>
                                        <p className="text-sm text-gray-500">Remind about pending customer dues</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
