import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiUsers, FiClipboard, FiFileText, FiArrowRight, FiArrowLeft,
    FiCheck, FiUser, FiPhone, FiMail, FiMapPin, FiPackage,
    FiCalendar, FiDollarSign, FiPlus, FiTrash2, FiZap
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { customersAPI, jobordersAPI } from '../services/api';
import DatePicker from '../components/DatePicker';
import Dropdown from '../components/Dropdown';

const STEPS = [
    { id: 1, title: 'Customer Details', icon: FiUsers, color: 'from-cyan-500 to-blue-500' },
    { id: 2, title: 'Order Details', icon: FiClipboard, color: 'from-pink-500 to-rose-500' },
];

export default function QuickOrder() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [serviceRates, setServiceRates] = useState([]);
    const [nextJobNumber, setNextJobNumber] = useState('');

    // Customer Data
    const [customerData, setCustomerData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        gst_number: '',
    });

    // Order Data
    const [orderData, setOrderData] = useState({
        design_name: '',
        material_type_name: '',
        material_quantity: '',
        material_unit: 'MTR',
        printing_type_name: '',
        num_colors: 1,
        expected_delivery: '',
        priority: 'normal',
        customer_notes: '',
    });

    // Services
    const [services, setServices] = useState([]);

    // Created IDs for linking
    const [createdCustomerId, setCreatedCustomerId] = useState(null);
    const [createdOrderId, setCreatedOrderId] = useState(null);
    const [createdOrderNumber, setCreatedOrderNumber] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [ratesRes, numberRes] = await Promise.all([
                jobordersAPI.getServiceRates(),
                jobordersAPI.getNextNumber()
            ]);
            setServiceRates(ratesRes.data?.results || ratesRes.data || []);
            setNextJobNumber(numberRes.data.job_number);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleCustomerChange = (e) => {
        const { name, value } = e.target;
        setCustomerData(prev => ({ ...prev, [name]: value }));
    };

    const handleOrderChange = (e) => {
        const { name, value } = e.target;
        setOrderData(prev => ({ ...prev, [name]: value }));
    };

    const addService = () => {
        setServices(prev => [...prev, {
            service_name: '',
            quantity: 1,
            rate: 0,
            gst_rate: 5
        }]);
    };

    const updateService = (index, field, value) => {
        setServices(prev => {
            const updated = [...prev];
            updated[index][field] = value;
            return updated;
        });
    };

    const removeService = (index) => {
        setServices(prev => prev.filter((_, i) => i !== index));
    };

    const calculateTotal = () => {
        return services.reduce((sum, s) => sum + (s.quantity * s.rate), 0);
    };

    // Step 1: Save Customer
    const saveCustomer = async () => {
        if (!customerData.name.trim()) {
            toast.error('Customer name is required');
            return false;
        }

        try {
            setLoading(true);
            const response = await customersAPI.create(customerData);
            setCreatedCustomerId(response.data.id);
            toast.success(`Customer "${customerData.name}" saved!`);
            return true;
        } catch (error) {
            console.error('Error saving customer:', error);
            // If customer already exists, try to find them
            if (error.response?.data?.name) {
                try {
                    const searchRes = await customersAPI.getAll();
                    const existing = searchRes.data?.results?.find(c =>
                        c.name.toLowerCase() === customerData.name.toLowerCase()
                    );
                    if (existing) {
                        setCreatedCustomerId(existing.id);
                        toast.success(`Using existing customer "${customerData.name}"`);
                        return true;
                    }
                } catch (e) {
                    console.error('Search error:', e);
                }
            }
            toast.error('Failed to save customer');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Save Order
    const saveOrder = async () => {
        if (!orderData.design_name.trim()) {
            toast.error('Design name is required');
            return false;
        }

        try {
            setLoading(true);
            const formDataToSend = new FormData();

            // Add customer name
            formDataToSend.append('customer_name', customerData.name);

            // Add order fields
            Object.keys(orderData).forEach(key => {
                formDataToSend.append(key, orderData[key]);
            });

            // Add services
            formDataToSend.append('services', JSON.stringify(services.map(s => ({
                service_name: s.service_name,
                quantity: parseFloat(s.quantity),
                rate: parseFloat(s.rate),
                gst_rate: parseFloat(s.gst_rate)
            }))));

            formDataToSend.append('assigned_workers', JSON.stringify([]));

            const response = await jobordersAPI.create(formDataToSend);
            setCreatedOrderId(response.data.id);
            setCreatedOrderNumber(response.data.job_number);
            toast.success(`Order ${response.data.job_number} created!`);
            return true;
        } catch (error) {
            console.error('Error saving order:', error);
            toast.error('Failed to save order');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        if (currentStep === 1) {
            const success = await saveCustomer();
            if (success) setCurrentStep(2);
        } else if (currentStep === 2) {
            const success = await saveOrder();
            if (success) {
                // Navigate to Create Invoice with order data
                navigate('/invoices/create', {
                    state: {
                        fromQuickOrder: true,
                        orderId: createdOrderId,
                        orderNumber: createdOrderNumber || nextJobNumber,
                        customerName: customerData.name,
                        services: services,
                        total: calculateTotal()
                    }
                });
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(165, 0, 255, 0.3); } 50% { box-shadow: 0 0 40px rgba(165, 0, 255, 0.5); } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .animate-glow { animation: pulse-glow 2s ease-in-out infinite; }
                .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); }
            `}</style>

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 shadow-xl">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative flex items-center gap-4">
                    <button onClick={() => navigate('/joborders')} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                        <FiArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center animate-glow">
                                <FiZap className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-white">
                                <h1 className="text-2xl font-bold">Quick Order Wizard</h1>
                                <p className="text-white/70 text-sm">Complete workflow: Customer → Order → Invoice</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-right">
                        <p className="text-white/70 text-sm">Order Number</p>
                        <p className="text-xl font-bold text-white font-mono">{nextJobNumber}</p>
                    </div>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="glass-card rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                    {STEPS.map((step, index) => (
                        <div key={step.id} className="flex items-center flex-1">
                            <div className={`flex items-center gap-3 ${currentStep >= step.id ? 'opacity-100' : 'opacity-40'}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentStep > step.id
                                    ? 'bg-green-500 text-white'
                                    : currentStep === step.id
                                        ? `bg-gradient-to-r ${step.color} text-white shadow-lg`
                                        : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {currentStep > step.id ? <FiCheck className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Step {step.id}</p>
                                    <p className="font-semibold text-gray-900">{step.title}</p>
                                </div>
                            </div>
                            {index < STEPS.length - 1 && (
                                <div className={`flex-1 h-1 mx-4 rounded-full ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                                    }`}></div>
                            )}
                        </div>
                    ))}
                    {/* Final step indicator */}
                    <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentStep > 2 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500 opacity-40'
                            }`}>
                            <FiFileText className="w-5 h-5" />
                        </div>
                        <div className="ml-3 opacity-40">
                            <p className="text-xs text-gray-500">Step 3</p>
                            <p className="font-semibold text-gray-900">Invoice</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step Content */}
            <div className="glass-card rounded-2xl p-6 shadow-sm border border-gray-100">
                {currentStep === 1 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                                <FiUsers className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Customer Information</h2>
                                <p className="text-sm text-gray-500">Enter or create customer details</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FiUser className="inline w-4 h-4 mr-1" />
                                    Customer Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={customerData.name}
                                    onChange={handleCustomerChange}
                                    placeholder="Enter customer name"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FiPhone className="inline w-4 h-4 mr-1" />
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={customerData.phone}
                                    onChange={handleCustomerChange}
                                    placeholder="Enter phone number"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FiMail className="inline w-4 h-4 mr-1" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={customerData.email}
                                    onChange={handleCustomerChange}
                                    placeholder="Enter email address"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FiMapPin className="inline w-4 h-4 mr-1" />
                                    Address
                                </label>
                                <textarea
                                    name="address"
                                    value={customerData.address}
                                    onChange={handleCustomerChange}
                                    placeholder="Enter full address"
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    GST Number (Optional)
                                </label>
                                <input
                                    type="text"
                                    name="gst_number"
                                    value={customerData.gst_number}
                                    onChange={handleCustomerChange}
                                    placeholder="Enter GST number"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                                <FiClipboard className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                                <p className="text-sm text-gray-500">For customer: <span className="font-medium text-pink-600">{customerData.name}</span></p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Design Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="design_name"
                                    value={orderData.design_name}
                                    onChange={handleOrderChange}
                                    placeholder="e.g., Floral Pattern A"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
                                <input
                                    type="text"
                                    name="material_type_name"
                                    value={orderData.material_type_name}
                                    onChange={handleOrderChange}
                                    placeholder="e.g., Cotton, Silk"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        name="material_quantity"
                                        value={orderData.material_quantity}
                                        onChange={handleOrderChange}
                                        placeholder="0"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                    <Dropdown
                                        options={[
                                            { value: 'MTR', label: 'Meters' },
                                            { value: 'PCS', label: 'Pieces' },
                                            { value: 'ROLL', label: 'Rolls' },
                                        ]}
                                        value={orderData.material_unit}
                                        onChange={(val) => setOrderData(prev => ({ ...prev, material_unit: val }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Printing Type</label>
                                <input
                                    type="text"
                                    name="printing_type_name"
                                    value={orderData.printing_type_name}
                                    onChange={handleOrderChange}
                                    placeholder="e.g., Screen Print"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FiCalendar className="inline w-4 h-4 mr-1" />
                                    Expected Delivery
                                </label>
                                <DatePicker
                                    value={orderData.expected_delivery}
                                    onChange={(val) => setOrderData(prev => ({ ...prev, expected_delivery: val }))}
                                    placeholder="Select delivery date"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <Dropdown
                                    options={[
                                        { value: 'normal', label: 'Normal' },
                                        { value: 'urgent', label: 'Urgent' },
                                        { value: 'express', label: 'Express' },
                                    ]}
                                    value={orderData.priority}
                                    onChange={(val) => setOrderData(prev => ({ ...prev, priority: val }))}
                                />
                            </div>
                        </div>

                        {/* Services Section */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <FiDollarSign className="w-5 h-5 text-pink-500" />
                                    Services & Charges
                                </h3>
                                <button
                                    type="button"
                                    onClick={addService}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                                >
                                    <FiPlus className="w-4 h-4" />
                                    Add Service
                                </button>
                            </div>

                            {services.length === 0 ? (
                                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-xl">
                                    <p>No services added yet</p>
                                    <button type="button" onClick={addService} className="mt-2 text-pink-600 hover:underline">
                                        Add your first service
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {services.map((service, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-xl">
                                            <div className="col-span-5">
                                                <label className="block text-xs text-gray-500 mb-1">Service Name</label>
                                                <input
                                                    type="text"
                                                    value={service.service_name}
                                                    onChange={(e) => updateService(index, 'service_name', e.target.value)}
                                                    placeholder="Service name"
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-pink-500 outline-none"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs text-gray-500 mb-1">Qty</label>
                                                <input
                                                    type="number"
                                                    value={service.quantity}
                                                    onChange={(e) => updateService(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-pink-500 outline-none"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs text-gray-500 mb-1">Rate (₹)</label>
                                                <input
                                                    type="number"
                                                    value={service.rate}
                                                    onChange={(e) => updateService(index, 'rate', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-pink-500 outline-none"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs text-gray-500 mb-1">Amount</label>
                                                <p className="px-3 py-2 text-sm font-medium text-gray-900">
                                                    {formatCurrency(service.quantity * service.rate)}
                                                </p>
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => removeService(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-end pt-2">
                                        <div className="text-right">
                                            <span className="text-gray-500">Total: </span>
                                            <span className="text-xl font-bold text-pink-600">{formatCurrency(calculateTotal())}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${currentStep === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    <FiArrowLeft className="w-5 h-5" />
                    Back
                </button>

                <button
                    type="button"
                    onClick={handleNext}
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Saving...
                        </>
                    ) : currentStep === 2 ? (
                        <>
                            Save & Create Invoice
                            <FiFileText className="w-5 h-5" />
                        </>
                    ) : (
                        <>
                            Next
                            <FiArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
