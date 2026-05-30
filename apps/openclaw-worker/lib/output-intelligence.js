module.exports = {
  classifyOutput: function(text) {
    const t = (text || '').toLowerCase();
    if (t.includes('write') || t.includes('created')) {
      return { primary: 'code_written' };
    }
    if (t.includes('saved') || t.includes('plans')) {
      return { primary: 'analysis_only' };
    }
    if (t.includes('error') || t.includes('failed')) {
      return { primary: 'error' };
    }
    return { primary: 'unknown' };
  }
};
