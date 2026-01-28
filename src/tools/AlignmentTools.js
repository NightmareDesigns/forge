/**
 * Nightmare Designs Forge - Alignment & Distribution Tools
 * Align and distribute objects on the canvas
 */

class AlignmentTools {
  /**
   * Get bounding box of multiple objects
   * @param {Array} objects - Array of objects
   * @returns {object} - Combined bounding box
   */
  getBoundingBox(objects) {
    if (!objects || objects.length === 0) return null;
    
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (const obj of objects) {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: minX + (maxX - minX) / 2,
      centerY: minY + (maxY - minY) / 2
    };
  }

  /**
   * Align objects to the left
   * @param {Array} objects - Objects to align
   * @param {object} reference - Reference bounds (optional, uses selection bounds if not provided)
   * @returns {Array} - Modified objects
   */
  alignLeft(objects, reference = null) {
    const bounds = reference || this.getBoundingBox(objects);
    return objects.map(obj => ({
      ...obj,
      x: bounds.x
    }));
  }

  /**
   * Align objects to the right
   */
  alignRight(objects, reference = null) {
    const bounds = reference || this.getBoundingBox(objects);
    const rightEdge = bounds.x + bounds.width;
    return objects.map(obj => ({
      ...obj,
      x: rightEdge - obj.width
    }));
  }

  /**
   * Align objects to horizontal center
   */
  alignCenterH(objects, reference = null) {
    const bounds = reference || this.getBoundingBox(objects);
    return objects.map(obj => ({
      ...obj,
      x: bounds.centerX - obj.width / 2
    }));
  }

  /**
   * Align objects to the top
   */
  alignTop(objects, reference = null) {
    const bounds = reference || this.getBoundingBox(objects);
    return objects.map(obj => ({
      ...obj,
      y: bounds.y
    }));
  }

  /**
   * Align objects to the bottom
   */
  alignBottom(objects, reference = null) {
    const bounds = reference || this.getBoundingBox(objects);
    const bottomEdge = bounds.y + bounds.height;
    return objects.map(obj => ({
      ...obj,
      y: bottomEdge - obj.height
    }));
  }

  /**
   * Align objects to vertical center
   */
  alignCenterV(objects, reference = null) {
    const bounds = reference || this.getBoundingBox(objects);
    return objects.map(obj => ({
      ...obj,
      y: bounds.centerY - obj.height / 2
    }));
  }

  /**
   * Center objects on canvas
   * @param {Array} objects - Objects to center
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  centerOnCanvas(objects, canvasWidth, canvasHeight) {
    const bounds = this.getBoundingBox(objects);
    const offsetX = (canvasWidth - bounds.width) / 2 - bounds.x;
    const offsetY = (canvasHeight - bounds.height) / 2 - bounds.y;
    
    return objects.map(obj => ({
      ...obj,
      x: obj.x + offsetX,
      y: obj.y + offsetY
    }));
  }

  /**
   * Distribute objects horizontally with equal spacing
   * @param {Array} objects - Objects to distribute (minimum 3)
   */
  distributeH(objects) {
    if (objects.length < 3) return objects;
    
    // Sort by x position
    const sorted = [...objects].sort((a, b) => a.x - b.x);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    
    // Calculate total space and object widths
    const totalWidth = (last.x + last.width) - first.x;
    const objectWidths = sorted.reduce((sum, obj) => sum + obj.width, 0);
    const spacing = (totalWidth - objectWidths) / (sorted.length - 1);
    
    let currentX = first.x;
    return sorted.map((obj, i) => {
      const newObj = { ...obj, x: currentX };
      currentX += obj.width + spacing;
      return newObj;
    });
  }

  /**
   * Distribute objects vertically with equal spacing
   */
  distributeV(objects) {
    if (objects.length < 3) return objects;
    
    const sorted = [...objects].sort((a, b) => a.y - b.y);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    
    const totalHeight = (last.y + last.height) - first.y;
    const objectHeights = sorted.reduce((sum, obj) => sum + obj.height, 0);
    const spacing = (totalHeight - objectHeights) / (sorted.length - 1);
    
    let currentY = first.y;
    return sorted.map((obj, i) => {
      const newObj = { ...obj, y: currentY };
      currentY += obj.height + spacing;
      return newObj;
    });
  }

  /**
   * Space objects equally horizontally
   * @param {Array} objects - Objects to space
   * @param {number} spacing - Space between objects in pixels
   */
  spaceH(objects, spacing = 10) {
    const sorted = [...objects].sort((a, b) => a.x - b.x);
    let currentX = sorted[0].x;
    
    return sorted.map(obj => {
      const newObj = { ...obj, x: currentX };
      currentX += obj.width + spacing;
      return newObj;
    });
  }

  /**
   * Space objects equally vertically
   */
  spaceV(objects, spacing = 10) {
    const sorted = [...objects].sort((a, b) => a.y - b.y);
    let currentY = sorted[0].y;
    
    return sorted.map(obj => {
      const newObj = { ...obj, y: currentY };
      currentY += obj.height + spacing;
      return newObj;
    });
  }

  /**
   * Align to canvas edge
   * @param {Array} objects - Objects to align
   * @param {string} edge - 'left', 'right', 'top', 'bottom'
   * @param {number} canvasWidth 
   * @param {number} canvasHeight 
   * @param {number} margin - Margin from edge
   */
  alignToCanvas(objects, edge, canvasWidth, canvasHeight, margin = 0) {
    const bounds = this.getBoundingBox(objects);
    let offsetX = 0, offsetY = 0;
    
    switch (edge) {
      case 'left':
        offsetX = margin - bounds.x;
        break;
      case 'right':
        offsetX = canvasWidth - margin - (bounds.x + bounds.width);
        break;
      case 'top':
        offsetY = margin - bounds.y;
        break;
      case 'bottom':
        offsetY = canvasHeight - margin - (bounds.y + bounds.height);
        break;
    }
    
    return objects.map(obj => ({
      ...obj,
      x: obj.x + offsetX,
      y: obj.y + offsetY
    }));
  }

  /**
   * Match size of objects
   * @param {Array} objects - Objects to resize
   * @param {string} dimension - 'width', 'height', or 'both'
   * @param {string} mode - 'largest', 'smallest', or 'average'
   */
  matchSize(objects, dimension = 'both', mode = 'largest') {
    if (objects.length < 2) return objects;
    
    let targetWidth, targetHeight;
    
    const widths = objects.map(o => o.width);
    const heights = objects.map(o => o.height);
    
    switch (mode) {
      case 'largest':
        targetWidth = Math.max(...widths);
        targetHeight = Math.max(...heights);
        break;
      case 'smallest':
        targetWidth = Math.min(...widths);
        targetHeight = Math.min(...heights);
        break;
      case 'average':
        targetWidth = widths.reduce((a, b) => a + b) / widths.length;
        targetHeight = heights.reduce((a, b) => a + b) / heights.length;
        break;
    }
    
    return objects.map(obj => ({
      ...obj,
      width: (dimension === 'width' || dimension === 'both') ? targetWidth : obj.width,
      height: (dimension === 'height' || dimension === 'both') ? targetHeight : obj.height
    }));
  }
}

module.exports = AlignmentTools;
