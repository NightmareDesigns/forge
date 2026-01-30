/**
 * Nightmare Designs SVG Forge - Mobile Application
 * Touch-optimized UI for phones and tablets
 */

import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { OrientationPlugin } from '@capacitor/screen-orientation';

class MobileApp {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.currentTool = 'select';
    this.zoom = 1;
    this.objects = [];
    this.selectedObjects = [];
    this.undoStack = [];
    this.redoStack = [];
    
    // Touch handling
    this.isDrawing = false;
    this.touches = [];
    this.lastDistance = 0;
    
    // Canvas state
    this.canvasWidth = 12;
    this.canvasHeight = 12;
    this.dpi = 96;
    
    this.init();
  }

  async init() {
    try {
      // Setup native plugins
      await this.setupNativeFeatures();
      
      // Setup UI
      this.setupDOM();
      this.setupCanvas();
      this.setupTouchListeners();
      this.setupMenuListeners();
      this.setupToolListeners();
      
      this.showToast('Nightmare Designs SVG Forge Ready');
    } catch (error) {
      console.error('Init error:', error);
    }
  }

  async setupNativeFeatures() {
    try {
      // Set status bar
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0d0000' });
      
      // Lock to portrait or allow orientation
      try {
        await OrientationPlugin.lockOrientation({ orientation: 'portrait' });
      } catch (e) {
        console.log('Orientation lock not supported');
      }
      
      // Handle app state
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          this.onAppResume();
        } else {
          this.onAppPause();
        }
      });

      // Handle back button
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp();
        }
      });
    } catch (error) {
      console.log('Native features partially supported');
    }
  }

  setupDOM() {
    // Canvas
    this.canvas = document.getElementById('design-canvas-mobile');
    this.ctx = this.canvas.getContext('2d');
    
    // Menu
    this.menuToggle = document.getElementById('menu-toggle');
    this.menuClose = document.getElementById('menu-close');
    this.menu = document.getElementById('mobile-menu');
    this.menuItems = document.querySelectorAll('.mobile-menu-item');
    
    // Tools
    this.toolBtns = document.querySelectorAll('.mobile-tool-btn');
    this.moreToolsBtn = document.getElementById('mobile-more-tools');
    
    // Panels
    this.rightPanel = document.querySelector('.mobile-right-panel');
    this.panelClose = document.getElementById('mobile-panel-close');
    this.rightPanelBtn = document.getElementById('mobile-help');
    
    // Zoom
    this.zoomInBtn = document.getElementById('zoom-in-mobile');
    this.zoomOutBtn = document.getElementById('zoom-out-mobile');
    this.zoomLevel = document.getElementById('zoom-level-mobile');
    this.fitScreenBtn = document.getElementById('fit-screen-mobile');
    
    // Properties
    this.fillInput = document.getElementById('prop-fill-mobile');
    this.strokeInput = document.getElementById('prop-stroke-mobile');
    this.brushSize = document.getElementById('brush-size-mobile');
    
    // Dialog
    this.dialog = document.getElementById('mobile-dialog');
    this.dialogOverlay = document.getElementById('mobile-dialog-overlay');
    this.dialogClose = document.querySelector('.mobile-dialog-close');
    
    // Toast
    this.toast = document.getElementById('mobile-toast');
  }

  setupCanvas() {
    // Set canvas size
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Initial render
    this.render();
  }

  setupTouchListeners() {
    // Canvas touch events
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    
    // Prevent scroll bouncing
    document.addEventListener('touchmove', (e) => {
      if (e.target === this.canvas) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  setupMenuListeners() {
    this.menuToggle.addEventListener('click', () => this.toggleMenu());
    this.menuClose.addEventListener('click', () => this.toggleMenu());
    
    this.menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleMenuAction(action);
        this.toggleMenu();
      });
    });
    
    // Close menu when clicking outside
    this.menu.addEventListener('click', (e) => {
      if (e.target === this.menu) {
        this.toggleMenu();
      }
    });
  }

  setupToolListeners() {
    this.toolBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tool = e.currentTarget.dataset.tool;
        if (tool === 'shapes') {
          this.showShapeMenu();
        } else if (tool) {
          this.selectTool(tool);
        }
      });
    });
    
    this.moreToolsBtn.addEventListener('click', () => this.showMoreTools());
    
    // Zoom controls
    this.zoomInBtn.addEventListener('click', () => this.zoomIn());
    this.zoomOutBtn.addEventListener('click', () => this.zoomOut());
    this.fitScreenBtn.addEventListener('click', () => this.fitScreen());
    
    // Properties
    this.fillInput.addEventListener('change', (e) => this.updateFill(e.target.value));
    this.strokeInput.addEventListener('change', (e) => this.updateStroke(e.target.value));
    this.brushSize.addEventListener('input', (e) => this.updateBrushSize(e.target.value));
    
    // Panel
    this.rightPanelBtn.addEventListener('click', () => this.toggleRightPanel());
    this.panelClose.addEventListener('click', () => this.toggleRightPanel());
    
    // Dialog
    this.dialogClose.addEventListener('click', () => this.closeDialog());
    this.dialogOverlay.addEventListener('click', () => this.closeDialog());
  }

  // ========== TOUCH HANDLING ==========
  handleTouchStart(e) {
    e.preventDefault();
    this.touches = Array.from(e.touches);
    this.isDrawing = true;
    
    if (this.touches.length === 2) {
      this.lastDistance = this.getDistance(
        this.touches[0].clientX, this.touches[0].clientY,
        this.touches[1].clientX, this.touches[1].clientY
      );
    }
    
    const touch = this.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    this.startDrawing(x, y);
  }

  handleTouchMove(e) {
    e.preventDefault();
    this.touches = Array.from(e.touches);
    
    // Pinch zoom
    if (this.touches.length === 2) {
      const newDistance = this.getDistance(
        this.touches[0].clientX, this.touches[0].clientY,
        this.touches[1].clientX, this.touches[1].clientY
      );
      const delta = newDistance - this.lastDistance;
      
      if (Math.abs(delta) > 10) {
        if (delta > 0) {
          this.zoom *= 1.1;
        } else {
          this.zoom /= 1.1;
        }
        this.zoom = Math.max(0.1, Math.min(5, this.zoom));
        this.updateZoomDisplay();
        this.lastDistance = newDistance;
        this.render();
      }
      return;
    }
    
    const touch = this.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    this.continueDrawing(x, y);
  }

  handleTouchEnd(e) {
    e.preventDefault();
    this.touches = Array.from(e.touches);
    
    if (this.touches.length === 0) {
      this.isDrawing = false;
      this.finishDrawing();
    }
  }

  getDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  // ========== TOOL MANAGEMENT ==========
  selectTool(tool) {
    this.currentTool = tool;
    
    // Update UI
    this.toolBtns.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tool === tool) {
        btn.classList.add('active');
      }
    });
    
    // Update panel visibility
    if (tool === 'text') {
      document.getElementById('font-section-mobile').style.display = 'block';
    } else {
      document.getElementById('font-section-mobile').style.display = 'none';
    }
    
    this.showToast(`Tool: ${tool.charAt(0).toUpperCase() + tool.slice(1)}`);
  }

  showMoreTools() {
    this.showDialog('More Tools', `
      <div class="mobile-tools-grid">
        <button class="mobile-tool-card" data-tool="align">
          <span class="icon">⬌</span>
          <span>Align</span>
        </button>
        <button class="mobile-tool-card" data-tool="distribute">
          <span class="icon">⊢⊣</span>
          <span>Distribute</span>
        </button>
        <button class="mobile-tool-card" data-tool="combine">
          <span class="icon">⊕</span>
          <span>Combine</span>
        </button>
        <button class="mobile-tool-card" data-tool="group">
          <span class="icon">⊞</span>
          <span>Group</span>
        </button>
        <button class="mobile-tool-card" data-tool="rotate">
          <span class="icon">↻</span>
          <span>Rotate</span>
        </button>
        <button class="mobile-tool-card" data-tool="mirror">
          <span class="icon">↔</span>
          <span>Mirror</span>
        </button>
      </div>
    `);
    
    document.querySelectorAll('.mobile-tool-card').forEach(card => {
      card.addEventListener('click', () => {
        this.selectTool(card.dataset.tool);
        this.closeDialog();
      });
    });
  }

  showShapeMenu() {
    this.showDialog('Insert Shape', `
      <div class="mobile-shapes-grid">
        <button class="mobile-shape-btn" data-shape="rectangle">
          <span class="icon">▭</span> Rectangle
        </button>
        <button class="mobile-shape-btn" data-shape="circle">
          <span class="icon">●</span> Circle
        </button>
        <button class="mobile-shape-btn" data-shape="polygon">
          <span class="icon">▲</span> Polygon
        </button>
        <button class="mobile-shape-btn" data-shape="star">
          <span class="icon">★</span> Star
        </button>
        <button class="mobile-shape-btn" data-shape="line">
          <span class="icon">/</span> Line
        </button>
        <button class="mobile-shape-btn" data-shape="bezier">
          <span class="icon">~</span> Curve
        </button>
      </div>
    `);
    
    document.querySelectorAll('.mobile-shape-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.insertShape(btn.dataset.shape);
        this.closeDialog();
      });
    });
  }

  insertShape(shape) {
    // Add shape to canvas
    const newShape = {
      type: shape,
      x: this.canvas.width / 4,
      y: this.canvas.height / 4,
      width: 100,
      height: 100,
      fill: this.fillInput.value,
      stroke: this.strokeInput.value,
    };
    
    this.objects.push(newShape);
    this.showToast(`${shape} added`);
    this.render();
  }

  // ========== MENU ACTIONS ==========
  handleMenuAction(action) {
    switch (action) {
      case 'new-project':
        this.newProject();
        break;
      case 'open-project':
        this.openProject();
        break;
      case 'save-project':
        this.saveProject();
        break;
      case 'export':
        this.showExportMenu();
        break;
      case 'settings':
        this.showSettings();
        break;
      case 'help':
        this.showHelp();
        break;
      case 'about':
        this.showAbout();
        break;
    }
  }

  newProject() {
    if (confirm('Create new project? Unsaved work will be lost.')) {
      this.objects = [];
      this.selectedObjects = [];
      this.render();
      this.showToast('New project created');
    }
  }

  openProject() {
    this.showToast('Open project feature coming soon');
  }

  saveProject() {
    const project = {
      name: prompt('Project name:', 'My Design'),
      objects: this.objects,
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem(`project_${project.name}`, JSON.stringify(project));
    this.showToast(`Saved: ${project.name}`);
  }

  showExportMenu() {
    this.showDialog('Export', `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="mobile-btn" data-export="svg">📤 Export as SVG</button>
        <button class="mobile-btn" data-export="png">📤 Export as PNG</button>
        <button class="mobile-btn" data-export="pdf">📤 Export as PDF</button>
      </div>
    `);
    
    document.querySelectorAll('[data-export]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.exportProject(e.target.dataset.export);
        this.closeDialog();
      });
    });
  }

  exportProject(format) {
    this.showToast(`Exporting as ${format.toUpperCase()}...`);
    // TODO: Implement export functionality
  }

  showSettings() {
    this.showDialog('Settings', `
      <div style="display: flex; flex-direction: column; gap: 15px;">
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Grid Size</label>
          <input type="number" value="10" style="width: 100%; padding: 8px;">
        </div>
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Auto-save Interval</label>
          <input type="number" value="30" style="width: 100%; padding: 8px;"> seconds
        </div>
        <label style="display: flex; align-items: center; gap: 10px;">
          <input type="checkbox" checked>
          Enable Touch Feedback
        </label>
      </div>
    `);
  }

  showHelp() {
    this.showDialog('Quick Guide', `
      <div style="line-height: 1.6; font-size: 14px;">
        <h4 style="color: #ff4444; margin: 10px 0 5px;">Touch Gestures</h4>
        <p>• Single touch: Draw with selected tool</p>
        <p>• Two fingers: Pinch to zoom</p>
        <p>• Long press: Select object</p>
        
        <h4 style="color: #ff4444; margin: 10px 0 5px;">Tools</h4>
        <p>• Select: Choose and move objects</p>
        <p>• Pen: Draw precise paths</p>
        <p>• Draw: Freehand drawing</p>
        <p>• Text: Add text elements</p>
        
        <h4 style="color: #ff4444; margin: 10px 0 5px;">Tips</h4>
        <p>• Tap tool icons at bottom to switch tools</p>
        <p>• Use right panel (?) for properties</p>
        <p>• Save your work regularly</p>
      </div>
    `);
  }

  showAbout() {
    this.showDialog('About', `
      <div style="text-align: center; line-height: 1.8;">
        <h3 style="color: #ff4444; margin: 10px 0;">🖤 Nightmare Designs</h3>
        <h2 style="color: #ff4444; font-size: 24px; margin: 10px 0;">SVG Forge Mobile</h2>
        <p><strong>v0.1.0</strong></p>
        <p style="margin: 15px 0; color: #cccccc; font-size: 13px;">Professional SVG Design & Cutting Software for Creative Professionals</p>
        <hr style="border: 1px solid #3a0000; margin: 15px 0;">
        <p style="font-size: 12px; color: #999;">© 2026 Nightmare Designs</p>
        <p style="font-size: 12px; color: #999;">SVG Forge™ - All rights reserved</p>
      </div>
    `);
  }

  // ========== DRAWING ==========
  startDrawing(x, y) {
    if (this.currentTool === 'select') {
      // Select object at position
      this.selectedObjects = this.objects.filter(obj => this.isPointInObject(x, y, obj));
    } else if (this.currentTool === 'eraser') {
      this.eraseAt(x, y);
    }
  }

  continueDrawing(x, y) {
    if (this.currentTool === 'freehand' && this.isDrawing) {
      this.objects.push({ type: 'point', x, y, size: parseInt(this.brushSize.value), color: this.fillInput.value });
      this.render();
    }
  }

  finishDrawing() {
    this.render();
  }

  eraseAt(x, y) {
    this.objects = this.objects.filter(obj => !this.isPointInObject(x, y, obj));
    this.render();
  }

  isPointInObject(x, y, obj) {
    // Simple bounds check
    const margin = 10;
    return x >= obj.x - margin && x <= obj.x + obj.width + margin &&
           y >= obj.y - margin && y <= obj.y + obj.height + margin;
  }

  // ========== ZOOM ==========
  zoomIn() {
    this.zoom *= 1.2;
    this.zoom = Math.min(5, this.zoom);
    this.updateZoomDisplay();
    this.render();
  }

  zoomOut() {
    this.zoom /= 1.2;
    this.zoom = Math.max(0.1, this.zoom);
    this.updateZoomDisplay();
    this.render();
  }

  fitScreen() {
    this.zoom = 1;
    this.updateZoomDisplay();
    this.render();
  }

  updateZoomDisplay() {
    this.zoomLevel.textContent = Math.round(this.zoom * 100) + '%';
  }

  // ========== PROPERTIES ==========
  updateFill(color) {
    this.selectedObjects.forEach(obj => {
      obj.fill = color;
    });
    this.render();
  }

  updateStroke(color) {
    this.selectedObjects.forEach(obj => {
      obj.stroke = color;
    });
    this.render();
  }

  updateBrushSize(size) {
    document.getElementById('brush-size-value-mobile').textContent = size;
  }

  // ========== RENDERING ==========
  render() {
    // Clear canvas
    this.ctx.fillStyle = '#0d0000';
    this.ctx.fillRect(0, 0, this.canvas.width / window.devicePixelRatio, this.canvas.height / window.devicePixelRatio);
    
    // Draw grid
    this.drawGrid();
    
    // Draw objects
    this.objects.forEach((obj, idx) => {
      this.drawObject(obj, this.selectedObjects.includes(obj));
    });
  }

  drawGrid() {
    this.ctx.strokeStyle = '#1a0000';
    this.ctx.lineWidth = 1;
    const gridSize = 20;
    const canvasWidth = this.canvas.width / window.devicePixelRatio;
    const canvasHeight = this.canvas.height / window.devicePixelRatio;
    
    for (let x = 0; x < canvasWidth; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, canvasHeight);
      this.ctx.stroke();
    }
    
    for (let y = 0; y < canvasHeight; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(canvasWidth, y);
      this.ctx.stroke();
    }
  }

  drawObject(obj, selected) {
    this.ctx.fillStyle = obj.fill || '#ff4444';
    this.ctx.strokeStyle = obj.stroke || '#000000';
    this.ctx.lineWidth = 2;
    
    if (obj.type === 'point') {
      this.ctx.beginPath();
      this.ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (obj.type === 'rectangle') {
      this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
      if (selected) {
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
      }
    } else if (obj.type === 'circle') {
      this.ctx.beginPath();
      this.ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 2, 0, Math.PI * 2);
      this.ctx.fill();
      if (selected) {
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
      }
    }
  }

  // ========== UI HELPERS ==========
  toggleMenu() {
    this.menu.classList.toggle('open');
  }

  toggleRightPanel() {
    this.rightPanel.classList.toggle('open');
  }

  showDialog(title, content) {
    document.getElementById('mobile-dialog-title').textContent = title;
    document.getElementById('mobile-dialog-body').innerHTML = content;
    this.dialog.style.display = 'flex';
    this.dialogOverlay.style.display = 'block';
  }

  closeDialog() {
    this.dialog.style.display = 'none';
    this.dialogOverlay.style.display = 'none';
  }

  showToast(message) {
    this.toast.textContent = message;
    this.toast.classList.add('show');
    
    setTimeout(() => {
      this.toast.classList.remove('show');
    }, 2000);
  }

  onAppResume() {
    console.log('App resumed');
    this.render();
  }

  onAppPause() {
    console.log('App paused');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new MobileApp();
});
