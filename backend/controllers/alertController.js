const Alert = require('../models/Alert');
const { syncSystemAlerts } = require('../services/alertService');

// @desc    Get alerts with optional status filtering
// @route   GET /api/alerts
// @access  Private
const getAlerts = async (req, res) => {
  try {
    const { status, severity, type } = req.query;
    
    // Auto-sync first to ensure alerts are up-to-date
    await syncSystemAlerts();

    const filter = {};
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (severity && severity !== 'All') {
      filter.severity = severity;
    }
    if (type && type !== 'All') {
      filter.type = type;
    }

    const alerts = await Alert.find(filter)
      .populate('acknowledgedBy', 'username email')
      .populate('resolvedBy', 'username email')
      .sort({ createdAt: -1 });

    const activeCount = await Alert.countDocuments({ status: 'Active' });
    const acknowledgedCount = await Alert.countDocuments({ status: 'Acknowledged' });
    const resolvedCount = await Alert.countDocuments({ status: 'Resolved' });
    const totalCount = await Alert.countDocuments();

    res.json({
      success: true,
      counts: {
        total: totalCount,
        active: activeCount,
        acknowledged: acknowledgedCount,
        resolved: resolvedCount,
      },
      data: alerts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Acknowledge an alert
// @route   PUT /api/alerts/:id/acknowledge
// @access  Private
const acknowledgeAlert = async (req, res) => {
  try {
    const acknowledgedAt = new Date();
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, status: 'Active' },
      {
        $set: {
          status: 'Acknowledged',
          acknowledgedBy: req.user._id,
          acknowledgedAt,
        },
      },
      { new: true, runValidators: true }
    );
    if (!alert) {
      const existing = await Alert.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Alert not found' });
      }
      return res.status(409).json({
        success: false,
        message: existing.status === 'Resolved'
          ? 'Resolved alerts cannot be acknowledged'
          : 'Alert has already been acknowledged',
      });
    }

    res.json({ success: true, message: 'Alert acknowledged successfully', data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resolve an alert manually
// @route   PUT /api/alerts/:id/resolve
// @access  Private
const resolveAlert = async (req, res) => {
  try {
    const resolvedAt = new Date();
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, status: { $in: ['Active', 'Acknowledged'] } },
      {
        $set: {
          status: 'Resolved',
          resolvedBy: req.user._id,
          resolvedAt,
          resolutionReason: 'manual',
        },
        $unset: { conditionKey: 1 },
      },
      { new: true, runValidators: true }
    );
    if (!alert) {
      const existing = await Alert.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Alert not found' });
      }
      return res.status(409).json({ success: false, message: 'Alert has already been resolved' });
    }

    res.json({ success: true, message: 'Alert resolved successfully', data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
};
