function errorHandler(err, req, res, next) {
  console.error('Unhandled Application Error:', err);

  // Return clean JSON instead of crashing
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
    errors: process.env.NODE_ENV === 'development' ? [err.stack] : undefined
  });
}

function notFoundHandler(req, res) {
  // If API route
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint '${req.originalUrl}' not found.`
    });
  }
  // Otherwise redirect to root/login
  return res.status(404).redirect('/login.html');
}

module.exports = {
  errorHandler,
  notFoundHandler
};
