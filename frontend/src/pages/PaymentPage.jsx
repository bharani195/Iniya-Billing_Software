import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiCreditCard, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import axios from 'axios';

export default function PaymentPage() {
    const { invoiceId, token } = useParams();
    const [invoiceData, setInvoiceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    useEffect(() => {
        fetchInvoiceData();

        // Check if this is a success callback
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        if (sessionId) {
            verifyPayment(sessionId);
        }
    }, [invoiceId, token]);

    const fetchInvoiceData = async () => {
        try {
            const response = await axios.get(`/api/invoices/pay/${invoiceId}/${token}/`);
            setInvoiceData(response.data);
            if (response.data.is_paid) {
                setPaymentSuccess(true);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid or expired payment link');
        } finally {
            setLoading(false);
        }
    };

    const verifyPayment = async (sessionId) => {
        console.log('[DEBUG] verifyPayment called with sessionId:', sessionId);
        console.log('[DEBUG] API URL:', `/api/invoices/pay/${invoiceId}/${token}/success/?session_id=${sessionId}`);
        try {
            const response = await axios.get(`/api/invoices/pay/${invoiceId}/${token}/success/?session_id=${sessionId}`);
            console.log('[DEBUG] verifyPayment response:', response.data);
            if (response.data.success) {
                setPaymentSuccess(true);
                setInvoiceData(prev => ({
                    ...prev,
                    invoice: response.data.invoice,
                    is_paid: true
                }));
            }
        } catch (err) {
            console.error('[DEBUG] Payment verification failed:', err);
            console.error('[DEBUG] Error response:', err.response?.data);
        }
    };

    const handlePayNow = async () => {
        setProcessing(true);
        try {
            const response = await axios.post(`/api/invoices/pay/${invoiceId}/${token}/`, {
                frontend_url: window.location.origin
            });

            if (response.data.checkout_url) {
                window.location.href = response.data.checkout_url;
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to initiate payment');
            setProcessing(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <FiLoader className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
                    <p className="text-slate-300">Loading payment details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                    <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Link Invalid</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (paymentSuccess || invoiceData?.is_paid) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FiCheckCircle className="w-12 h-12 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
                    <p className="text-gray-600 mb-6">Thank you for your payment.</p>

                    <div className="bg-emerald-50 rounded-xl p-4 mb-6">
                        <p className="text-sm text-emerald-700">Invoice #{invoiceData?.invoice?.invoice_number}</p>
                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(invoiceData?.invoice?.total)}</p>
                        <p className="text-sm text-emerald-600">Paid in full</p>
                    </div>

                    <p className="text-gray-500 text-sm">A confirmation email has been sent to your email address.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center">
                    <h1 className="text-xl font-bold mb-1">{invoiceData?.company?.name}</h1>
                    <p className="text-indigo-200 text-sm">Secure Payment</p>
                </div>

                {/* Invoice Details */}
                <div className="p-6">
                    <div className="text-center mb-6">
                        <p className="text-gray-500 text-sm">Invoice</p>
                        <p className="text-2xl font-bold text-gray-800">{invoiceData?.invoice?.invoice_number}</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Customer</span>
                            <span className="font-medium text-gray-800">{invoiceData?.customer?.name}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Invoice Date</span>
                            <span className="font-medium text-gray-800">
                                {invoiceData?.invoice?.invoice_date ? new Date(invoiceData.invoice.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Total Amount</span>
                            <span className="font-medium text-gray-800">{formatCurrency(invoiceData?.invoice?.total)}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Already Paid</span>
                            <span className="font-medium text-green-600">{formatCurrency(invoiceData?.invoice?.received)}</span>
                        </div>
                        <hr className="my-3" />
                        <div className="flex justify-between">
                            <span className="text-lg font-semibold text-gray-800">Amount Due</span>
                            <span className="text-2xl font-bold text-indigo-600">{formatCurrency(invoiceData?.invoice?.balance)}</span>
                        </div>
                    </div>

                    {/* Pay Button */}
                    <button
                        onClick={handlePayNow}
                        disabled={processing}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {processing ? (
                            <>
                                <FiLoader className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <FiCreditCard className="w-5 h-5" />
                                Pay {formatCurrency(invoiceData?.invoice?.balance)}
                            </>
                        )}
                    </button>

                    {/* Security Note */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Secured by Stripe
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4">
                    <p className="text-xs text-gray-500 text-center">
                        Questions? Contact {invoiceData?.company?.name} at {invoiceData?.company?.phone}
                    </p>
                </div>
            </div>
        </div>
    );
}
