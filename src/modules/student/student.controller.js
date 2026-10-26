const studentService = require('./student.service');
const { validateStudentProfile } = require('../../shared/validation/validators');
const { sendSuccess, sendError } = require('../../shared/utils/response');

class StudentController {
  getProfile(req, res, next) {
    try {
      const profile = studentService.getProfile(req.user.id);
      return sendSuccess(res, profile, 'Student profile fetched successfully.');
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  updateProfile(req, res, next) {
    try {
      const { isValid, errors } = validateStudentProfile(req.body);
      if (!isValid) {
        return sendError(res, errors[0], 400, errors);
      }

      const updated = studentService.updateProfile(req.user.id, req.body);
      return sendSuccess(res, updated, 'Student profile updated successfully.');
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  getDocuments(req, res, next) {
    try {
      const documents = studentService.getDocuments(req.user.id);
      return sendSuccess(res, documents, 'Documents fetched successfully.');
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  uploadDocument(req, res, next) {
    try {
      const { documentType } = req.body;
      const validTypes = ['resume', 'academic', 'other'];

      if (!documentType || !validTypes.includes(documentType.toLowerCase())) {
        return sendError(res, 'Valid document type is required (resume, academic, or other).', 400);
      }

      if (!req.file) {
        return sendError(res, 'Please select a document file to upload.', 400);
      }

      const doc = studentService.addDocument(req.user.id, documentType.toLowerCase(), req.file);
      return sendSuccess(res, doc, 'Document uploaded successfully.', 201);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  deleteDocument(req, res, next) {
    try {
      const documentId = parseInt(req.params.id, 10);
      if (isNaN(documentId)) {
        return sendError(res, 'Invalid document ID.', 400);
      }

      studentService.deleteDocument(req.user.id, documentId);
      return sendSuccess(res, null, 'Document deleted successfully.');
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  getOpportunities(req, res, next) {
    try {
      const opportunities = studentService.getOpportunities(req.user.id);
      return sendSuccess(res, opportunities, 'Opportunities fetched successfully.');
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

      const opp = studentService.getOpportunityById(req.user.id, oppId);
      return sendSuccess(res, opp, 'Opportunity details fetched successfully.');
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  applyForOpportunity(req, res, next) {
    try {
      const oppId = parseInt(req.params.id, 10);
      if (isNaN(oppId)) {
        return sendError(res, 'Invalid opportunity ID.', 400);
      }

      const application = studentService.applyForOpportunity(req.user.id, oppId);
      return sendSuccess(res, application, 'Application submitted successfully!', 201);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode, error.reasons);
      }
      next(error);
    }
  }

  getApplications(req, res, next) {
    try {
      const applications = studentService.getApplications(req.user.id);
      return sendSuccess(res, applications, 'Applications fetched successfully.');
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  getDashboardStats(req, res, next) {
    try {
      const stats = studentService.getDashboardStats(req.user.id);
      return sendSuccess(res, stats, 'Dashboard stats fetched successfully.');
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }
}

module.exports = new StudentController();
