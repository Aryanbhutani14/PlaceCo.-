const adminService = require('./admin.service');
const { sendSuccess, sendError } = require('../../shared/utils/response');

class AdminController {
  getDashboardStats(req, res, next) {
    try {
      const stats = adminService.getDashboardStats();
      return sendSuccess(res, stats, 'Admin dashboard statistics retrieved.');
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }
}

module.exports = new AdminController();
