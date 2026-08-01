/**
 * Formats a number into a currency string.
 * Example: 1500.5 -> $1,500.50
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
    if (amount === null || amount === undefined || isNaN(amount)) return '';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

/**
 * Formats a number with thousands separators but no currency symbol.
 * Example: 1500.5 -> 1,500.50
 */
export const formatNumber = (amount, decimals = 2) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(amount);
};

/**
 * Parses a currency string back to a float.
 * Example: '$1,500.50' -> 1500.5
 */
export const parseCurrency = (value) => {
    if (!value) return 0;
    return parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
};
