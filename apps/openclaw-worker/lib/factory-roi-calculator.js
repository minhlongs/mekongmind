module.exports = {
  getDashboardData: function() {
    return {
      metricsLineCount: 120,
      brainState: {
        commandsLearned: 15,
        projectStatesTracked: 8,
        lastUpdated: new Date().toISOString()
      },
      projectROI: {
        "raas-landing": { dispatches: 10, successes: 8, timeouts: 2, roi: 80 },
        "raas-dashboard": { dispatches: 15, successes: 12, timeouts: 3, roi: 80 },
        "mekong-engine": { dispatches: 5, successes: 5, timeouts: 0, roi: 100 }
      }
    };
  }
};
