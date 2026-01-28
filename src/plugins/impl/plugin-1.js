module.exports = {
  init: function (appContext) {
    // example plugin init - appContext can be a reference to the renderer or main APIs
    console.log('plugin-1 (Quick Brush) initialized with context:', typeof appContext);
    return {
      name: 'Quick Brush',
      version: '0.1.0'
    };
  }
};
