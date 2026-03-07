import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    FiFileText, FiUser, FiArrowLeft, FiPlus, FiTrash2, FiSave, FiCalendar, FiCheck,
    FiClipboard, FiTool, FiPackage, FiSettings, FiClock, FiImage
} from 'react-icons/fi';
import DatePicker from '../components/DatePicker';
import Dropdown from '../components/Dropdown';
import toast from 'react-hot-toast';
import { jobordersAPI, customersAPI, staffAPI } from '../services/api';

export default function CreateJobOrder() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const isEditMode = !!id && location.pathname.includes('/edit');
    const isViewMode = !!id && !location.pathname.includes('/edit');

    // Check if coming from Quick Order flow
    const fromQuickOrder = location.state?.fromQuickOrder || false;
    const customerDataFromState = location.state || {};
    const [loading, setLoading] = useState(false);
    const [loadingJob, setLoadingJob] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [materialTypes, setMaterialTypes] = useState([]);
    const [printingTypes, setPrintingTypes] = useState([]);
    const [serviceRates, setServiceRates] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [nextJobNumber, setNextJobNumber] = useState('');

    const [formData, setFormData] = useState({
        customer_name: '',
        material_type_name: '',
        material_description: '',
        material_quantity: '',
        material_unit: 'MTR',
        design_name: '',
        design_notes: '',
        design_provided_by_customer: false,
        printing_type_name: '',
        num_colors: 1,
        color_details: '',
        num_screens: 0,
        screen_charges: 0,
        screen_details: '',
        expected_delivery: '',
        estimated_hours: 0,
        priority: 'normal',
        advance_received: 0,
        customer_notes: '',
        internal_notes: '',
        assigned_workers: [],
        worker_assignments: [],
    });

    const [services, setServices] = useState([]);
    const [designImage, setDesignImage] = useState(null);
    const [designImagePreview, setDesignImagePreview] = useState(null);

    useEffect(() => {
        fetchInitialData();
        if (id) {
            fetchJobOrder(id);
        }
        // Auto-fill customer name if coming from AddCustomer page
        if (fromQuickOrder && customerDataFromState.customerName) {
            setFormData(prev => ({
                ...prev,
                customer_name: customerDataFromState.customerName
            }));
        }
    }, [id, fromQuickOrder, customerDataFromState.customerName]);

    const fetchJobOrder = async (jobId) => {
        try {
            setLoadingJob(true);
            const response = await jobordersAPI.getById(jobId);
            const job = response.data;

            // Populate form data
            setFormData({
                customer_name: job.customer_name || (job.customer?.name || ''),
                material_type_name: job.material_type_name || (job.material_type?.name || ''),
                material_description: job.material_description || '',
                material_quantity: job.material_quantity || '',
                material_unit: job.material_unit || 'MTR',
                design_name: job.design_name || '',
                design_notes: job.design_notes || '',
                design_provided_by_customer: job.design_provided_by_customer || false,
                printing_type_name: job.printing_type_name || (job.printing_type?.name || ''),
                num_colors: job.num_colors || 1,
                color_details: job.color_details || '',
                num_screens: job.num_screens || 0,
                screen_charges: job.screen_charges || 0,
                screen_details: job.screen_details || '',
                expected_delivery: job.expected_delivery || '',
                estimated_hours: job.estimated_hours || 0,
                priority: job.priority || 'normal',
                advance_received: job.advance_received || 0,
                customer_notes: job.customer_notes || '',
                internal_notes: job.internal_notes || '',
                assigned_workers: job.assigned_workers || [],
            });

            // Populate services
            if (job.services && job.services.length > 0) {
                setServices(job.services.map(s => ({
                    service_rate: s.service_rate,
                    service_name: s.service_name,
                    description: s.description || '',
                    quantity: s.quantity,
                    unit: s.unit || 'unit',
                    rate: s.rate,
                    gst_rate: s.gst_rate || 5,
                })));
            }

            setNextJobNumber(job.job_number);

            if (job.design_image) {
                setDesignImagePreview(job.design_image);
            }
        } catch (error) {
            console.error('Error fetching job order:', error);
            toast.error('Failed to load order');
            navigate('/joborders');
        } finally {
            setLoadingJob(false);
        }
    };

    const fetchInitialData = async () => {
        try {
            const [customersRes, materialsRes, printingRes, ratesRes, numberRes, staffRes] = await Promise.all([
                customersAPI.getDropdown(),
                jobordersAPI.getMaterialTypes(),
                jobordersAPI.getPrintingTypes(),
                jobordersAPI.getServiceRates(),
                jobordersAPI.getNextNumber(),
                staffAPI.getAll({ active: true }).catch(() => ({ data: [] }))
            ]);

            setCustomers(customersRes.data || []);
            setMaterialTypes(materialsRes.data?.results || materialsRes.data || []);
            setPrintingTypes(printingRes.data?.results || printingRes.data || []);
            setServiceRates(ratesRes.data?.results || ratesRes.data || []);
            setNextJobNumber(numberRes.data.job_number);
            setStaffList(staffRes.data?.results || staffRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load form data');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setDesignImage(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setDesignImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        setDesignImage(null);
        setDesignImagePreview(null);
    };

    const addService = () => {
        setServices(prev => [...prev, {
            service_rate: '',
            service_name: '',
            description: '',
            quantity: 1,
            unit: 'unit',
            rate: 0,
            gst_rate: 5
        }]);
    };

    const updateService = (index, field, value) => {
        setServices(prev => {
            const updated = [...prev];
            updated[index][field] = value;

            // If selecting from service rates, auto-fill details
            if (field === 'service_rate' && value) {
                const selectedRate = serviceRates.find(r => r.id === parseInt(value));
                if (selectedRate) {
                    updated[index].service_name = selectedRate.name;
                    updated[index].rate = parseFloat(selectedRate.rate);
                    updated[index].gst_rate = parseFloat(selectedRate.gst_rate);
                    updated[index].unit = selectedRate.rate_type === 'per_meter' ? 'MTR' :
                        selectedRate.rate_type === 'per_color' ? 'colors' :
                            selectedRate.rate_type === 'per_piece' ? 'PCS' : 'unit';
                }
            }

            return updated;
        });
    };

    const removeService = (index) => {
        setServices(prev => prev.filter((_, i) => i !== index));
    };

    const calculateServiceAmount = (service) => {
        return service.quantity * service.rate;
    };

    const calculateTotals = () => {
        const subtotal = services.reduce((sum, s) => sum + calculateServiceAmount(s), 0);
        const tax = services.reduce((sum, s) => sum + (calculateServiceAmount(s) * s.gst_rate / 100), 0);
        const total = subtotal + tax;
        return { subtotal, tax, total };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.customer_name.trim()) {
            toast.error('Please enter customer name');
            return;
        }
        if (!formData.design_name) {
            toast.error('Please enter a design name');
            return;
        }

        try {
            setLoading(true);

            // Create FormData for multipart upload
            const formDataToSend = new FormData();

            // Add all text fields (except assigned_workers, handle separately)
            Object.keys(formData).forEach(key => {
                if (key !== 'assigned_workers') {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Add numeric fields
            formDataToSend.set('material_quantity', parseFloat(formData.material_quantity) || 0);
            formDataToSend.set('num_colors', parseInt(formData.num_colors) || 1);
            formDataToSend.set('num_screens', parseInt(formData.num_screens) || 0);
            formDataToSend.set('screen_charges', parseFloat(formData.screen_charges) || 0);
            formDataToSend.set('advance_received', parseFloat(formData.advance_received) || 0);

            // Add assigned workers as JSON array (for legacy M2M field)
            formDataToSend.append('assigned_workers', JSON.stringify(formData.assigned_workers));

            // Add worker assignments with task details as separate data
            formDataToSend.append('worker_assignments', JSON.stringify(formData.worker_assignments));

            // Add design image if selected
            if (designImage) {
                formDataToSend.append('design_image', designImage);
            }

            // Add services as JSON string (DRF expects nested JSON)
            const servicesData = services.map(s => ({
                service_rate: s.service_rate ? parseInt(s.service_rate) : null,
                service_name: s.service_name,
                description: s.description,
                quantity: parseFloat(s.quantity),
                unit: s.unit,
                rate: parseFloat(s.rate),
                gst_rate: parseFloat(s.gst_rate)
            }));
            formDataToSend.append('services', JSON.stringify(servicesData));

            // Debug: Log FormData contents
            console.log('=== FormData being sent ===');
            for (let [key, value] of formDataToSend.entries()) {
                console.log(key, ':', value);
            }
            console.log('===========================');

            let createdOrder = null;
            if (isEditMode) {
                await jobordersAPI.update(id, formDataToSend);
                toast.success('Order updated successfully');
                navigate('/joborders');
            } else {
                const response = await jobordersAPI.create(formDataToSend);
                createdOrder = response.data;

                // Save worker assignments with task details
                if (formData.worker_assignments.length > 0 && createdOrder?.id) {
                    try {
                        await staffAPI.bulkAssign({
                            job_order: createdOrder.id,
                            assignments: formData.worker_assignments.map(wa => ({
                                staff: wa.staff,
                                task_description: wa.task_description || '',
                                estimated_hours: wa.estimated_hours || 0,
                            }))
                        });
                    } catch (err) {
                        console.warn('Worker assignment failed:', err);
                    }
                }

                toast.success('Order created successfully');

                // If from Quick Order flow, navigate to Create Invoice
                if (fromQuickOrder) {
                    navigate('/invoices/create', {
                        state: {
                            fromQuickOrder: true,
                            customerName: formData.customer_name,
                            orderId: createdOrder.id,
                            orderNumber: createdOrder.job_number,
                            services: servicesData,
                            total: total,
                            advanceReceived: parseFloat(formData.advance_received) || 0
                        }
                    });
                } else {
                    navigate('/joborders');
                }
            }
        } catch (error) {
            console.error('Error saving job order:', error);
            console.error('Response data:', error.response?.data);
            const errorMsg = error.response?.data?.detail ||
                JSON.stringify(error.response?.data) ||
                `Failed to ${isEditMode ? 'update' : 'create'} order`;
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const { subtotal, tax, total } = calculateTotals();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); }
                .input-pro { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .input-pro:focus { box-shadow: 0 4px 20px rgba(236, 72, 153, 0.15); }
            `}</style>

            {/* Progress Indicator - Only show in Quick Order flow */}
            {fromQuickOrder && (
                <div className="glass-card rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">✓</div>
                            <div className="w-8 h-1 bg-green-500 rounded-full"></div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center font-bold shadow-lg">2</div>
                            <div>
                                <p className="text-xs text-gray-500">Step 2 of 3</p>
                                <p className="font-semibold text-gray-900">Order Details</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <div className="w-8 h-1 bg-gray-200 rounded-full"></div>
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">3</div>
                        </div>
                    </div>
                    {customerDataFromState.customerName && (
                        <div className="mt-3 p-2 bg-cyan-50 border border-cyan-200 rounded-lg text-sm text-cyan-700">
                            <FiUser className="inline w-4 h-4 mr-1" />
                            Customer: <strong>{customerDataFromState.customerName}</strong>
                        </div>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 via-pink-600 to-rose-600 p-6 shadow-xl">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/joborders')} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                            <FiArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div className="text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                    <FiClipboard className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">{isViewMode ? 'View Order' : isEditMode ? 'Edit Order' : 'New Order'}</h1>
                                    <p className="text-white/70 text-sm">{isViewMode ? 'Order details' : isEditMode ? 'Update order details' : 'Create a new printing order'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-right">
                        <p className="text-white/70 text-sm">Order Number</p>
                        <p className="text-xl font-bold text-white font-mono">{nextJobNumber || id}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer & Priority */}
                <div className="glass-card rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiUser className="w-5 h-5 text-[#A500FF]" />
                        Customer Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Customer Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="customer_name"
                                value={formData.customer_name}
                                onChange={handleChange}
                                placeholder="Enter customer name"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#A500FF] focus:ring-2 focus:ring-[#A500FF]/20 outline-none"
                                required
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
                                value={formData.priority}
                                onChange={(val) => setFormData(prev => ({ ...prev, priority: val }))}
                            />
                        </div>
                    </div>
                </div>

                {/* Material Details */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiPackage className="w-5 h-5 text-[#A500FF]" />
                        Material Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
                            <input
                                type="text"
                                name="material_type_name"
                                value={formData.material_type_name || ''}
                                onChange={handleChange}
                                placeholder="e.g., Cotton, Silk, Polyester"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#A500FF] focus:ring-2 focus:ring-[#A500FF]/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                                type="number"
                                name="material_quantity"
                                value={formData.material_quantity}
                                onChange={handleChange}
                                placeholder="0"
                                step="0.01"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#A500FF] focus:ring-2 focus:ring-[#A500FF]/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <Dropdown
                                options={[
                                    { value: 'MTR', label: 'Meters' },
                                    { value: 'PCS', label: 'Pieces' },
                                    { value: 'ROLL', label: 'Rolls' },
                                    { value: 'KG', label: 'Kilograms' },
                                    { value: 'SQM', label: 'Sq. Meters' },
                                ]}
                                value={formData.material_unit}
                                onChange={(val) => setFormData(prev => ({ ...prev, material_unit: val }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                type="text"
                                name="material_description"
                                value={formData.material_description}
                                onChange={handleChange}
                                placeholder="e.g., White Cotton"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#A500FF] focus:ring-2 focus:ring-[#A500FF]/20 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Design Details */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiImage className="w-5 h-5 text-[#A500FF]" />
                        Design Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Design Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="design_name"
                                value={formData.design_name}
                                onChange={handleChange}
                                placeholder="e.g., Floral Pattern A"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#A500FF] focus:ring-2 focus:ring-[#A500FF]/20 outline-none"
                                required
                            />
                        </div>
                        <div className="flex items-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="design_provided_by_customer"
                                    checked={formData.design_provided_by_customer}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-[#A500FF] rounded focus:ring-[#A500FF]"
                                />
                                <span className="text-sm text-gray-700">Design provided by customer</span>
                            </label>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Design Notes</label>
                            <textarea
                                name="design_notes"
                                value={formData.design_notes}
                                onChange={handleChange}
                                placeholder="Any special instructions for the design..."
                                rows={2}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#A500FF] focus:ring-2 focus:ring-[#A500FF]/20 outline-none resize-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Design Image</label>
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={handleImageChange}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#A500FF] focus:ring-2 focus:ring-[#A500FF]/20 outline-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Upload customer's design file (JPG, PNG, PDF)</p>
                                </div>
                                {designImagePreview && (
                                    <div className="relative">
                                        <img src={designImagePreview} alt="Design preview" className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Printing Details */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiPrinter className="w-5 h-5 text-[#A500FF]" />
                        Printing Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Printing Type</label>
                            <input
                                type="text"
                                name="printing_type_name"
                                value={formData.printing_type_name || ''}
                                onChange={handleChange}
                                placeholder="e.g., Screen Print, Digital, Rotary"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#A500FF] focus:ring-2 focus:ring-[#A500FF]/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Colors</label>
                            <input
                                type="number"
                                name="num_colors"
                                value={formData.num_colors}
                                onChange={handleChange}
                                min="1"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#A500FF] focus:ring-2 focus:ring-[#A500FF]/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <FiCalendar className="w-4 h-4" />
                                Expected Delivery
                            </label>
                            <DatePicker
                                value={formData.expected_delivery}
                                onChange={(val) => setFormData(prev => ({ ...prev, expected_delivery: val }))}
                                placeholder="Select delivery date"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <FiClock className="w-4 h-4" />
                                Est. Work Hours
                            </label>
                            <input
                                type="number"
                                name="estimated_hours"
                                value={formData.estimated_hours}
                                onChange={handleChange}
                                min="0"
                                step="0.5"
                                placeholder="e.g., 8"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#A500FF] focus:ring-2 focus:ring-[#A500FF]/20 outline-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">Used for progress tracking</p>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Color Details</label>
                            <input
                                type="text"
                                name="color_details"
                                value={formData.color_details}
                                onChange={handleChange}
                                placeholder="e.g., Red, Blue, Yellow"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#A500FF] focus:ring-2 focus:ring-[#A500FF]/20 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Screen Details */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiGrid className="w-5 h-5 text-[#A500FF]" />
                        Screen / Stencil Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Screens</label>
                            <input
                                type="number"
                                name="num_screens"
                                value={formData.num_screens}
                                onChange={handleChange}
                                min="0"
                                placeholder="Usually 1 per color"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#A500FF] focus:ring-2 focus:ring-[#A500FF]/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Screen Charges (₹)</label>
                            <input
                                type="number"
                                name="screen_charges"
                                value={formData.screen_charges}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                placeholder="One-time setup cost"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#A500FF] focus:ring-2 focus:ring-[#A500FF]/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Screen Notes</label>
                            <input
                                type="text"
                                name="screen_details"
                                value={formData.screen_details}
                                onChange={handleChange}
                                placeholder="Screen specifications..."
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#A500FF] focus:ring-2 focus:ring-[#A500FF]/20 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Worker Assignment */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiUsers className="w-5 h-5 text-[#A500FF]" />
                        Assign Workers
                    </h2>
                    {staffList.length === 0 ? (
                        <p className="text-sm text-gray-500 py-2">No staff members available. <a href="/staff" className="text-[#A500FF] underline">Add staff first</a></p>
                    ) : (
                        <div className="space-y-4">
                            {/* Staff selection chips */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Staff Members</label>
                                <div className="flex flex-wrap gap-2">
                                    {staffList.map(staff => {
                                        const isSelected = formData.worker_assignments.some(wa => wa.staff === staff.id);
                                        return (
                                            <button
                                                type="button"
                                                key={staff.id}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            assigned_workers: prev.assigned_workers.filter(id => id !== staff.id),
                                                            worker_assignments: prev.worker_assignments.filter(wa => wa.staff !== staff.id)
                                                        }));
                                                    } else {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            assigned_workers: [...prev.assigned_workers, staff.id],
                                                            worker_assignments: [...prev.worker_assignments, {
                                                                staff: staff.id,
                                                                staff_name: staff.name,
                                                                role: staff.role_display || staff.role,
                                                                task_description: '',
                                                                estimated_hours: 0,
                                                            }]
                                                        }));
                                                    }
                                                }}
                                                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${isSelected
                                                    ? 'border-[#A500FF] bg-[#A500FF]/10 text-[#A500FF] shadow-sm'
                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${isSelected ? 'bg-[#A500FF]' : 'bg-gray-400'
                                                    }`}>{staff.name?.charAt(0)?.toUpperCase()}</span>
                                                {staff.name}
                                                <span className="text-xs opacity-60">({staff.role_display || staff.role})</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Task details for each assigned worker */}
                            {formData.worker_assignments.length > 0 && (
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700">Task Details</label>
                                    {formData.worker_assignments.map((wa, idx) => (
                                        <div key={wa.staff} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="w-8 h-8 rounded-full bg-[#A500FF] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                {wa.staff_name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div className="flex-shrink-0 min-w-[100px]">
                                                <p className="text-sm font-semibold text-gray-800">{wa.staff_name}</p>
                                                <p className="text-xs text-gray-400">{wa.role}</p>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Task description (e.g. Handle printing)"
                                                value={wa.task_description}
                                                onChange={(e) => {
                                                    const updated = [...formData.worker_assignments];
                                                    updated[idx] = { ...updated[idx], task_description: e.target.value };
                                                    setFormData(prev => ({ ...prev, worker_assignments: updated }));
                                                }}
                                                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#A500FF] focus:ring-2 focus:ring-[#A500FF]/20 outline-none"
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                placeholder="Hrs"
                                                value={wa.estimated_hours || ''}
                                                onChange={(e) => {
                                                    const updated = [...formData.worker_assignments];
                                                    updated[idx] = { ...updated[idx], estimated_hours: parseFloat(e.target.value) || 0 };
                                                    setFormData(prev => ({ ...prev, worker_assignments: updated }));
                                                }}
                                                className="w-20 px-3 py-2 rounded-lg border border-gray-200 text-sm text-center focus:border-[#A500FF] focus:ring-2 focus:ring-[#A500FF]/20 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        assigned_workers: prev.assigned_workers.filter(id => id !== wa.staff),
                                                        worker_assignments: prev.worker_assignments.filter(w => w.staff !== wa.staff)
                                                    }));
                                                }}
                                                className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <p className="text-xs text-gray-400 mt-1">{formData.worker_assignments.length} worker(s) assigned • Tasks will be tracked in the job order</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Services */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FiDollarSign className="w-5 h-5 text-[#A500FF]" />
                            Services & Charges
                        </h2>
                        <button
                            type="button"
                            onClick={addService}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#A500FF] hover:bg-[#A500FF]/10 rounded-lg transition-colors"
                        >
                            <FiPlus className="w-4 h-4" />
                            Add Service
                        </button>
                    </div>

                    {services.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No services added yet</p>
                            <button
                                type="button"
                                onClick={addService}
                                className="mt-2 text-[#A500FF] hover:underline"
                            >
                                Add your first service
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {services.map((service, index) => (
                                <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-lg">
                                    <div className="col-span-4">
                                        <label className="block text-xs text-gray-500 mb-1">Service Name</label>
                                        <input
                                            type="text"
                                            value={service.service_name}
                                            onChange={(e) => updateService(index, 'service_name', e.target.value)}
                                            placeholder="Service name"
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-[#A500FF] outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs text-gray-500 mb-1">Qty</label>
                                        <input
                                            type="number"
                                            value={service.quantity}
                                            onChange={(e) => updateService(index, 'quantity', parseFloat(e.target.value) || 0)}
                                            step="0.01"
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-[#A500FF] outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs text-gray-500 mb-1">Rate (₹)</label>
                                        <input
                                            type="number"
                                            value={service.rate}
                                            onChange={(e) => updateService(index, 'rate', parseFloat(e.target.value) || 0)}
                                            step="0.01"
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-[#A500FF] outline-none"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs text-gray-500 mb-1">Amount</label>
                                        <p className="px-3 py-2 text-sm font-medium text-gray-900">
                                            {formatCurrency(calculateServiceAmount(service))}
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
                        </div>
                    )}

                    {/* Totals */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-end">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">GST</span>
                                    <span className="text-gray-900">{formatCurrency(tax)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span className="text-gray-900">Total</span>
                                    <span className="text-[#A500FF]">{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advance Payment */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Advance Received</label>
                            <input
                                type="number"
                                name="advance_received"
                                value={formData.advance_received}
                                onChange={handleChange}
                                placeholder="0"
                                step="0.01"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#A500FF] focus:ring-2 focus:ring-[#A500FF]/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Balance Due</label>
                            <p className="px-4 py-2.5 text-lg font-bold text-red-600 bg-red-50 rounded-lg">
                                {formatCurrency(total - (parseFloat(formData.advance_received) || 0))}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Notes</label>
                            <textarea
                                name="customer_notes"
                                value={formData.customer_notes}
                                onChange={handleChange}
                                placeholder="Notes visible to customer..."
                                rows={3}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#A500FF] focus:ring-2 focus:ring-[#A500FF]/20 outline-none resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
                            <textarea
                                name="internal_notes"
                                value={formData.internal_notes}
                                onChange={handleChange}
                                placeholder="Internal notes (not visible to customer)..."
                                rows={3}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#A500FF] focus:ring-2 focus:ring-[#A500FF]/20 outline-none resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => fromQuickOrder ? navigate('/customers/add') : navigate('/joborders')}
                        className="flex items-center gap-2 px-6 py-2.5 text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                        {fromQuickOrder ? 'Back' : 'Cancel'}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : fromQuickOrder ? (
                            <>
                                Next: Create Invoice
                                <FiArrowRight className="w-5 h-5" />
                            </>
                        ) : (
                            <>
                                <FiSave className="w-5 h-5" />
                                {isEditMode ? 'Update Order' : 'Create Order'}
                            </>
                        )}
                    </button>
                </div>
            </form >
        </div >
    );
}
