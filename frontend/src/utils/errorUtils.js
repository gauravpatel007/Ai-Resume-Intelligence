export const formatApiError = (err, fallback = 'An error occurred. Please try again.') => {
  const detail = err.response?.data?.detail;
  
  if (Array.isArray(detail)) {
    return detail.map(d => `${d.loc?.slice(-1)[0] || 'Field'}: ${d.msg}`).join(' | ');
  }
  
  if (typeof detail === 'string') {
    return detail;
  }
  
  return err.message || fallback;
};
