/**
 * CraftForge - Shape Library
 * Pre-built shapes and shape generators
 */

class ShapeLibrary {
  constructor() {
    this.categories = {
      basic: ['rectangle', 'ellipse', 'triangle', 'diamond'],
      stars: ['star3', 'star4', 'star5', 'star6', 'star8', 'starburst'],
      polygons: ['pentagon', 'hexagon', 'heptagon', 'octagon'],
      arrows: ['arrowRight', 'arrowLeft', 'arrowUp', 'arrowDown', 'arrowDouble', 'chevron'],
      symbols: ['heart', 'cloud', 'lightning', 'moon', 'sun', 'flower'],
      banners: ['ribbon', 'banner', 'scroll', 'flag'],
      speech: ['speechBubble', 'thoughtBubble', 'callout'],
      frames: ['frameSimple', 'frameRounded', 'frameOrnate', 'frameStar']
    };
  }

  /**
   * Generate a star shape
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} outerRadius - Outer radius
   * @param {number} innerRadius - Inner radius
   * @param {number} points - Number of points
   * @returns {string} - SVG path data
   */
  star(cx, cy, outerRadius, innerRadius, points = 5) {
    const path = [];
    const angleStep = Math.PI / points;
    
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      
      path.push(i === 0 ? `M${x},${y}` : `L${x},${y}`);
    }
    path.push('Z');
    
    return path.join(' ');
  }

  /**
   * Generate a regular polygon
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} radius - Radius
   * @param {number} sides - Number of sides
   * @returns {string} - SVG path data
   */
  polygon(cx, cy, radius, sides) {
    const path = [];
    const angleStep = (Math.PI * 2) / sides;
    
    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      
      path.push(i === 0 ? `M${x},${y}` : `L${x},${y}`);
    }
    path.push('Z');
    
    return path.join(' ');
  }

  /**
   * Generate a heart shape
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} size - Size
   * @returns {string} - SVG path data
   */
  heart(cx, cy, size) {
    const w = size;
    const h = size;
    const x = cx - w / 2;
    const y = cy - h / 2;
    
    return `M${cx},${y + h * 0.3}
      C${x + w * 0.1},${y} ${x},${y + h * 0.35} ${x},${y + h * 0.35}
      C${x},${y + h * 0.55} ${x + w * 0.1},${y + h * 0.77} ${cx},${y + h}
      C${x + w * 0.9},${y + h * 0.77} ${x + w},${y + h * 0.55} ${x + w},${y + h * 0.35}
      C${x + w},${y + h * 0.35} ${x + w * 0.9},${y} ${cx},${y + h * 0.3}
      Z`;
  }

  /**
   * Generate an arrow shape
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {string} direction - Direction (right, left, up, down)
   * @returns {string} - SVG path data
   */
  arrow(x, y, width, height, direction = 'right') {
    const hw = width / 2;
    const hh = height / 2;
    const shaftWidth = height * 0.3;
    const headStart = width * 0.6;
    
    let path;
    switch (direction) {
      case 'right':
        path = `M${x},${y + hh - shaftWidth / 2}
          L${x + headStart},${y + hh - shaftWidth / 2}
          L${x + headStart},${y}
          L${x + width},${y + hh}
          L${x + headStart},${y + height}
          L${x + headStart},${y + hh + shaftWidth / 2}
          L${x},${y + hh + shaftWidth / 2} Z`;
        break;
      case 'left':
        path = `M${x + width},${y + hh - shaftWidth / 2}
          L${x + width - headStart},${y + hh - shaftWidth / 2}
          L${x + width - headStart},${y}
          L${x},${y + hh}
          L${x + width - headStart},${y + height}
          L${x + width - headStart},${y + hh + shaftWidth / 2}
          L${x + width},${y + hh + shaftWidth / 2} Z`;
        break;
      case 'up':
        path = `M${x + hw - shaftWidth / 2},${y + height}
          L${x + hw - shaftWidth / 2},${y + height - headStart}
          L${x},${y + height - headStart}
          L${x + hw},${y}
          L${x + width},${y + height - headStart}
          L${x + hw + shaftWidth / 2},${y + height - headStart}
          L${x + hw + shaftWidth / 2},${y + height} Z`;
        break;
      case 'down':
        path = `M${x + hw - shaftWidth / 2},${y}
          L${x + hw - shaftWidth / 2},${y + headStart}
          L${x},${y + headStart}
          L${x + hw},${y + height}
          L${x + width},${y + headStart}
          L${x + hw + shaftWidth / 2},${y + headStart}
          L${x + hw + shaftWidth / 2},${y} Z`;
        break;
    }
    return path;
  }

  /**
   * Generate a speech bubble
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {number} tailX - Tail X position relative to bubble
   * @returns {string} - SVG path data
   */
  speechBubble(x, y, width, height, tailX = 0.2) {
    const r = Math.min(width, height) * 0.15;
    const tailW = width * 0.15;
    const tailH = height * 0.3;
    const tailStart = x + width * tailX;
    
    return `M${x + r},${y}
      L${x + width - r},${y}
      Q${x + width},${y} ${x + width},${y + r}
      L${x + width},${y + height - r}
      Q${x + width},${y + height} ${x + width - r},${y + height}
      L${tailStart + tailW},${y + height}
      L${tailStart},${y + height + tailH}
      L${tailStart - tailW / 2},${y + height}
      L${x + r},${y + height}
      Q${x},${y + height} ${x},${y + height - r}
      L${x},${y + r}
      Q${x},${y} ${x + r},${y}
      Z`;
  }

  /**
   * Generate a cloud shape
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} width - Width
   * @param {number} height - Height
   * @returns {string} - SVG path data
   */
  cloud(cx, cy, width, height) {
    const x = cx - width / 2;
    const y = cy - height / 2;
    const w = width;
    const h = height;
    
    return `M${x + w * 0.25},${y + h * 0.6}
      C${x},${y + h * 0.6} ${x},${y + h * 0.3} ${x + w * 0.2},${y + h * 0.3}
      C${x + w * 0.15},${y + h * 0.1} ${x + w * 0.4},${y} ${x + w * 0.5},${y + h * 0.15}
      C${x + w * 0.6},${y} ${x + w * 0.85},${y + h * 0.1} ${x + w * 0.8},${y + h * 0.3}
      C${x + w},${y + h * 0.3} ${x + w},${y + h * 0.6} ${x + w * 0.75},${y + h * 0.6}
      C${x + w * 0.85},${y + h * 0.75} ${x + w * 0.75},${y + h} ${x + w * 0.5},${y + h}
      C${x + w * 0.25},${y + h} ${x + w * 0.15},${y + h * 0.75} ${x + w * 0.25},${y + h * 0.6}
      Z`;
  }

  /**
   * Generate a ribbon/banner shape
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @returns {string} - SVG path data
   */
  ribbon(x, y, width, height) {
    const notch = width * 0.1;
    const fold = width * 0.15;
    
    return `M${x},${y}
      L${x + width},${y}
      L${x + width + fold},${y + height / 2}
      L${x + width},${y + height}
      L${x},${y + height}
      L${x - fold},${y + height / 2}
      Z
      M${x + notch},${y}
      L${x},${y + height / 2}
      L${x + notch},${y + height}
      M${x + width - notch},${y}
      L${x + width},${y + height / 2}
      L${x + width - notch},${y + height}`;
  }

  /**
   * Generate a starburst shape
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} outerRadius - Outer radius
   * @param {number} innerRadius - Inner radius
   * @param {number} points - Number of points
   * @returns {string} - SVG path data
   */
  starburst(cx, cy, outerRadius, innerRadius, points = 16) {
    return this.star(cx, cy, outerRadius, innerRadius, points);
  }

  /**
   * Generate a crescent moon
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} radius - Outer radius
   * @returns {string} - SVG path data
   */
  moon(cx, cy, radius) {
    const innerOffset = radius * 0.3;
    return `M${cx},${cy - radius}
      A${radius},${radius} 0 1 1 ${cx},${cy + radius}
      A${radius * 0.7},${radius * 0.7} 0 1 0 ${cx},${cy - radius}
      Z`;
  }

  /**
   * Generate a flower shape
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} radius - Radius
   * @param {number} petals - Number of petals
   * @returns {string} - SVG path data
   */
  flower(cx, cy, radius, petals = 6) {
    const path = [];
    const petalLength = radius * 0.8;
    const petalWidth = radius * 0.4;
    
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(angle) * petalLength;
      const py = cy + Math.sin(angle) * petalLength;
      
      const cp1x = cx + Math.cos(angle - 0.3) * petalWidth;
      const cp1y = cy + Math.sin(angle - 0.3) * petalWidth;
      const cp2x = cx + Math.cos(angle + 0.3) * petalWidth;
      const cp2y = cy + Math.sin(angle + 0.3) * petalWidth;
      
      if (i === 0) {
        path.push(`M${cx},${cy}`);
      }
      path.push(`Q${cp1x},${cp1y} ${px},${py}`);
      path.push(`Q${cp2x},${cp2y} ${cx},${cy}`);
    }
    
    // Add center circle
    const centerR = radius * 0.2;
    path.push(`M${cx + centerR},${cy}`);
    path.push(`A${centerR},${centerR} 0 1 1 ${cx - centerR},${cy}`);
    path.push(`A${centerR},${centerR} 0 1 1 ${cx + centerR},${cy}`);
    
    return path.join(' ');
  }

  /**
   * Get shape by name
   * @param {string} name - Shape name
   * @param {object} params - Shape parameters
   * @returns {object} - Shape object with path data
   */
  getShape(name, params = {}) {
    const { x = 0, y = 0, width = 100, height = 100 } = params;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const radius = Math.min(width, height) / 2;
    
    const shapes = {
      // Stars
      star3: () => this.star(cx, cy, radius, radius * 0.4, 3),
      star4: () => this.star(cx, cy, radius, radius * 0.4, 4),
      star5: () => this.star(cx, cy, radius, radius * 0.4, 5),
      star6: () => this.star(cx, cy, radius, radius * 0.4, 6),
      star8: () => this.star(cx, cy, radius, radius * 0.5, 8),
      starburst: () => this.starburst(cx, cy, radius, radius * 0.7, 16),
      
      // Polygons
      triangle: () => this.polygon(cx, cy, radius, 3),
      diamond: () => this.polygon(cx, cy, radius, 4),
      pentagon: () => this.polygon(cx, cy, radius, 5),
      hexagon: () => this.polygon(cx, cy, radius, 6),
      heptagon: () => this.polygon(cx, cy, radius, 7),
      octagon: () => this.polygon(cx, cy, radius, 8),
      
      // Symbols
      heart: () => this.heart(cx, cy, width),
      cloud: () => this.cloud(cx, cy, width, height),
      moon: () => this.moon(cx, cy, radius),
      flower: () => this.flower(cx, cy, radius, 6),
      
      // Arrows
      arrowRight: () => this.arrow(x, y, width, height, 'right'),
      arrowLeft: () => this.arrow(x, y, width, height, 'left'),
      arrowUp: () => this.arrow(x, y, width, height, 'up'),
      arrowDown: () => this.arrow(x, y, width, height, 'down'),
      
      // Banners
      ribbon: () => this.ribbon(x, y, width, height),
      speechBubble: () => this.speechBubble(x, y, width, height)
    };
    
    if (shapes[name]) {
      return {
        type: 'path',
        pathData: shapes[name](),
        x, y, width, height,
        fill: '#3498db',
        stroke: '#000000',
        strokeWidth: 1
      };
    }
    
    return null;
  }

  /**
   * Get all available shapes
   * @returns {object} - Categories with shape names
   */
  getCategories() {
    return this.categories;
  }
}

module.exports = ShapeLibrary;
