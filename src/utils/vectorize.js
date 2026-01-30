/**
 * CraftForge - Image Vectorization Module
 * Converts raster images to vector paths using potrace
 */

const potrace = require('potrace');
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');
const { tmpdir } = require('os');

class Vectorizer {
  constructor() {
    this.defaultOptions = {
      threshold: 128,
      turdSize: 2,
      turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY,
      alphaMax: 1,
      optCurve: true,
      optTolerance: 0.2,
      color: '#000000',
      background: 'transparent'
    };
  }

  /**
   * Convert data URL to temporary file
   * @param {string} dataUrl - Base64 data URL
   * @returns {Promise<string>} - Path to temporary file
   */
  async dataUrlToFile(dataUrl) {
    return new Promise((resolve, reject) => {
      try {
        const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (!matches) {
          reject(new Error('Invalid data URL format'));
          return;
        }
        
        const [, format, base64] = matches;
        const buffer = Buffer.from(base64, 'base64');
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const tempPath = path.join(tmpdir(), `potrace-${timestamp}-${random}.${format}`);
        
        fs.writeFile(tempPath, buffer, (err) => {
          if (err) reject(err);
          else resolve(tempPath);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Trace an image file to SVG
   * @param {string} imagePath - Path to the image file or data URL
   * @param {object} options - Tracing options
   * @returns {Promise<object>} - SVG string and path data
   */
  async traceImage(imagePath, options = {}) {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      // Convert data URL to temporary file if needed
      let fileToTrace = imagePath;
      let tempFile = null;
      
      if (imagePath.startsWith('data:')) {
        tempFile = await this.dataUrlToFile(imagePath);
        fileToTrace = tempFile;
      }
      
      return await new Promise((resolve, reject) => {
        potrace.trace(fileToTrace, opts, async (err, svg) => {
          // Clean up temp file if it was created
          if (tempFile) {
            fs.unlink(tempFile, () => {}); // ignore errors
          }
          
          if (err) {
            reject(err);
            return;
          }
          
          // Ensure SVG has width/height attributes. If not, try to read source image dimensions.
          try {
            const hasWH = /<svg[^>]*(width|height)=/i.test(svg);
            const viewBoxMatch = svg.match(/<svg[^>]*viewBox="([^"]+)"/i);
            if (!hasWH) {
              let w = 0, h = 0;
              if (viewBoxMatch) {
                const parts = viewBoxMatch[1].split(/[,\s]+/).map(Number);
                if (parts.length === 4) { w = parts[2]; h = parts[3]; }
              }
              if (!w || !h) {
                // Fallback to reading the raster image size
                try {
                  const img = await Jimp.read(fileToTrace);
                  w = img.bitmap.width;
                  h = img.bitmap.height;
                } catch (e) {
                  // ignore
                }
              }

              if (w && h) {
                svg = svg.replace(/<svg/i, `<svg width="${w}" height="${h}"`);
              }
            }
          } catch (e) {
            // ignore dimension fixes
          }

          // Extract all path 'd' attributes and join them so consumers have combined pathData
          const dRegex = /d=\"([^\"]+)\"/g;
          let m;
          const parts = [];
          while ((m = dRegex.exec(svg)) !== null) {
            if (m[1]) parts.push(m[1]);
          }
          const pathData = parts.join(' ');

          resolve({ svg: svg, pathData: pathData, options: opts });
        });
      });
    } catch (err) {
      throw err;
    }
  }

  /**
   * Trace with posterization (multiple colors/layers)
   * @param {string} imagePath - Path to the image file or data URL
   * @param {number} steps - Number of color steps
   * @param {object} options - Tracing options
   * @returns {Promise<object>} - Multi-layer SVG data
   */
  async posterizeTrace(imagePath, steps = 4, options = {}) {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      // Convert data URL to temporary file if needed
      let fileToTrace = imagePath;
      let tempFile = null;
      
      if (imagePath.startsWith('data:')) {
        tempFile = await this.dataUrlToFile(imagePath);
        fileToTrace = tempFile;
      }
      
      return await new Promise((resolve, reject) => {
        potrace.posterize(fileToTrace, { steps, ...opts }, (err, svg) => {
          // Clean up temp file if it was created
          if (tempFile) {
            fs.unlink(tempFile, () => {}); // ignore errors
          }
          
          if (err) {
            reject(err);
            return;
          }
          
          resolve({
            svg: svg,
            steps: steps,
            options: opts
          });
        });
      });
    } catch (err) {
      throw err;
    }
  }

  /**
   * Preprocess image before tracing
   * @param {string} imagePath - Path to input image
   * @param {object} options - Preprocessing options
   * @returns {Promise<string>} - Path to processed image
   */
  async preprocessImage(imagePath, options = {}) {
    const {
      contrast = 0,
      brightness = 0,
      grayscale = true,
      invert = false,
      blur = 0
    } = options;

    const image = await Jimp.read(imagePath);
    
    if (grayscale) {
      image.grayscale();
    }
    
    if (contrast !== 0) {
      image.contrast(contrast);
    }
    
    if (brightness !== 0) {
      image.brightness(brightness);
    }
    
    if (invert) {
      image.invert();
    }
    
    if (blur > 0) {
      image.blur(blur);
    }

    // Save to temp file
    const tempPath = path.join(
      path.dirname(imagePath),
      `_temp_${Date.now()}.png`
    );
    
    await image.writeAsync(tempPath);
    return tempPath;
  }

  /**
   * Convert SVG path to cut-ready path data
   * @param {string} pathData - SVG path d attribute
   * @returns {Array} - Array of path commands
   */
  parsePath(pathData) {
    const commands = [];
    const regex = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
    let match;
    
    while ((match = regex.exec(pathData)) !== null) {
      const command = match[1];
      const params = match[2].trim().split(/[\s,]+/).filter(p => p).map(Number);
      
      commands.push({
        command: command,
        params: params
      });
    }
    
    return commands;
  }

  /**
   * Convert path commands to plotter-friendly coordinates
   * @param {Array} commands - Parsed path commands
   * @param {object} options - Conversion options
   * @returns {Array} - Array of {x, y, pen} coordinates
   */
  pathToCoordinates(commands, options = {}) {
    const { scale = 1, offsetX = 0, offsetY = 0 } = options;
    const coords = [];
    let currentX = 0;
    let currentY = 0;
    let startX = 0;
    let startY = 0;

    for (const cmd of commands) {
      const { command, params } = cmd;
      const isRelative = command === command.toLowerCase();
      
      switch (command.toUpperCase()) {
        case 'M': // Move to
          if (isRelative) {
            currentX += params[0];
            currentY += params[1];
          } else {
            currentX = params[0];
            currentY = params[1];
          }
          startX = currentX;
          startY = currentY;
          coords.push({
            x: (currentX + offsetX) * scale,
            y: (currentY + offsetY) * scale,
            pen: 'up'
          });
          break;
          
        case 'L': // Line to
          if (isRelative) {
            currentX += params[0];
            currentY += params[1];
          } else {
            currentX = params[0];
            currentY = params[1];
          }
          coords.push({
            x: (currentX + offsetX) * scale,
            y: (currentY + offsetY) * scale,
            pen: 'down'
          });
          break;
          
        case 'H': // Horizontal line
          currentX = isRelative ? currentX + params[0] : params[0];
          coords.push({
            x: (currentX + offsetX) * scale,
            y: (currentY + offsetY) * scale,
            pen: 'down'
          });
          break;
          
        case 'V': // Vertical line
          currentY = isRelative ? currentY + params[0] : params[0];
          coords.push({
            x: (currentX + offsetX) * scale,
            y: (currentY + offsetY) * scale,
            pen: 'down'
          });
          break;
          
        case 'C': // Cubic bezier - linearize
          const bezierPoints = this.linearizeCubicBezier(
            currentX, currentY,
            isRelative ? currentX + params[0] : params[0],
            isRelative ? currentY + params[1] : params[1],
            isRelative ? currentX + params[2] : params[2],
            isRelative ? currentY + params[3] : params[3],
            isRelative ? currentX + params[4] : params[4],
            isRelative ? currentY + params[5] : params[5]
          );
          
          for (const pt of bezierPoints) {
            coords.push({
              x: (pt.x + offsetX) * scale,
              y: (pt.y + offsetY) * scale,
              pen: 'down'
            });
          }
          
          currentX = isRelative ? currentX + params[4] : params[4];
          currentY = isRelative ? currentY + params[5] : params[5];
          break;
          
        case 'Z': // Close path
          coords.push({
            x: (startX + offsetX) * scale,
            y: (startY + offsetY) * scale,
            pen: 'down'
          });
          currentX = startX;
          currentY = startY;
          break;
      }
    }
    
    return coords;
  }

  /**
   * Linearize cubic bezier curve to line segments
   */
  linearizeCubicBezier(x0, y0, x1, y1, x2, y2, x3, y3, segments = 20) {
    const points = [];
    
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const t2 = t * t;
      const t3 = t2 * t;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;
      
      const x = mt3 * x0 + 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t3 * x3;
      const y = mt3 * y0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t3 * y3;
      
      points.push({ x, y });
    }
    
    return points;
  }

  /**
   * Clean up temporary files
   */
  async cleanup(tempPath) {
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  }
}

module.exports = Vectorizer;
