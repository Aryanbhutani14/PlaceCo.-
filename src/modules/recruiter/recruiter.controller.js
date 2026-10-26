const recruiterService = require('./recruiter.service');
const { validateOpportunity } = require('../../shared/validation/validators');
const { sendSuccess, sendError } = require('../../shared/utils/response');

class RecruiterController {
  getProfile(req, res, next) {
    try {
      const profile = recruiterService.getProfile(req.user.id);
      return sendSuccess(res, profile, 'Recruiter profile fetched successfully.');
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  updateProfile(req, res, next) {
    try {
      const { companyName } = req.body;
      if (!companyName || !companyName.trim()) {
        return sendError(res, 'Company name is required.', 400);
      }

      const updated = recruiterService.updateProfile(req.user.id, req.body);
      return sendSuccess(res, updated, 'Company profile updated successfully.');
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  createOpportunity(req, res, next) {
    try {
      const { isValid, errors } = validateOpportunity(req.body);
      if (!isValid) {
        return sendError(res, errors[0], 400, errors);
      }

      const opportunity = recruiterService.createOpportunity(req.user.id, req.body);
      return sendSuccess(res, opportunity, 'Placement opportunity created successfully.', 201);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  getOpportunities(req, res, next) {
    try {
      const list = recruiterService.getOpportunities(req.user.id);
      return sendSuccess(res, list, 'Opportunities fetched successfully.');
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  getOpportunityById(req, res, next) {
    try {
      const oppId = parseInt(req.params.id, 10);
      if (isNaN(oppId)) {
        return sendError(res, 'Invalid opportunity ID.', 400);
      }

      const opp = recruiterService.getOpportunityById(oppId, req.user.id);
      return sendSuccess(res, opp, 'Opportunity details fetched successfully.');
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  updateOpportunity(req, res, next) {
    try {
      const oppId = parseInt(req.params.id, 10);
      if (isNaN(oppId)) {
        return sendError(res, 'Invalid opportunity ID.', 400);
      }

      const { isValid, errors } = validateOpportunity(req.body);
      if (!isValid) {
        return sendError(res, errors[0], 400, errors);
      }

      const updated = recruiterService.updateOpportunity(req.user.id, oppId, req.body);
      return sendSuccess(res, updated, 'Opportunity updated successfully.');
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  deleteOpportunity(req, res, next) {
    try {
      const oppId = parseInt(req.params.id, 10);
      if (isNaN(oppId)) {
        return sendError(res, 'Invalid opportunity ID.', 400);
      }

      recruiterService.deleteOpportunity(req.user.id, oppId);
      return sendSuccess(res, null, 'Opportunity deleted/closed successfully.');
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  getApplicants(req, res, next) {
    try {
      const oppId = req.params.id ? parseInt(req.params.id, 10) : null;
      let applicants;

      if (oppId) {
        if (isNaN(oppId)) {
          return sendError(res, 'Invalid opportunity ID.', 400);
        }
        applicants = recruiterService.getApplicantsForOpportunity(req.user.id, oppId);
      } else {
        applicants = recruiterService.getAllApplicants(req.user.id);
      }

      return sendSuccess(res, applicants, 'Applicants retrieved successfully.');
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  getDashboardStats(req, res, next) {
    try {
      const stats = recruiterService.getDashboardStats(req.user.id);
      return sendSuccess(res, stats, 'Dashboard stats fetched successfully.');
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }
}

module.exports = new RecruiterController();
