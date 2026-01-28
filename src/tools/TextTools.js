/**
 * CraftForge - Text Tools
 * Text manipulation, text on path, and typography features
 */

class TextTools {
  constructor() {
    this.fonts = [];
    this.defaultFont = 'Arial';
  }

  /**
   * Create a text object
   * @param {string} text - The text content
   * @param {object} options - Text options
   * @returns {object} - Text object
   */
  createText(text, options = {}) {
    const {
      x = 0,
      y = 0,
      fontSize = 48,
      fontFamily = this.defaultFont,
      fontWeight = 'normal',
      fontStyle = 'normal',
      letterSpacing = 0,
      lineHeight = 1.2,
      textAlign = 'left',
      fill = '#000000',
      stroke = 'none',
      strokeWidth = 0
    } = options;

    return {
      type: 'text',
      text,
      x, y,
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle,
      letterSpacing,
      lineHeight,
      textAlign,
      fill,
      stroke,
      strokeWidth,
      width: this.measureTextWidth(text, fontSize, fontFamily),
      height: fontSize * lineHeight
    };
  }

  /**
   * Estimate text width (simplified)
   * @param {string} text - Text to measure
   * @param {number} fontSize - Font size
   * @param {string} fontFamily - Font family
   * @returns {number} - Estimated width
   */
  measureTextWidth(text, fontSize, fontFamily) {
    // Rough estimation - actual measurement would use canvas or opentype.js
    const avgCharWidth = fontSize * 0.6;
    return text.length * avgCharWidth;
  }

  /**
   * Apply letter spacing to text
   * @param {object} textObj - Text object
   * @param {number} spacing - Letter spacing in pixels
   * @returns {object} - Modified text object
   */
  setLetterSpacing(textObj, spacing) {
    return {
      ...textObj,
      letterSpacing: spacing,
      width: this.measureTextWidth(textObj.text, textObj.fontSize, textObj.fontFamily) + 
             (textObj.text.length - 1) * spacing
    };
  }

  /**
   * Apply line spacing to text
   * @param {object} textObj - Text object
   * @param {number} lineHeight - Line height multiplier
   * @returns {object} - Modified text object
   */
  setLineHeight(textObj, lineHeight) {
    const lines = textObj.text.split('\n').length;
    return {
      ...textObj,
      lineHeight,
      height: textObj.fontSize * lineHeight * lines
    };
  }

  /**
   * Place text along a path
   * @param {object} textObj - Text object
   * @param {string} pathData - SVG path data
   * @param {object} options - Options
   * @returns {object} - Text on path object
   */
  textOnPath(textObj, pathData, options = {}) {
    const {
      startOffset = 0,     // 0-100 percentage
      textAnchor = 'start', // start, middle, end
      side = 'left'        // left (outside) or right (inside)
    } = options;

    return {
      type: 'textPath',
      text: textObj.text,
      pathData,
      startOffset,
      textAnchor,
      side,
      fontSize: textObj.fontSize,
      fontFamily: textObj.fontFamily,
      letterSpacing: textObj.letterSpacing,
      fill: textObj.fill,
      stroke: textObj.stroke,
      strokeWidth: textObj.strokeWidth
    };
  }

  /**
   * Create curved text (arc)
   * @param {string} text - Text content
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} radius - Arc radius
   * @param {number} startAngle - Start angle in degrees
   * @param {object} options - Text options
   * @returns {object} - Curved text object
   */
  curvedText(text, cx, cy, radius, startAngle = 0, options = {}) {
    // Generate arc path for text to follow
    const angleSpan = (text.length * (options.fontSize || 48) * 0.7) / radius;
    const endAngle = startAngle + (angleSpan * 180 / Math.PI);
    
    const startRad = startAngle * Math.PI / 180;
    const endRad = endAngle * Math.PI / 180;
    
    const x1 = cx + Math.cos(startRad) * radius;
    const y1 = cy + Math.sin(startRad) * radius;
    const x2 = cx + Math.cos(endRad) * radius;
    const y2 = cy + Math.sin(endRad) * radius;
    
    const largeArc = angleSpan > Math.PI ? 1 : 0;
    const pathData = `M${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2}`;
    
    const textObj = this.createText(text, options);
    return this.textOnPath(textObj, pathData, { textAnchor: 'middle', startOffset: 50 });
  }

  /**
   * Create circular text
   * @param {string} text - Text content
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} radius - Circle radius
   * @param {object} options - Text options
   * @returns {object} - Circular text object
   */
  circularText(text, cx, cy, radius, options = {}) {
    const pathData = `M${cx - radius},${cy} A${radius},${radius} 0 1 1 ${cx + radius},${cy} A${radius},${radius} 0 1 1 ${cx - radius},${cy}`;
    
    const textObj = this.createText(text, options);
    return this.textOnPath(textObj, pathData, { startOffset: 0 });
  }

  /**
   * Create wavy text
   * @param {string} text - Text content
   * @param {number} x - Start X
   * @param {number} y - Start Y
   * @param {number} width - Wave width
   * @param {number} amplitude - Wave height
   * @param {number} frequency - Number of waves
   * @param {object} options - Text options
   * @returns {object} - Wavy text object
   */
  wavyText(text, x, y, width, amplitude = 20, frequency = 2, options = {}) {
    // Generate wave path
    const points = [];
    const steps = 50;
    
    for (let i = 0; i <= steps; i++) {
      const px = x + (i / steps) * width;
      const py = y + Math.sin((i / steps) * Math.PI * 2 * frequency) * amplitude;
      points.push(i === 0 ? `M${px},${py}` : `L${px},${py}`);
    }
    
    const pathData = points.join(' ');
    const textObj = this.createText(text, options);
    return this.textOnPath(textObj, pathData);
  }

  /**
   * Convert text to outlines (paths)
   * @param {object} textObj - Text object
   * @returns {Promise<object>} - Path object
   * Note: This would require opentype.js for actual implementation
   */
  async textToOutlines(textObj) {
    // Placeholder - actual implementation needs opentype.js font parsing
    return {
      type: 'path',
      pathData: '', // Would be generated from font glyphs
      x: textObj.x,
      y: textObj.y,
      fill: textObj.fill,
      stroke: textObj.stroke,
      strokeWidth: textObj.strokeWidth,
      originalText: textObj.text
    };
  }

  /**
   * Create monogram from initials
   * @param {string} initials - 1-3 letters
   * @param {object} options - Style options
   * @returns {object} - Monogram object
   */
  createMonogram(initials, options = {}) {
    const {
      x = 0,
      y = 0,
      size = 200,
      style = 'circle', // circle, diamond, square, wreath
      fontSize = size * 0.4,
      fontFamily = 'serif',
      fill = '#000000',
      frameColor = '#000000',
      frameWidth = 2
    } = options;

    const letters = initials.toUpperCase().slice(0, 3);
    const cx = x + size / 2;
    const cy = y + size / 2;
    const radius = size / 2 - frameWidth;

    let framePath;
    switch (style) {
      case 'circle':
        framePath = `M${cx + radius},${cy} A${radius},${radius} 0 1 1 ${cx - radius},${cy} A${radius},${radius} 0 1 1 ${cx + radius},${cy}`;
        break;
      case 'diamond':
        framePath = `M${cx},${y + frameWidth} L${x + size - frameWidth},${cy} L${cx},${y + size - frameWidth} L${x + frameWidth},${cy} Z`;
        break;
      case 'square':
        framePath = `M${x + frameWidth},${y + frameWidth} L${x + size - frameWidth},${y + frameWidth} L${x + size - frameWidth},${y + size - frameWidth} L${x + frameWidth},${y + size - frameWidth} Z`;
        break;
      default:
        framePath = `M${cx + radius},${cy} A${radius},${radius} 0 1 1 ${cx - radius},${cy} A${radius},${radius} 0 1 1 ${cx + radius},${cy}`;
    }

    return {
      type: 'group',
      children: [
        {
          type: 'path',
          pathData: framePath,
          fill: 'none',
          stroke: frameColor,
          strokeWidth: frameWidth
        },
        this.createText(letters, {
          x: cx,
          y: cy,
          fontSize,
          fontFamily,
          fill,
          textAlign: 'center'
        })
      ],
      x, y, width: size, height: size
    };
  }

  /**
   * Kern specific letter pairs
   * @param {object} textObj - Text object
   * @param {object} kerningPairs - { "AV": -5, "To": -3, ... }
   * @returns {object} - Text with kerning
   */
  applyKerning(textObj, kerningPairs) {
    return {
      ...textObj,
      kerning: kerningPairs
    };
  }

  /**
   * Split text into individual letter objects
   * @param {object} textObj - Text object
   * @returns {Array} - Array of letter objects
   */
  explodeText(textObj) {
    const letters = [];
    let currentX = textObj.x;
    
    for (const char of textObj.text) {
      if (char !== ' ') {
        letters.push({
          ...textObj,
          text: char,
          x: currentX,
          width: textObj.fontSize * 0.6
        });
      }
      currentX += textObj.fontSize * 0.6 + textObj.letterSpacing;
    }
    
    return letters;
  }
}

module.exports = TextTools;
