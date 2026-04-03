const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/stats', reportController.getReportStats);
router.get('/', reportController.getReports);
router.post('/', reportController.createReport);
router.put('/bulk-update', reportController.bulkUpdateReports);
router.get('/question/:questionId', reportController.getReportsForQuestion);
router.get('/:id', reportController.getReportById);
router.put('/:id', reportController.updateReport);
router.post('/:id/fix', reportController.fixQuestion);
router.delete('/:id', reportController.deleteReport);

module.exports = router;