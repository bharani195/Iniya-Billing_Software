import { useState, useEffect } from 'react';
import { FiSave, FiUpload, FiBriefcase } from 'react-icons/fi';
import { companyAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function CompanyProfile() {
    const [company, setCompany] = useState({
        name: '', address: '', city: '', state: '', pincode: '', phone: '', email: '',
        website: '', gstin: '', pan: '', bank_name: '', account_number: '', ifsc_code: '',
        invoice_prefix: 'INV', invoice_start_number: 1, terms_and_conditions: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchCompany(); }, []);

    const fetchCompany = async () => {
        try {
            const response = await companyAPI.getProfile();
            if (response.data) {
                // Convert null values to empty strings to avoid controlled/uncontrolled input warnings
                const cleanedData = Object.fromEntries(
                    Object.entries(response.data).map(([key, value]) => [key, value ?? ''])
                );
                setCompany({ ...company, ...cleanedData });
            }
        } catch { /* Company might not exist yet */ }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Exclude file upload fields and read-only fields from update
            const { logo, signature, logo_url, signature_url, id, created_at, updated_at, ...updateData } = company;
            await companyAPI.updateProfile(updateData);
            toast.success('Company profile saved');
        } catch (error) {
            console.error('Save error:', error.response?.data);
            toast.error(error.response?.data?.detail || error.response?.data?.name?.[0] || 'Failed to save');
        }
        finally { setSaving(false); }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('logo', file);
        try {
            await companyAPI.uploadLogo(formData);
            toast.success('Logo uploaded');
            fetchCompany();
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
            fetchCompany();
        } catch { toast.error('Failed to upload signature'); }
    };

    if (loading) {
        return <div className="flex items-center justify-center py-12"><div className="spinner text-primary-500"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold text-dark-900">Company Profile</h1><p className="text-dark-500">Manage your business information</p></div>
                <button onClick={handleSubmit} disabled={saving} className="btn-primary">
                    {saving ? <span className="spinner"></span> : <FiSave className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Logo & Basic Info */}
                <div className="card">
                    <h3 className="font-semibold text-dark-900 mb-4 flex items-center gap-2"><FiBriefcase className="w-5 h-5" />Business Information</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="flex flex-col items-center justify-center p-6 bg-dark-50 rounded-xl border-2 border-dashed border-dark-200">
                            {company.logo_url ? (
                                <img src={company.logo_url} alt="Logo" className="w-24 h-24 object-contain mb-4" />
                            ) : (
                                <div className="w-24 h-24 rounded-xl bg-dark-200 flex items-center justify-center mb-4">
                                    <FiBriefcase className="w-10 h-10 text-dark-400" />
                                </div>
                            )}
                            <label className="btn-secondary cursor-pointer">
                                <FiUpload className="w-4 h-4" />Upload Logo
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </label>
                        </div>
                        <div className="lg:col-span-2 space-y-4">
                            <div>
                                <label className="label">Business Name *</label>
                                <input type="text" required value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} className="input" placeholder="Your Business Name" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Phone</label>
                                    <input type="tel" value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} className="input" />
                                </div>
                                <div>
                                    <label className="label">Email</label>
                                    <input type="email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} className="input" />
                                </div>
                            </div>
                            <div>
                                <label className="label">Website</label>
                                <input type="url" value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} className="input" placeholder="https://www.yourwebsite.com" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="card">
                    <h3 className="font-semibold text-dark-900 mb-4">Address</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="label">Address</label>
                            <textarea value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} className="input" rows={2} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div><label className="label">City</label><input type="text" value={company.city} onChange={(e) => setCompany({ ...company, city: e.target.value })} className="input" /></div>
                            <div><label className="label">State</label><input type="text" value={company.state} onChange={(e) => setCompany({ ...company, state: e.target.value })} className="input" /></div>
                            <div><label className="label">Pincode</label><input type="text" value={company.pincode} onChange={(e) => setCompany({ ...company, pincode: e.target.value })} className="input" maxLength={6} /></div>
                        </div>
                    </div>
                </div>

                {/* Tax Information */}
                <div className="card">
                    <h3 className="font-semibold text-dark-900 mb-4">Tax Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">GSTIN</label>
                            <input type="text" value={company.gstin} onChange={(e) => setCompany({ ...company, gstin: e.target.value.toUpperCase() })} className="input font-mono" maxLength={15} placeholder="22AAAAA0000A1Z5" />
                        </div>
                        <div>
                            <label className="label">PAN</label>
                            <input type="text" value={company.pan} onChange={(e) => setCompany({ ...company, pan: e.target.value.toUpperCase() })} className="input font-mono" maxLength={10} placeholder="AAAAA0000A" />
                        </div>
                    </div>
                </div>

                {/* Bank Details */}
                <div className="card">
                    <h3 className="font-semibold text-dark-900 mb-4">Bank Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="label">Bank Name</label><input type="text" value={company.bank_name} onChange={(e) => setCompany({ ...company, bank_name: e.target.value })} className="input" /></div>
                        <div><label className="label">Account Number</label><input type="text" value={company.account_number} onChange={(e) => setCompany({ ...company, account_number: e.target.value })} className="input font-mono" /></div>
                        <div><label className="label">IFSC Code</label><input type="text" value={company.ifsc_code} onChange={(e) => setCompany({ ...company, ifsc_code: e.target.value.toUpperCase() })} className="input font-mono" /></div>
                    </div>
                </div>

                {/* Invoice Settings */}
                <div className="card">
                    <h3 className="font-semibold text-dark-900 mb-4">Invoice Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="label">Invoice Prefix</label><input type="text" value={company.invoice_prefix} onChange={(e) => setCompany({ ...company, invoice_prefix: e.target.value })} className="input" /></div>
                        <div><label className="label">Starting Number</label><input type="number" min="1" value={company.invoice_start_number} onChange={(e) => setCompany({ ...company, invoice_start_number: parseInt(e.target.value) })} className="input" /></div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Authorized Signature Upload */}
                        <div>
                            <label className="label">Authorized Signature</label>
                            <div className="flex items-center gap-4 p-4 bg-dark-50 rounded-xl border-2 border-dashed border-dark-200">
                                {company.signature_url ? (
                                    <img src={company.signature_url} alt="Signature" className="h-16 object-contain" />
                                ) : (
                                    <div className="h-16 w-32 rounded bg-dark-200 flex items-center justify-center">
                                        <span className="text-dark-400 text-sm">No Signature</span>
                                    </div>
                                )}
                                <label className="btn-secondary cursor-pointer text-sm">
                                    <FiUpload className="w-4 h-4" />Upload
                                    <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                                </label>
                            </div>
                            <p className="text-xs text-dark-400 mt-1">This will appear on generated invoices.</p>
                        </div>
                        {/* Terms */}
                        <div>
                            <label className="label">Terms & Conditions</label>
                            <textarea value={company.terms_and_conditions} onChange={(e) => setCompany({ ...company, terms_and_conditions: e.target.value })} className="input" rows={4} placeholder="Enter your default terms and conditions for invoices..." />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
