import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
    FiFileText, FiUser, FiArrowLeft, FiArrowRight, FiPlus, FiTrash2, FiSave, FiCalendar, FiCheck, FiClipboard
} from 'react-icons/fi';
import DatePicker from '../components/DatePicker';
import toast from 'react-hot-toast';
import { invoicesAPI, customersAPI } from '../services/api';

export default function CreateInvoice() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [nextInvoiceNumber, setNextInvoiceNumber] = useState('');
    const [advanceAmount, setAdvanceAmount] = useState(0);

    // Check if coming from Quick Order flow
    const fromQuickOrder = location.state?.fromQuickOrder || false;
    const orderData = location.state || {};

    const [formData, setFormData] = useState({
        customer_name: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        notes: '',
    });

    const [items, setItems] = useState([
        { item_name: '', description: '', quantity: 1, rate: 0, gst_rate: 5 }
    ]);

    useEffect(() => {
        fetchInitialData();

        if (isEditMode) {
            loadInvoice();
        } else if (fromQuickOrder) {
            if (orderData.customerName) {
                setFormData(prev => ({ ...prev, customer_name: orderData.customerName }));
            }
            if (orderData.advanceReceived) {
                setAdvanceAmount(parseFloat(orderData.advanceReceived) || 0);
            }
            if (orderData.services && orderData.services.length > 0) {
                setItems(orderData.services.map(service => ({
                    item_name: service.service_name || '',
                    description: service.description || '',
                    quantity: service.quantity || 1,
                    rate: service.rate || 0,
                    gst_rate: service.gst_rate || 5
                })));
            }
        }
    }, [id]);

    const loadInvoice = async () => {
        try {
            const res = await invoicesAPI.getById(id);
            const inv = res.data;
            setFormData({
                customer_name: inv.customer_name || '',
                invoice_date: inv.invoice_date || '',
                due_date: inv.due_date || '',
                notes: inv.notes || '',
            });
            setNextInvoiceNumber(inv.invoice_number || '');
            setAdvanceAmount(parseFloat(inv.received) || 0);
            if (inv.items && inv.items.length > 0) {
                setItems(inv.items.map(item => ({
                    item_name: item.item_name || '',
                    description: item.description || '',
                    quantity: item.quantity || 1,
                    rate: item.price || item.rate || 0,
                    gst_rate: item.tax_rate || item.gst_rate || 5,
                })));
            }
        } catch (error) {
            console.error('Error loading invoice:', error);
            toast.error('Failed to load invoice');
            navigate('/invoices');
        }
    };

    const fetchInitialData = async () => {
        try {
            const [customersRes, numberRes] = await Promise.all([
                customersAPI.getDropdown(),
                invoicesAPI.getNextNumber()
            ]);
            setCustomers(customersRes.data || []);
            if (!isEditMode) {
                setNextInvoiceNumber(numberRes.data.invoice_number || 'INV-0001');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load form data');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const addItem = () => {
        setItems(prev => [...prev, { item_name: '', description: '', quantity: 1, rate: 0, gst_rate: 5 }]);
    };

    const updateItem = (index, field, value) => {
        setItems(prev => {
            const updated = [...prev];
            updated[index][field] = value;
            return updated;
        });
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(prev => prev.filter((_, i) => i !== index));
        }
    };

    const calculateItemAmount = (item) => {
        return item.quantity * item.rate;
    };

    const calculateTotals = () => {
        const subtotal = items.reduce((sum, item) => sum + calculateItemAmount(item), 0);
        const tax = items.reduce((sum, item) => sum + (calculateItemAmount(item) * item.gst_rate / 100), 0);
        const total = subtotal + tax;
        return { subtotal, tax, total };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.customer_name.trim()) {
            toast.error('Please enter customer name');
            return;
        }

        if (items.every(item => !item.item_name.trim())) {
            toast.error('Please add at least one item');
            return;
        }

        try {
            setLoading(true);

            // Find customer by name or create a new one
            let customerId = null;
            const customerName = formData.customer_name.trim();

            // Try to find existing customer
            const existingCustomer = customers.find(
                c => c.name.toLowerCase() === customerName.toLowerCase()
            );

            if (existingCustomer) {
                customerId = existingCustomer.id;
            } else {
                // Create a new customer with just the name
                try {
                    const newCustomerRes = await customersAPI.create({ name: customerName });
                    customerId = newCustomerRes.data.id;
                } catch (customerError) {
                    console.error('Error creating customer:', customerError);
                    toast.error('Failed to create customer');
                    setLoading(false);
                    return;
                }
            }

            // Build invoice data matching backend schema
            const invoiceData = {
                customer_id: customerId,
                invoice_type: 'invoice',
                invoice_date: formData.invoice_date,
                due_date: formData.due_date || null,
                discount_type: 'amount',
                discount_value: 0,
                is_igst: false,
                notes: formData.notes || '',
                received: parseFloat(advanceAmount) || 0,
                items: items
                    .filter(item => item.item_name.trim())
                    .map(item => ({
                        item_name: item.item_name,
                        description: item.description || '',
                        quantity: parseFloat(item.quantity) || 1,
                        price: parseFloat(item.rate) || 0,  // Backend expects 'price', not 'rate'
                        tax_rate: parseFloat(item.gst_rate) || 0
                    }))
            };

            if (isEditMode) {
                await invoicesAPI.update(id, invoiceData);
                toast.success('Invoice updated successfully');
            } else {
                await invoicesAPI.create(invoiceData);
                toast.success('Invoice created successfully');
            }

            // If from Quick Order flow, navigate to Job Orders
            if (fromQuickOrder) {
                navigate('/joborders');
            } else {
                navigate('/invoices');
            }
        } catch (error) {
            console.error('Error saving invoice:', error);
            const errorMsg = error.response?.data?.detail ||
                JSON.stringify(error.response?.data) ||
                `Failed to ${isEditMode ? 'update' : 'create'} invoice`;
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
                .input-pro:focus { box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15); }
            `}</style>

            {/* Progress Indicator - Only show in Quick Order flow */}
            {fromQuickOrder && (
                <div className="glass-card rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">✓</div>
                            <div className="w-8 h-1 bg-green-500 rounded-full"></div>
                            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">✓</div>
                            <div className="w-8 h-1 bg-green-500 rounded-full"></div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold shadow-lg">3</div>
                            <div>
                                <p className="text-xs text-gray-500">Step 3 of 3</p>
                                <p className="font-semibold text-gray-900">{isEditMode ? 'Edit Invoice' : 'Create Invoice'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-green-500 font-medium">
                            <FiCheck className="w-5 h-5" />
                            Final Step
                        </div>
                    </div>
                    {orderData.orderNumber && (
                        <div className="mt-3 p-2 bg-pink-50 border border-pink-200 rounded-lg text-sm text-pink-700 flex items-center gap-2">
                            <FiClipboard className="w-4 h-4" />
                            Order: <strong>{orderData.orderNumber}</strong>
                            {orderData.customerName && <span>• Customer: <strong>{orderData.customerName}</strong></span>}
                        </div>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 p-6 shadow-xl">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/invoices')} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                            <FiArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div className="text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                    <FiFileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Invoice' : 'Create Invoice'}</h1>
                                    <p className="text-white/70 text-sm">Create a new sales invoice</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-right">
                        <p className="text-white/70 text-sm">Invoice Number</p>
                        <p className="text-xl font-bold text-white font-mono">{nextInvoiceNumber}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer & Date Details */}
                <div className="glass-card rounded-2xl p-6 shadow-sm border border-gray-100" style={{ position: 'relative', zIndex: 30, overflow: 'visible' }}>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiUser className="w-5 h-5 text-blue-600" />
                        Invoice Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Customer Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="customer_name"
                                value={formData.customer_name}
                                onChange={handleChange}
                                placeholder="Enter customer name"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                required
                            />
                        </div>
                        <div style={{ position: 'relative', zIndex: 20 }}>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <FiCalendar className="w-4 h-4" />
                                Invoice Date
                            </label>
                            <DatePicker
                                value={formData.invoice_date}
                                onChange={(val) => setFormData(prev => ({ ...prev, invoice_date: val }))}
                                placeholder="Select invoice date"
                            />
                        </div>
                        <div style={{ position: 'relative', zIndex: 10 }}>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <FiCalendar className="w-4 h-4" />
                                Due Date
                            </label>
                            <DatePicker
                                value={formData.due_date}
                                onChange={(val) => setFormData(prev => ({ ...prev, due_date: val }))}
                                placeholder="Select due date"
                            />
                        </div>
                    </div>
                </div>

                {/* Invoice Items */}
                <div className="glass-card rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FiFileText className="w-5 h-5 text-blue-600" />
                            Invoice Items
                        </h2>
                        <button
                            type="button"
                            onClick={addItem}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <FiPlus className="w-4 h-4" />
                            Add Item
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase" style={{ width: '30%' }}>Item Name</th>
                                    <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase" style={{ width: '20%' }}>Description</th>
                                    <th className="text-center py-2 text-xs font-semibold text-gray-500 uppercase" style={{ width: '10%' }}>Qty</th>
                                    <th className="text-center py-2 text-xs font-semibold text-gray-500 uppercase" style={{ width: '12%' }}>Rate (₹)</th>
                                    <th className="text-center py-2 text-xs font-semibold text-gray-500 uppercase" style={{ width: '10%' }}>GST %</th>
                                    <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase" style={{ width: '13%' }}>Amount</th>
                                    <th className="text-center py-2" style={{ width: '5%' }}></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item, index) => (
                                    <tr key={index} className="group">
                                        <td className="py-2 pr-2">
                                            <input
                                                type="text"
                                                value={item.item_name}
                                                onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                                                placeholder="Item name"
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                            />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                placeholder="Description"
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                            />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                min="0"
                                                step="0.01"
                                                className="w-full px-3 py-2 text-sm text-center rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                            />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input
                                                type="number"
                                                value={item.rate}
                                                onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                                min="0"
                                                step="0.01"
                                                className="w-full px-3 py-2 text-sm text-center rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                            />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input
                                                type="number"
                                                value={item.gst_rate}
                                                onChange={(e) => updateItem(index, 'gst_rate', parseFloat(e.target.value) || 0)}
                                                min="0"
                                                max="100"
                                                className="w-full px-3 py-2 text-sm text-center rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                            />
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                            <span className="font-medium text-gray-900">{formatCurrency(calculateItemAmount(item))}</span>
                                        </td>
                                        <td className="py-2 pl-2 text-center">
                                            {items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex justify-end">
                            <div className="w-72 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">CGST (2.5%)</span>
                                    <span className="text-gray-900">{formatCurrency(tax / 2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">SGST (2.5%)</span>
                                    <span className="text-gray-900">{formatCurrency(tax / 2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span className="text-gray-900">Total</span>
                                    <span className="text-blue-600">{formatCurrency(total)}</span>
                                </div>
                                {/* Advance Payment */}
                                <div className="flex justify-between items-center text-sm pt-2">
                                    <span className="text-gray-500">Advance Paid</span>
                                    <input
                                        type="number"
                                        value={advanceAmount}
                                        onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                                        min="0"
                                        max={total}
                                        step="0.01"
                                        className="w-32 px-3 py-1.5 text-right text-sm rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none"
                                        placeholder="₹0"
                                    />
                                </div>
                                {advanceAmount > 0 && (
                                    <div className="flex justify-between text-base font-bold text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
                                        <span>Balance Due</span>
                                        <span>{formatCurrency(Math.max(0, total - advanceAmount))}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="glass-card rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Any additional notes for the invoice..."
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => fromQuickOrder ? navigate('/joborders/create', { state: { fromQuickOrder: true, customerName: orderData.customerName } }) : navigate('/invoices')}
                        className="flex items-center gap-2 px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        {fromQuickOrder ? 'Back' : 'Cancel'}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Creating...
                            </>
                        ) : (
                            <>
                                <FiCheck className="w-4 h-4" />
                                {fromQuickOrder ? 'Complete Order' : isEditMode ? 'Update Invoice' : 'Create Invoice'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
