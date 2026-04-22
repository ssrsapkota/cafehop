/**
 * Currency and Date Formatters
 */

export const formatCurrency = (amount) => {
    return `Rs. ${Number(amount).toFixed(2)}`;
};

export const formatDate = (dateString, options = {}) => {
    const defaultOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
        ...options
    };
    return new Date(dateString).toLocaleDateString("en-US", defaultOptions);
};

export const formatShortDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
};
