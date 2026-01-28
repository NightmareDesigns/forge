/**
 * Security utilities for CraftForge
 * Path validation, input sanitization, and safe error handling
 */

const path = require('path');
const fs = require('fs');

/**
 * Validate and normalize file path to prevent path traversal attacks
 * @param {string} filePath - File path to validate
 * @param {string} baseDir - Base directory to restrict access (optional)
 * @returns {string} - Normalized path if safe
 * @throws {Error} if path traversal detected
 */
function validateFilePath(filePath, baseDir = null) {
  if (typeof filePath !== 'string') {
    throw new Error('Path must be a string');
  }

  // Resolve to absolute path
  const resolved = path.resolve(filePath);

  // Check for null bytes
  if (resolved.includes('\0')) {
    throw new Error('Path contains null bytes');
  }

  // If baseDir specified, ensure path is within it
  if (baseDir) {
    const base = path.resolve(baseDir);
    if (!resolved.startsWith(base + path.sep) && resolved !== base) {
      throw new Error('Path traversal detected');
    }
  }

  // Check if path exists (file or directory)
  if (!fs.existsSync(resolved)) {
    throw new Error('Path does not exist');
  }

  return resolved;
}

/**
 * Validate device info object for IPC safety
 * @param {object} deviceInfo - Device information object
 * @returns {object} - Safe, serializable device info
 */
function validateDeviceInfo(deviceInfo) {
  if (typeof deviceInfo !== 'object' || deviceInfo === null) {
    throw new Error('Device info must be an object');
  }

  return {
    path: String(deviceInfo.path || ''),
    manufacturer: String(deviceInfo.manufacturer || ''),
    serialNumber: String(deviceInfo.serialNumber || ''),
    vendorId: Number(deviceInfo.vendorId) || 0,
    productId: Number(deviceInfo.productId) || 0,
    type: String(deviceInfo.type || 'unknown')
  };
}

/**
 * Validate cut job object to prevent invalid commands
 * @param {object} job - Cut job data
 * @returns {object} - Validated job
 */
function validateCutJob(job) {
  if (typeof job !== 'object' || job === null) {
    throw new Error('Cut job must be an object');
  }

  return {
    paths: Array.isArray(job.paths) ? job.paths : [],
    settings: typeof job.settings === 'object' ? job.settings : {}
  };
}

/**
 * Validate image tracing options
 * @param {object} options - Trace options
 * @returns {object} - Validated options
 */
function validateTraceOptions(options) {
  if (typeof options !== 'object' || options === null) {
    return {};
  }

  return {
    threshold: Math.min(255, Math.max(0, Number(options.threshold) || 128)),
    turdSize: Math.max(0, Number(options.turdSize) || 2),
    optTolerance: Math.max(0, Number(options.optTolerance) || 0.2),
    alphaMax: Math.max(0, Number(options.alphaMax) || 1.0),
    longCurveThreshold: Math.max(0, Number(options.longCurveThreshold) || 4)
  };
}

/**
 * Safe error handler for IPC — log internally, send safe message to renderer
 * @param {Error} err - Error object
 * @param {object} options - Options (channel, sender window)
 */
function handleSecureError(err, options = {}) {
  const { mainWindow, channel = 'error', operation = 'operation' } = options;

  // Log full error internally (never to user)
  console.error(`[SECURITY] Error during ${operation}:`, err);

  // Send generic message to renderer (no internals leaked)
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send(channel, {
      message: 'An error occurred during the operation',
      code: err.code || 'UNKNOWN_ERROR'
    });
  }
}

module.exports = {
  validateFilePath,
  validateDeviceInfo,
  validateCutJob,
  validateTraceOptions,
  handleSecureError
};
