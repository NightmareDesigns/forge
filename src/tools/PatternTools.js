/**
 * Nightmare Designs Forge - Pattern & Hatch Tools
 * Fill patterns for engraving, scoring, and decorative effects
 */

class PatternTools {
  constructor() {
    this.patterns = {
      lines: 'Horizontal Lines',
      linesV: 'Vertical Lines',
      crosshatch: 'Crosshatch',
      diagonal: 'Diagonal Lines',
      diagonalCross: 'Diagonal Crosshatch',
      dots: 'Dot Pattern',
      zigzag: 'Zigzag',
      wave: 'Wave Pattern',
      brick: 'Brick Pattern',
      hexagon: 'Hexagon Pattern'
    };
  }

  /**
   * Generate horizontal line fill
   * @param {object} bounds - Bounding box {x, y, width, height}
   * @param {number} spacing - Line spacing
   * @param {number} angle - Rotation angle in degrees
   * @returns {Array} - Array of line paths
   */
  linesFill(bounds, spacing = 5, angle = 0) {
    const lines = [];
    const { x, y, width, height } = bounds;
    const radians = angle * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    // Calculate extended bounds to cover rotated area
    const diagonal = Math.sqrt(width * width + height * height);
    const cx = x + width / 2;
    const cy = y + height / 2;
    
    for (let offset = -diagonal / 2; offset <= diagonal / 2; offset += spacing) {
      // Line perpendicular to angle
      const x1 = cx + cos * (-diagonal / 2) - sin * offset;
      const y1 = cy + sin * (-diagonal / 2) + cos * offset;
      const x2 = cx + cos * (diagonal / 2) - sin * offset;
      const y2 = cy + sin * (diagonal / 2) + cos * offset;
      
      lines.push({
        type: 'line',
        x1, y1, x2, y2,
        stroke: '#000000',
        strokeWidth: 0.5
      });
    }
    
    return this.clipToPath(lines, bounds);
  }

  /**
   * Generate crosshatch fill
   */
  crosshatchFill(bounds, spacing = 5) {
    return [
      ...this.linesFill(bounds, spacing, 0),
      ...this.linesFill(bounds, spacing, 90)
    ];
  }

  /**
   * Generate diagonal crosshatch
   */
  diagonalCrossFill(bounds, spacing = 5) {
    return [
      ...this.linesFill(bounds, spacing, 45),
      ...this.linesFill(bounds, spacing, -45)
    ];
  }

  /**
   * Generate dot pattern fill
   * @param {object} bounds - Bounding box
   * @param {number} spacing - Dot spacing
   * @param {number} radius - Dot radius
   */
  dotsFill(bounds, spacing = 10, radius = 1.5) {
    const dots = [];
    const { x, y, width, height } = bounds;
    
    for (let py = y + spacing / 2; py < y + height; py += spacing) {
      for (let px = x + spacing / 2; px < x + width; px += spacing) {
        dots.push({
          type: 'circle',
          cx: px,
          cy: py,
          r: radius,
          fill: '#000000'
        });
      }
    }
    
    return dots;
  }

  /**
   * Generate zigzag pattern
   */
  zigzagFill(bounds, spacing = 10, amplitude = 5) {
    const paths = [];
    const { x, y, width, height } = bounds;
    
    for (let py = y; py < y + height; py += spacing) {
      let pathData = `M${x},${py}`;
      let up = true;
      
      for (let px = x; px <= x + width; px += amplitude) {
        const yOffset = up ? -amplitude / 2 : amplitude / 2;
        pathData += ` L${px},${py + yOffset}`;
        up = !up;
      }
      
      paths.push({
        type: 'path',
        pathData,
        fill: 'none',
        stroke: '#000000',
        strokeWidth: 0.5
      });
    }
    
    return paths;
  }

  /**
   * Generate wave pattern
   */
  waveFill(bounds, spacing = 10, amplitude = 5, frequency = 0.1) {
    const paths = [];
    const { x, y, width, height } = bounds;
    
    for (let py = y; py < y + height; py += spacing) {
      const points = [];
      
      for (let px = x; px <= x + width; px += 2) {
        const yOffset = Math.sin((px - x) * frequency) * amplitude;
        points.push(`${px},${py + yOffset}`);
      }
      
      paths.push({
        type: 'path',
        pathData: `M${points.join(' L')}`,
        fill: 'none',
        stroke: '#000000',
        strokeWidth: 0.5
      });
    }
    
    return paths;
  }

  /**
   * Generate spiral fill
   */
  spiralFill(bounds, spacing = 5) {
    const { x, y, width, height } = bounds;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const maxRadius = Math.min(width, height) / 2;
    
    const points = [];
    const turns = maxRadius / spacing;
    const totalAngle = turns * Math.PI * 2;
    
    for (let angle = 0; angle <= totalAngle; angle += 0.1) {
      const radius = (angle / totalAngle) * maxRadius;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      points.push(`${px},${py}`);
    }
    
    return [{
      type: 'path',
      pathData: `M${points.join(' L')}`,
      fill: 'none',
      stroke: '#000000',
      strokeWidth: 0.5
    }];
  }

  /**
   * Generate concentric fill (for circular objects)
   */
  concentricFill(cx, cy, radius, spacing = 5) {
    const circles = [];
    
    for (let r = spacing; r <= radius; r += spacing) {
      circles.push({
        type: 'circle',
        cx, cy,
        r,
        fill: 'none',
        stroke: '#000000',
        strokeWidth: 0.5
      });
    }
    
    return circles;
  }

  /**
   * Generate hexagon pattern
   */
  hexagonFill(bounds, size = 15) {
    const hexagons = [];
    const { x, y, width, height } = bounds;
    const h = size * Math.sqrt(3);
    
    let row = 0;
    for (let py = y; py < y + height + h; py += h * 0.75) {
      const offset = (row % 2) * (size * 1.5);
      
      for (let px = x + offset; px < x + width + size * 2; px += size * 3) {
        hexagons.push(this.createHexagon(px, py, size));
      }
      row++;
    }
    
    return hexagons;
  }

  /**
   * Create single hexagon path
   */
  createHexagon(cx, cy, size) {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 - 30) * Math.PI / 180;
      points.push(`${cx + Math.cos(angle) * size},${cy + Math.sin(angle) * size}`);
    }
    
    return {
      type: 'path',
      pathData: `M${points.join(' L')} Z`,
      fill: 'none',
      stroke: '#000000',
      strokeWidth: 0.5
    };
  }

  /**
   * Clip pattern elements to a path (simplified - rectangular clip)
   */
  clipToPath(elements, bounds) {
    return elements.filter(el => {
      if (el.type === 'line') {
        return this.lineIntersectsBounds(el, bounds);
      }
      return true;
    });
  }

  /**
   * Check if line intersects bounds
   */
  lineIntersectsBounds(line, bounds) {
    const { x1, y1, x2, y2 } = line;
    const { x, y, width, height } = bounds;
    
    // Simple check - at least one point in bounds or line crosses bounds
    const inBounds = (px, py) => 
      px >= x && px <= x + width && py >= y && py <= y + height;
    
    return inBounds(x1, y1) || inBounds(x2, y2) ||
           (x1 <= x + width && x2 >= x && y1 <= y + height && y2 >= y);
  }

  /**
   * Apply pattern fill to an object
   * @param {object} obj - Object to fill
   * @param {string} pattern - Pattern type
   * @param {object} options - Pattern options
   */
  applyPattern(obj, pattern, options = {}) {
    const bounds = {
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height
    };
    
    const spacing = options.spacing || 5;
    const angle = options.angle || 0;
    
    let patternElements;
    
    switch (pattern) {
      case 'lines':
        patternElements = this.linesFill(bounds, spacing, angle);
        break;
      case 'linesV':
        patternElements = this.linesFill(bounds, spacing, 90);
        break;
      case 'crosshatch':
        patternElements = this.crosshatchFill(bounds, spacing);
        break;
      case 'diagonal':
        patternElements = this.linesFill(bounds, spacing, 45);
        break;
      case 'diagonalCross':
        patternElements = this.diagonalCrossFill(bounds, spacing);
        break;
      case 'dots':
        patternElements = this.dotsFill(bounds, spacing, options.radius || 1.5);
        break;
      case 'zigzag':
        patternElements = this.zigzagFill(bounds, spacing, options.amplitude || 5);
        break;
      case 'wave':
        patternElements = this.waveFill(bounds, spacing, options.amplitude || 5);
        break;
      case 'spiral':
        patternElements = this.spiralFill(bounds, spacing);
        break;
      case 'hexagon':
        patternElements = this.hexagonFill(bounds, spacing);
        break;
      default:
        patternElements = this.linesFill(bounds, spacing, angle);
    }
    
    return {
      type: 'group',
      children: [obj, ...patternElements],
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      patternType: pattern
    };
  }

  /**
   * Get available patterns
   */
  getPatterns() {
    return this.patterns;
  }
}

module.exports = PatternTools;
