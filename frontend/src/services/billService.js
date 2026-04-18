import api from '../api/axios';

/**
 * Save a finalized bill to the backend.
 * @param {Object} data - { title, total_amount, payment_mode, cafe_id, participants }
 */
export const saveBill = (data) => api.post('/bills/', data);

/**
 * Fetch all bills created by the current user.
 */
export const getMyBills = () => api.get('/bills/me');

/**
 * Fetch a single bill by ID.
 */
export const getBill = (id) => api.get(`/bills/${id}`);

/**
 * Delete a bill by ID (only creator can delete).
 */
export const deleteBill = (id) => api.delete(`/bills/${id}`);
