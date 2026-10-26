const authService = require('./auth.service');
const { validateLoginInput, isValidEmail } = require('../../shared/validation/validators');
const { sendSuccess, sendError } = require('../../shared/utils/response');

class AuthController {
  login(req, res, next) {
    try {
      const { isValid, errors } = validateLoginInput(req.body);
      if (!isValid) {
        return sendError(res, errors[0], 400, errors);
      }

      const { email, password } = req.body;
      const result = authService.login(email, password);

      return sendSuccess(res, result, 'Login successful.');
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  register(req, res, next) {
    try {
      const { name, email, password, role } = req.body;
      const errors = [];

      if (!name || !name.trim()) errors.push('Name is required.');
      if (!email || !isValidEmail(email)) errors.push('A valid email is required.');
      if (!password || password.length < 6) errors.push('Password must be at least 6 characters long.');
      if (!role || !['student', 'recruiter'].includes(role)) errors.push('Role must be student or recruiter.');

      if (errors.length > 0) {
        return sendError(res, errors[0], 400, errors);
      }

      const result = authService.register({ name, email, password, role });
      return sendSuccess(res, result, 'Registration successful.', 201);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  getCurrentUser(req, res, next) {
    try {
      const user = authService.getCurrentUser(req.user.id);
      return sendSuccess(res, user, 'Current user retrieved.');
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  logout(req, res) {
    return sendSuccess(res, null, 'Logged out successfully.');
  }
}

module.exports = new AuthController();
