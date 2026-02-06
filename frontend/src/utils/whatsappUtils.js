/**
 * WhatsApp Sharing Utilities
 * Provides helper functions for sharing invoices and job orders via WhatsApp
 */

/**
 * Format phone number for WhatsApp API (Indian numbers)
 * @param {string} phone - Phone number in any format
 * @returns {string} - Formatted phone number with country code
 */
export const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;

    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If number starts with 0, remove it
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }

    // If number is 10 digits (Indian mobile), add country code
    if (cleaned.length === 10) {
        cleaned = '91' + cleaned;
    }

    // If number doesn't have country code, add it
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
        cleaned = '91' + cleaned;
    }

    return cleaned;
};

/**
 * Generate invoice share message
 * @param {Object} invoice - Invoice object
 * @returns {string} - Formatted message for WhatsApp
 */
export const generateInvoiceMessage = (invoice) => {
    const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

    const statusEmoji = {
        paid: '✅',
        partial: '⏳',
        pending: '📋',
        cancelled: '❌'
    };

    const emoji = statusEmoji[invoice.status] || '📋';
    const status = invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1) || 'Pending';

    let message = `🧾 *Invoice from Sri Mahalakshmi Printing*\n\n`;
    message += `📄 Invoice #: *${invoice.invoice_number}*\n`;
    message += `📅 Date: ${invoice.invoice_date}\n`;
    message += `💰 Amount: *${formatCurrency(invoice.total)}*\n`;
    message += `${emoji} Status: ${status}\n`;

    if (invoice.balance > 0) {
        message += `⚠️ Balance Due: *${formatCurrency(invoice.balance)}*\n`;
    }

    message += `\n_Thank you for your business!_ 🙏`;

    return message;
};

/**
 * Generate job order share message
 * @param {Object} order - Job order object
 * @returns {string} - Formatted message for WhatsApp
 */
export const generateJobOrderMessage = (order) => {
    const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

    const statusEmoji = {
        received: '📥',
        designing: '🎨',
        color_separation: '🌈',
        printing: '🖨️',
        drying: '☀️',
        finishing: '✨',
        ready: '✅',
        delivered: '🚚',
        cancelled: '❌'
    };

    const statusLabels = {
        received: 'Received',
        designing: 'Designing',
        color_separation: 'Color Separation',
        printing: 'Printing',
        drying: 'Drying',
        finishing: 'Finishing',
        ready: 'Ready for Pickup',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
    };

    const emoji = statusEmoji[order.status] || '📋';
    const statusLabel = statusLabels[order.status] || order.status;

    let message = `📋 *Order Update - Sri Mahalakshmi Printing*\n\n`;
    message += `🔢 Order #: *${order.job_number}*\n`;
    message += `🎨 Design: ${order.design_name || 'N/A'}\n`;
    message += `${emoji} Status: *${statusLabel}*\n`;

    if (order.expected_delivery) {
        const deliveryDate = new Date(order.expected_delivery).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        message += `📅 Expected Delivery: ${deliveryDate}\n`;
    }

    if (order.total) {
        message += `💰 Total: *${formatCurrency(order.total)}*\n`;
    }

    if (order.balance > 0) {
        message += `⚠️ Balance Due: *${formatCurrency(order.balance)}*\n`;
    }

    // Status-specific messages
    const statusMessages = {
        received: '\n_Your order has been received. We will start working on it soon!_',
        designing: '\n_Your design is being prepared._',
        printing: '\n_Your order is now in printing!_',
        ready: '\n_🎉 Your order is ready for pickup!_',
        delivered: '\n_Thank you for your business! We hope to serve you again._'
    };

    if (statusMessages[order.status]) {
        message += statusMessages[order.status];
    }

    message += `\n\n_Sri Mahalakshmi Printing_ 🙏`;

    return message;
};

/**
 * Open WhatsApp with pre-filled message
 * @param {string} phone - Customer phone number
 * @param {string} message - Message to send
 * @returns {boolean} - True if successful, false if phone is missing
 */
export const openWhatsApp = (phone, message) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);

    if (!formattedPhone) {
        return false;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    return true;
};

/**
 * Share invoice via WhatsApp
 * @param {Object} invoice - Invoice object with customer_phone
 * @param {Function} onError - Error callback
 */
export const shareInvoiceViaWhatsApp = (invoice, onError) => {
    const phone = invoice.customer_phone;

    if (!phone) {
        if (onError) onError('Customer phone number not available');
        return false;
    }

    const message = generateInvoiceMessage(invoice);
    return openWhatsApp(phone, message);
};

/**
 * Share job order via WhatsApp
 * @param {Object} order - Job order object with customer_phone
 * @param {Function} onError - Error callback
 */
export const shareJobOrderViaWhatsApp = (order, onError) => {
    const phone = order.customer_phone;

    if (!phone) {
        if (onError) onError('Customer phone number not available');
        return false;
    }

    const message = generateJobOrderMessage(order);
    return openWhatsApp(phone, message);
};
