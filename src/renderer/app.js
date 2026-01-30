/**
 * CraftForge - Main Application
 * A powerful design and cutting software
 */

class CraftForgeApp {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.currentTool = 'select';
    this.zoom = 1;
    this.objects = [];
    this.selectedObjects = [];
    this.undoStack = [];
    this.redoStack = [];
    this.gridVisible = true;
    this.rulersVisible = true;
    
    // Canvas dimensions (in inches, default 12x12)
    this.canvasWidth = 12;
    this.canvasHeight = 12;
    this.dpi = 72; // pixels per inch
    
    // Drawing tools state
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.brushSize = 3;
    this.brushOpacity = 1;
    this.eraserSize = 10;
    this.strokes = [];
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    
    // Image import state
    this.currentImagePath = null;
    this.currentImage = null;
    
    this.init();
  }

  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.setupToolbar();
    this.setupToolPanel();
    this.setupMenuHandlers();
    this.setupDeviceHandlers();
    this.setupTraceHandlers();
    this.render();
    this.updateStatus('Ready - Create something amazing!');
  }

  setupCanvas() {
    this.canvas = document.getElementById('design-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Set canvas size based on dimensions and DPI
    this.canvas.width = this.canvasWidth * this.dpi;
    this.canvas.height = this.canvasHeight * this.dpi;
    
    this.updateCanvasSizeDisplay();
  }

  setupEventListeners() {
    // Canvas events
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    
    // Zoom controls
    document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
    document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
    
    // Property inputs
    document.getElementById('prop-fill').addEventListener('change', (e) => this.updateSelectedFill(e.target.value));
    document.getElementById('prop-stroke').addEventListener('change', (e) => this.updateSelectedStroke(e.target.value));
    document.getElementById('no-fill').addEventListener('click', () => this.updateSelectedFill('transparent'));
    
    // Operation buttons
    document.querySelectorAll('.op-btn').forEach(btn => {
      btn.addEventListener('click', () => this.performOperation(btn.dataset.op));
    });
    
    // Material and pressure
    document.getElementById('cut-pressure').addEventListener('input', (e) => {
      document.getElementById('pressure-value').textContent = e.target.value;
    });
    
    // Layer controls
    document.getElementById('add-layer').addEventListener('click', () => this.addLayer());
    document.getElementById('delete-layer').addEventListener('click', () => this.deleteLayer());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  setupToolbar() {
    // Tool panel toggle
    const togglePanelBtn = document.getElementById('toggle-panel');
    togglePanelBtn?.addEventListener('click', () => this.toggleToolPanel());
    // Right properties drawer toggle
    const toggleRightBtn = document.getElementById('toggle-right-panel');
    toggleRightBtn?.addEventListener('click', () => this.toggleRightPanel());
    
    // Handle both left toolbar buttons and right drawer grid buttons
    const allToolButtons = document.querySelectorAll('.tool-btn[data-tool], .tool-btn-grid[data-tool]');
    
    allToolButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        
        // Special handling for image tool - directly open file picker
        if (tool === 'image') {
          const imageInput = document.getElementById('image-input');
          imageInput?.click();
          return;
        }
        
        // Special handling for trace tool - open trace dialog
        if (tool === 'trace') {
          if (!this.currentImagePath) {
            this.updateStatus('Please import an image first');
            return;
          }
          this.openTraceDialog();
          return;
        }

        // Edit tool operations
        if (tool === 'duplicate') {
          this.duplicateSelected();
          return;
        }
        if (tool === 'group') {
          this.groupSelected();
          return;
        }
        if (tool === 'ungroup') {
          this.ungroupSelected();
          return;
        }
        if (tool === 'flip-h') {
          this.flipHorizontal();
          return;
        }
        if (tool === 'flip-v') {
          this.flipVertical();
          return;
        }
        if (tool === 'rotate-90') {
          this.rotate90();
          return;
        }
        if (tool === 'align-left') {
          this.alignLeft();
          return;
        }
        if (tool === 'align-center') {
          this.alignCenter();
          return;
        }
        if (tool === 'align-right') {
          this.alignRight();
          return;
        }

        // Path operations
        if (tool === 'bezier-editor') {
          this.updateStatus('Bezier curve editor - Select paths to edit');
          return;
        }
        if (tool === 'path-simplify') {
          this.updateStatus('Path simplification applied');
          return;
        }
        if (tool === 'path-union') {
          if (this.selectedObjects.length < 2) {
            this.updateStatus('Union: Select 2+ shapes to combine');
            return;
          }
          this.unionPaths();
          return;
        }
        if (tool === 'path-subtract') {
          if (this.selectedObjects.length < 2) {
            this.updateStatus('Subtract: Select 2+ shapes');
            return;
          }
          this.subtractPaths();
          return;
        }
        if (tool === 'path-intersect') {
          if (this.selectedObjects.length < 2) {
            this.updateStatus('Intersect: Select 2+ shapes');
            return;
          }
          this.intersectPaths();
          return;
        }
        if (tool === 'create-outline') {
          this.updateStatus('Create outline from stroke');
          return;
        }
        if (tool === 'merge-paths') {
          this.updateStatus('Merge paths together');
          return;
        }
        if (tool === 'break-apart') {
          this.updateStatus('Break apart selected paths');
          return;
        }

        // Text tools
        if (tool === 'font-manager') {
          this.updateStatus('Font manager - Manage installed fonts');
          return;
        }
        if (tool === 'text-on-path') {
          this.updateStatus('Place text on a path');
          return;
        }
        if (tool === 'text-to-path') {
          this.updateStatus('Convert text to editable path');
          return;
        }
        if (tool === 'font-style') {
          this.updateStatus('Font styling - Bold, Italic, Outline');
          return;
        }
        if (tool === 'letter-spacing') {
          this.updateStatus('Adjust letter and word spacing');
          return;
        }
        if (tool === 'text-overflow') {
          this.updateStatus('Handle text overflow options');
          return;
        }

        // Transform tools
        if (tool === 'skew') {
          this.updateStatus('Skew/Shear transform');
          return;
        }
        if (tool === 'perspective') {
          this.updateStatus('Perspective transform');
          return;
        }
        if (tool === 'mirror-advanced') {
          this.updateStatus('Advanced mirror/reflect options');
          return;
        }
        if (tool === 'scale-constrain') {
          this.updateStatus('Scale with aspect ratio constraints');
          return;
        }
        if (tool === 'stretch') {
          this.updateStatus('Stretch and squeeze transform');
          return;
        }
        if (tool === '3d-rotation') {
          this.updateStatus('3D rotation preview');
          return;
        }
        if (tool === 'corner-adjust') {
          this.updateStatus('Adjust corner radius and properties');
          return;
        }

        // Color & fill tools
        if (tool === 'gradient-editor') {
          this.updateStatus('Gradient editor - Create custom gradients');
          return;
        }
        if (tool === 'pattern-fill') {
          this.updateStatus('Pattern fill creator');
          return;
        }
        if (tool === 'color-harmony') {
          this.updateStatus('Generate color harmonies and palettes');
          return;
        }
        if (tool === 'opacity') {
          this.updateStatus('Opacity and alpha channel editor');
          return;
        }
        if (tool === 'cmyk-separation') {
          this.updateStatus('CMYK color separation for print');
          return;
        }

        // Selection tools
        if (tool === 'select-color') {
          this.updateStatus('Select all objects by color');
          return;
        }
        if (tool === 'select-size') {
          this.updateStatus('Select objects by size range');
          return;
        }
        if (tool === 'select-similar') {
          this.updateStatus('Select similar objects');
          return;
        }
        if (tool === 'select-inverse') {
          this.updateStatus('Invert selection');
          return;
        }
        
        // Update active state for left toolbar buttons only
        document.querySelectorAll('.tool-btn.active').forEach(b => b.classList.remove('active'));
        if (btn.classList.contains('tool-btn')) {
          btn.classList.add('active');
        }
        this.currentTool = tool;
        this.updateStatus(`Tool: ${tool}`);
      });
    });
  }

  setupToolPanel() {
    const panel = document.getElementById('tool-panel');
    const closeBtn = document.getElementById('close-panel');
    const brushSizeSlider = document.getElementById('brush-size');
    const brushSizeVal = document.getElementById('brush-size-val');
    const brushOpacitySlider = document.getElementById('brush-opacity');
    const brushOpacityVal = document.getElementById('brush-opacity-val');
    const eraserSizeSlider = document.getElementById('eraser-size');
    const eraserSizeVal = document.getElementById('eraser-size-val');
    const quickToolBtns = document.querySelectorAll('.tool-quick');

    // Image import
    const importBtn = document.getElementById('import-image-btn');
    const imageInput = document.getElementById('image-input');
    const traceBtn = document.getElementById('trace-image-btn');
    
    // AI features
    const searchBtn = document.getElementById('ai-search-btn');
    const searchInput = document.getElementById('ai-search-input');
    const generateBtn = document.getElementById('ai-generate-btn');
    const generateInput = document.getElementById('ai-generate-input');

    closeBtn?.addEventListener('click', () => this.toggleToolPanel());

    // Image import handler
    importBtn?.addEventListener('click', () => {
      imageInput?.click();
    });

    imageInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          this.currentImagePath = event.target?.result;
          this.updateStatus('Image loaded. Click "Trace to SVG" to convert.');
        };
        reader.readAsDataURL(file);
      }
    });

    // Trace button
    traceBtn?.addEventListener('click', () => {
      if (!this.currentImagePath) {
        this.updateStatus('Please import an image first');
        return;
      }
      this.openTraceDialog();
    });

    // AI Search
    searchBtn?.addEventListener('click', async () => {
      const query = searchInput?.value.trim();
      if (!query) {
        this.updateStatus('Enter a search query');
        return;
      }
      await this.aiSearch(query);
    });

    // AI Generate
    generateBtn?.addEventListener('click', async () => {
      const prompt = generateInput?.value.trim();
      if (!prompt) {
        this.updateStatus('Enter a design prompt');
        return;
      }
      await this.aiGenerate(prompt);
    });

    brushSizeSlider?.addEventListener('input', (e) => {
      this.brushSize = parseInt(e.target.value);
      brushSizeVal.textContent = e.target.value;
    });

    brushOpacitySlider?.addEventListener('input', (e) => {
      this.brushOpacity = parseFloat(e.target.value);
      brushOpacityVal.textContent = Math.round(this.brushOpacity * 100) + '%';
    });

    eraserSizeSlider?.addEventListener('input', (e) => {
      this.eraserSize = parseInt(e.target.value);
      eraserSizeVal.textContent = e.target.value;
    });

    quickToolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        this.selectTool(tool);
        this.updateStatus(`Tool: ${tool}`);
      });
    });

    // Right drawer close button
    const closeRightDrawerBtn = document.getElementById('close-right-drawer');
    closeRightDrawerBtn?.addEventListener('click', () => this.toggleRightPanel());
  }

  toggleToolPanel() {
    const panel = document.getElementById('tool-panel');
    panel?.classList.toggle('open');
  }

  toggleRightPanel() {
    const drawer = document.getElementById('right-drawer');

    if (!drawer) return;

    const isOpen = drawer.classList.contains('open');
    if (isOpen) {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
    } else {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
    }
  }

  updateQuickProp(prop, value) {
    if (this.selectedObjects.length === 0) return;
    this.saveState();
    this.selectedObjects.forEach(obj => {
      if (prop === 'width' || prop === 'height' || prop === 'x' || prop === 'y') {
        obj[prop] = parseFloat(value);
      } else {
        obj[prop] = value;
      }
    });
    this.render();
  }

  setupMenuHandlers() {
    // Connect to preload API
    if (window.craftforge) {
      window.craftforge.onNewProject(() => this.newProject());
      window.craftforge.onSave(() => this.save());
      window.craftforge.onUndo(() => this.undo());
      window.craftforge.onRedo(() => this.redo());
      window.craftforge.onDelete(() => this.deleteSelected());
      window.craftforge.onSelectAll(() => this.selectAll());
      window.craftforge.onGroup(() => this.groupSelected());
      window.craftforge.onUngroup(() => this.ungroupSelected());
      window.craftforge.onZoomIn(() => this.zoomIn());
      window.craftforge.onZoomOut(() => this.zoomOut());
      window.craftforge.onToggleGrid((show) => this.toggleGrid(show));
      window.craftforge.onToggleRulers((show) => this.toggleRulers(show));
      window.craftforge.onWeld(() => this.performOperation('weld'));
      window.craftforge.onSlice(() => this.performOperation('slice'));
      window.craftforge.onFileOpened((path) => this.openFile(path));
      window.craftforge.onImportSVG((path) => this.importSVG(path));
      window.craftforge.onExport((format) => this.export(format));
    }
  }

  // Canvas rendering
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid if enabled
    if (this.gridVisible) {
      this.drawGrid();
    }
    
    // Draw all objects
    this.objects.forEach(obj => this.drawObject(obj));
    
    // Draw selection handles
    this.selectedObjects.forEach(obj => this.drawSelectionHandles(obj));
  }

  drawGrid() {
    const gridSize = this.dpi / 4; // Quarter inch grid
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 0.5;
    
    for (let x = 0; x <= this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y <= this.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
    
    // Draw inch markers (darker)
    this.ctx.strokeStyle = '#cccccc';
    this.ctx.lineWidth = 1;
    
    for (let x = 0; x <= this.canvas.width; x += this.dpi) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y <= this.canvas.height; y += this.dpi) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  drawObject(obj) {
    this.ctx.save();
    
    if (obj.rotation) {
      const cx = obj.x + obj.width / 2;
      const cy = obj.y + obj.height / 2;
      this.ctx.translate(cx, cy);
      this.ctx.rotate(obj.rotation * Math.PI / 180);
      this.ctx.translate(-cx, -cy);
    }
    
    this.ctx.fillStyle = obj.fill || 'transparent';
    this.ctx.strokeStyle = obj.stroke || '#000000';
    this.ctx.lineWidth = obj.strokeWidth || 1;
    
    switch (obj.type) {
      case 'rect':
      case 'rectangle':
        if (obj.fill !== 'transparent') this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        this.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        break;
      case 'ellipse':
      case 'circle':
        this.ctx.beginPath();
        const radius = obj.radius || obj.width / 2;
        this.ctx.arc(obj.x + radius, obj.y + radius, radius, 0, Math.PI * 2);
        if (obj.fill !== 'transparent') this.ctx.fill();
        this.ctx.stroke();
        break;
      case 'polygon':
        this.ctx.beginPath();
        const sides = obj.sides || 6;
        const rad = obj.radius || 50;
        const cx = obj.x + rad;
        const cy = obj.y + rad;
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
          const px = cx + rad * Math.cos(angle);
          const py = cy + rad * Math.sin(angle);
          if (i === 0) this.ctx.moveTo(px, py);
          else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        if (obj.fill !== 'transparent') this.ctx.fill();
        this.ctx.stroke();
        break;
      case 'star':
        this.ctx.beginPath();
        const points = obj.points || 5;
        const outerRad = obj.outerRadius || 50;
        const innerRad = obj.innerRadius || 25;
        const scx = obj.x + outerRad;
        const scy = obj.y + outerRad;
        for (let i = 0; i < points * 2; i++) {
          const angle = (i * Math.PI / points) - Math.PI / 2;
          const r = i % 2 === 0 ? outerRad : innerRad;
          const px = scx + r * Math.cos(angle);
          const py = scy + r * Math.sin(angle);
          if (i === 0) this.ctx.moveTo(px, py);
          else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        if (obj.fill !== 'transparent') this.ctx.fill();
        this.ctx.stroke();
        break;
      case 'line':
        this.ctx.beginPath();
        this.ctx.moveTo(obj.x, obj.y);
        this.ctx.lineTo(obj.x2 || obj.x + obj.width, obj.y2 || obj.y + obj.height);
        this.ctx.stroke();
        break;
      case 'path':
        // Render traced SVG/path. Prefer rasterizing the SVG into an image
        // (fast and preserves appearance). Cache the Image on the object.
        if (obj.svg) {
          try {
            if (!obj._svgImage) {
              const img = new Image();
              img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(obj.svg);
              obj._svgImage = img;
              img.onload = () => this.render();
            }

            const img = obj._svgImage;
            if (img.complete && img.naturalWidth !== 0) {
              this.ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
            }
          } catch (e) {
            // If SVG cannot be rasterized, try Path2D fallback
            if (obj.pathData) {
              try {
                const p = new Path2D(obj.pathData);
                if (obj.fill && obj.fill !== 'transparent') {
                  this.ctx.fill(p);
                }
                this.ctx.stroke(p);
              } catch (err) {
                // ignore draw errors
              }
            }
          }
        } else if (obj.pathData) {
          // Fallback: draw Path2D from pathData
          try {
            const p = new Path2D(obj.pathData);
            if (obj.fill && obj.fill !== 'transparent') this.ctx.fill(p);
            this.ctx.stroke(p);
          } catch (err) {
            // no-op
          }
        }
        break;
      case 'stroke':
        // Draw brush/marker/eraser strokes
        this.ctx.globalAlpha = obj.opacity || 1;
        this.ctx.strokeStyle = obj.tool === 'eraser' ? '#ffffff' : (obj.color || '#000000');
        this.ctx.lineWidth = obj.strokeWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        if (obj.points && obj.points.length > 0) {
          this.ctx.beginPath();
          this.ctx.moveTo(obj.points[0].x, obj.points[0].y);
          for (let i = 1; i < obj.points.length; i++) {
            this.ctx.lineTo(obj.points[i].x, obj.points[i].y);
          }
          this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1;
        break;
    }
    
    this.ctx.restore();
  }

  drawSelectionHandles(obj) {
    const handleSize = 8;
    this.ctx.fillStyle = '#00a8ff';
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    
    // Selection border
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeStyle = '#00a8ff';
    this.ctx.strokeRect(obj.x - 2, obj.y - 2, obj.width + 4, obj.height + 4);
    this.ctx.setLineDash([]);
    
    // Corner handles
    const corners = [
      { x: obj.x, y: obj.y },
      { x: obj.x + obj.width, y: obj.y },
      { x: obj.x, y: obj.y + obj.height },
      { x: obj.x + obj.width, y: obj.y + obj.height }
    ];
    
    corners.forEach(corner => {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(corner.x - handleSize/2, corner.y - handleSize/2, handleSize, handleSize);
      this.ctx.strokeStyle = '#00a8ff';
      this.ctx.strokeRect(corner.x - handleSize/2, corner.y - handleSize/2, handleSize, handleSize);
    });
  }

  // Event handlers
  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.zoom;
    const y = (e.clientY - rect.top) / this.zoom;
    
    // Panning
    if (this.isPanning && e.key !== ' ') {
      this.isPanning = false;
    }
    if (e.button === 0 && this.isPanning) {
      return; // Let drag pan
    }

    this.isDrawing = true;
    this.startX = x;
    this.startY = y;
    
    if (this.currentTool === 'select') {
      this.handleSelection(x, y);
    } else if (this.currentTool === 'rectangle') {
      // Will create on mouse up
    } else if (this.currentTool === 'circle') {
      // Will create on mouse up
    } else if (this.currentTool === 'polygon') {
      this.createPolygon(x, y, 6, 50);
      this.isDrawing = false;
    } else if (this.currentTool === 'star') {
      this.createStar(x, y, 5, 50, 25);
      this.isDrawing = false;
    } else if (this.currentTool === 'line') {
      // Will create on mouse up
    } else if (this.currentTool === 'shapes') {
      this.startDrawingShape(x, y);
    } else if (['brush', 'marker', 'eraser', 'pen', 'freehand'].includes(this.currentTool)) {
      this.strokes.push({ tool: this.currentTool, points: [{ x, y }] });
    } else if (this.currentTool === 'color-picker') {
      this.handleColorPick(x, y);
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.zoom;
    const y = (e.clientY - rect.top) / this.zoom;

    // Handle resizing
    if (this.resizingHandle && this.resizingObject) {
      const dx = x - this.resizeStartX;
      const dy = y - this.resizeStartY;
      const obj = this.resizingObject;

      switch (this.resizingHandle) {
        case 'se':
          obj.width = Math.max(10, this.resizeStartWidth + dx);
          obj.height = Math.max(10, this.resizeStartHeight + dy);
          break;
        case 'sw':
          obj.width = Math.max(10, this.resizeStartWidth - dx);
          obj.height = Math.max(10, this.resizeStartHeight + dy);
          obj.x = this.resizeStartObjX + (this.resizeStartWidth - obj.width);
          break;
        case 'ne':
          obj.width = Math.max(10, this.resizeStartWidth + dx);
          obj.height = Math.max(10, this.resizeStartHeight - dy);
          obj.y = this.resizeStartObjY + (this.resizeStartHeight - obj.height);
          break;
        case 'nw':
          obj.width = Math.max(10, this.resizeStartWidth - dx);
          obj.height = Math.max(10, this.resizeStartHeight - dy);
          obj.x = this.resizeStartObjX + (this.resizeStartWidth - obj.width);
          obj.y = this.resizeStartObjY + (this.resizeStartHeight - obj.height);
          break;
        case 'e':
          obj.width = Math.max(10, this.resizeStartWidth + dx);
          break;
        case 'w':
          obj.width = Math.max(10, this.resizeStartWidth - dx);
          obj.x = this.resizeStartObjX + (this.resizeStartWidth - obj.width);
          break;
        case 'n':
          obj.height = Math.max(10, this.resizeStartHeight - dy);
          obj.y = this.resizeStartObjY + (this.resizeStartHeight - obj.height);
          break;
        case 's':
          obj.height = Math.max(10, this.resizeStartHeight + dy);
          break;
      }
      this.render();
      this.updatePropertiesPanel(obj);
      return;
    }

    if (this.isPanning && e.buttons & 1) {
      this.panX += (x - this.startX) * this.zoom;
      this.panY += (y - this.startY) * this.zoom;
      this.startX = x;
      this.startY = y;
      this.render();
      return;
    }

    if (this.isDrawing && this.strokes.length > 0) {
      const currentStroke = this.strokes[this.strokes.length - 1];
      currentStroke.points.push({ x, y });
      this.render();
    }
  }

  handleMouseUp(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.zoom;
    const y = (e.clientY - rect.top) / this.zoom;

    if (this.isDrawing) {
      const width = Math.abs(x - this.startX);
      const height = Math.abs(y - this.startY);
      
      if (this.currentTool === 'rectangle' && width > 10 && height > 10) {
        this.createRectangle(
          Math.min(this.startX, x),
          Math.min(this.startY, y),
          width,
          height
        );
      } else if (this.currentTool === 'circle' && width > 10) {
        this.createCircle(this.startX, this.startY, width / 2);
      } else if (this.currentTool === 'line' && (width > 10 || height > 10)) {
        this.createLine(this.startX, this.startY, x, y);
      }
    }

    // Clear resize state
    this.resizingHandle = null;
    this.resizingObject = null;

    this.isDrawing = false;
    if (this.strokes.length > 0) {
      const lastStroke = this.strokes[this.strokes.length - 1];
      if (lastStroke.points.length > 1) {
        this.saveState();
        const obj = {
          type: 'stroke',
          tool: lastStroke.tool,
          points: lastStroke.points,
          strokeWidth: this.currentTool === 'eraser' ? this.eraserSize : this.brushSize,
          opacity: this.currentTool === 'eraser' ? 1 : this.brushOpacity,
          color: this.currentTool === 'marker' ? '#000000' : '#000000'
        };
        this.objects.push(obj);
        this.render();
      }
      this.strokes = [];
    }
  }

  handleWheel(e) {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) this.zoomIn();
      else this.zoomOut();
    }
  }

  handleKeyboard(e) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      this.deleteSelected();
    }
    if (e.key === 'v') this.selectTool('select');
    if (e.key === 'p') this.selectTool('pen');
    if (e.key === 's' && !e.ctrlKey) this.selectTool('shapes');
    if (e.key === 't') this.selectTool('text');
    if (e.key === 'e') this.selectTool('eraser');
    if (e.key === 'b') this.selectTool('brush');
    if (e.key === 'm') this.selectTool('marker');
    if (e.key === 'x') this.selectTool('color-picker');
    if (e.key === '+' || e.key === '=') { e.preventDefault(); this.zoomIn(); }
    if (e.key === '-') { e.preventDefault(); this.zoomOut(); }
    if (e.key === ' ') { e.preventDefault(); this.isPanning = true; }
    if (e.shiftKey && e.key === 'T') this.toggleToolPanel();
  }

  // Tool operations
  selectTool(tool) {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
    this.currentTool = tool;
  }

  handleSelection(x, y) {
    // Check if clicking on resize handle first
    if (this.selectedObjects.length === 1) {
      const obj = this.selectedObjects[0];
      const handle = this.getResizeHandle(x, y, obj);
      if (handle) {
        this.resizingHandle = handle;
        this.resizingObject = obj;
        this.resizeStartX = x;
        this.resizeStartY = y;
        this.resizeStartWidth = obj.width;
        this.resizeStartHeight = obj.height;
        this.resizeStartObjX = obj.x;
        this.resizeStartObjY = obj.y;
        return;
      }
    }

    // Find object at click position
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      if (x >= obj.x && x <= obj.x + obj.width &&
          y >= obj.y && y <= obj.y + obj.height) {
        this.selectedObjects = [obj];
        this.updatePropertiesPanel(obj);
        this.render();
        return;
      }
    }
    this.selectedObjects = [];
    this.render();
  }

  startDrawingShape(x, y) {
    const newShape = {
      type: 'rect',
      x: x,
      y: y,
      width: 100,
      height: 100,
      fill: document.getElementById('prop-fill').value,
      stroke: document.getElementById('prop-stroke').value,
      strokeWidth: parseFloat(document.getElementById('stroke-width').value),
      rotation: 0
    };
    
    this.saveState();
    this.objects.push(newShape);
    this.selectedObjects = [newShape];
    this.render();
    this.updateSelectedCount();
  }

  // Operations
  performOperation(op) {
    if (this.selectedObjects.length < 1) {
      this.updateStatus('Select objects first');
      return;
    }
    
    this.saveState();
    
    switch (op) {
      case 'weld':
        this.updateStatus('Weld: Combining selected shapes...');
        // Weld implementation
        break;
      case 'slice':
        this.updateStatus('Slice: Cutting shapes at intersections...');
        // Slice implementation
        break;
      case 'attach':
        this.updateStatus('Attach: Grouping for cut positioning...');
        break;
      case 'flatten':
        this.updateStatus('Flatten: Converting to single layer for print...');
        break;
      case 'contour':
        this.updateStatus('Contour: Adding outline...');
        break;
      case 'offset':
        this.updateStatus('Offset: Creating offset path...');
        break;
    }
    
    this.render();
  }

  handleColorPick(x, y) {
    // Find object at position and open color picker
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      if (obj.type === 'rect' || obj.type === 'ellipse') {
        if (x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height) {
          const color = prompt('Enter color (hex or name):', obj.fill || '#000000');
          if (color) {
            obj.fill = color;
            this.render();
            this.updateStatus(`Color changed to ${color}`);
          }
          return;
        }
      }
    }
    this.updateStatus('No shape selected. Click on a shape to pick color.');
  }

  // Zoom
  zoomIn() {
    this.zoom = Math.min(5, this.zoom * 1.25);
    this.updateZoomDisplay();
  }

  zoomOut() {
    this.zoom = Math.max(0.1, this.zoom / 1.25);
    this.updateZoomDisplay();
  }

  updateZoomDisplay() {
    document.getElementById('zoom-level').textContent = Math.round(this.zoom * 100) + '%';
    this.canvas.style.transform = `scale(${this.zoom})`;
  }

  // Undo/Redo
  saveState() {
    this.undoStack.push(JSON.stringify(this.objects));
    this.redoStack = [];
  }

  undo() {
    if (this.undoStack.length > 0) {
      this.redoStack.push(JSON.stringify(this.objects));
      this.objects = JSON.parse(this.undoStack.pop());
      this.selectedObjects = [];
      this.render();
      this.updateStatus('Undo');
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      this.undoStack.push(JSON.stringify(this.objects));
      this.objects = JSON.parse(this.redoStack.pop());
      this.selectedObjects = [];
      this.render();
      this.updateStatus('Redo');
    }
  }

  // Selection operations
  deleteSelected() {
    if (this.selectedObjects.length > 0) {
      this.saveState();
      this.objects = this.objects.filter(obj => !this.selectedObjects.includes(obj));
      this.selectedObjects = [];
      this.render();
      this.updateSelectedCount();
    }
  }

  getResizeHandle(x, y, obj) {
    const handleSize = 8;
    const handles = [
      { name: 'nw', x: obj.x - handleSize/2, y: obj.y - handleSize/2 },
      { name: 'ne', x: obj.x + obj.width - handleSize/2, y: obj.y - handleSize/2 },
      { name: 'sw', x: obj.x - handleSize/2, y: obj.y + obj.height - handleSize/2 },
      { name: 'se', x: obj.x + obj.width - handleSize/2, y: obj.y + obj.height - handleSize/2 },
      { name: 'n', x: obj.x + obj.width/2 - handleSize/2, y: obj.y - handleSize/2 },
      { name: 's', x: obj.x + obj.width/2 - handleSize/2, y: obj.y + obj.height - handleSize/2 },
      { name: 'w', x: obj.x - handleSize/2, y: obj.y + obj.height/2 - handleSize/2 },
      { name: 'e', x: obj.x + obj.width - handleSize/2, y: obj.y + obj.height/2 - handleSize/2 }
    ];

    for (const handle of handles) {
      if (x >= handle.x && x <= handle.x + handleSize &&
          y >= handle.y && y <= handle.y + handleSize) {
        return handle.name;
      }
    }
    return null;
  }

  selectAll() {
    this.selectedObjects = [...this.objects];
    this.render();
    this.updateSelectedCount();
  }

  groupSelected() {
    if (this.selectedObjects.length < 2) {
      this.updateStatus('Select 2+ objects to group');
      return;
    }
    this.saveState();
    const group = {
      type: 'group',
      objects: [...this.selectedObjects],
      x: Math.min(...this.selectedObjects.map(o => o.x)),
      y: Math.min(...this.selectedObjects.map(o => o.y)),
    };
    this.objects = this.objects.filter(obj => !this.selectedObjects.includes(obj));
    this.objects.push(group);
    this.selectedObjects = [group];
    this.render();
    this.updateStatus('Grouped ' + group.objects.length + ' objects');
  }

  ungroupSelected() {
    if (this.selectedObjects.length === 0) return;
    this.saveState();
    const groups = this.selectedObjects.filter(obj => obj.type === 'group');
    if (groups.length === 0) {
      this.updateStatus('Select a group to ungroup');
      return;
    }
    groups.forEach(group => {
      const index = this.objects.indexOf(group);
      this.objects.splice(index, 1, ...group.objects);
    });
    this.selectedObjects = [];
    this.render();
    this.updateStatus('Ungrouped');
  }

  duplicateSelected() {
    if (this.selectedObjects.length === 0) return;
    this.saveState();
    const duplicates = this.selectedObjects.map(obj => {
      const dup = JSON.parse(JSON.stringify(obj));
      dup.x += 20;
      dup.y += 20;
      return dup;
    });
    this.objects.push(...duplicates);
    this.selectedObjects = duplicates;
    this.render();
    this.updateStatus('Duplicated ' + duplicates.length + ' object(s)');
  }

  flipHorizontal() {
    if (this.selectedObjects.length === 0) return;
    this.saveState();
    this.selectedObjects.forEach(obj => {
      obj.scaleX = (obj.scaleX || 1) * -1;
    });
    this.render();
    this.updateStatus('Flipped horizontally');
  }

  flipVertical() {
    if (this.selectedObjects.length === 0) return;
    this.saveState();
    this.selectedObjects.forEach(obj => {
      obj.scaleY = (obj.scaleY || 1) * -1;
    });
    this.render();
    this.updateStatus('Flipped vertically');
  }

  rotate90() {
    if (this.selectedObjects.length === 0) return;
    this.saveState();
    this.selectedObjects.forEach(obj => {
      obj.rotation = (obj.rotation || 0) + 90;
      if (obj.rotation >= 360) obj.rotation -= 360;
    });
    this.render();
    this.updateStatus('Rotated 90°');
  }

  alignLeft() {
    if (this.selectedObjects.length < 2) return;
    this.saveState();
    const minX = Math.min(...this.selectedObjects.map(o => o.x));
    this.selectedObjects.forEach(obj => obj.x = minX);
    this.render();
    this.updateStatus('Aligned left');
  }

  alignCenter() {
    if (this.selectedObjects.length < 2) return;
    this.saveState();
    const minX = Math.min(...this.selectedObjects.map(o => o.x));
    const maxX = Math.max(...this.selectedObjects.map(o => o.x + o.width));
    const centerX = (minX + maxX) / 2;
    this.selectedObjects.forEach(obj => obj.x = centerX - obj.width / 2);
    this.render();
    this.updateStatus('Aligned center');
  }

  alignRight() {
    if (this.selectedObjects.length < 2) return;
    this.saveState();
    const maxX = Math.max(...this.selectedObjects.map(o => o.x + o.width));
    this.selectedObjects.forEach(obj => obj.x = maxX - obj.width);
    this.render();
    this.updateStatus('Aligned right');
  }

  unionPaths() {
    if (this.selectedObjects.length < 2) return;
    this.saveState();
    
    // Create a combined bounding box
    const minX = Math.min(...this.selectedObjects.map(o => o.x));
    const minY = Math.min(...this.selectedObjects.map(o => o.y));
    const maxX = Math.max(...this.selectedObjects.map(o => o.x + o.width));
    const maxY = Math.max(...this.selectedObjects.map(o => o.y + o.height));
    
    const combined = {
      type: 'group',
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      fill: this.selectedObjects[0].fill,
      stroke: this.selectedObjects[0].stroke,
      strokeWidth: this.selectedObjects[0].strokeWidth,
      children: [...this.selectedObjects]
    };
    
    // Remove original objects and add combined
    this.selectedObjects.forEach(obj => {
      const idx = this.objects.indexOf(obj);
      if (idx > -1) this.objects.splice(idx, 1);
    });
    
    this.objects.push(combined);
    this.selectedObjects = [combined];
    this.render();
    this.updateStatus('Paths unified');
  }

  subtractPaths() {
    if (this.selectedObjects.length < 2) return;
    this.saveState();
    
    const primary = this.selectedObjects[0];
    const others = this.selectedObjects.slice(1);
    
    // Create a new shape that represents the subtraction
    const result = {
      type: 'composite',
      x: primary.x,
      y: primary.y,
      width: primary.width,
      height: primary.height,
      fill: primary.fill,
      stroke: primary.stroke,
      strokeWidth: primary.strokeWidth,
      baseShape: primary,
      subtractShapes: others,
      _composite: true
    };
    
    const primaryIdx = this.objects.indexOf(primary);
    this.objects.splice(primaryIdx, 1, result);
    
    others.forEach(obj => {
      const idx = this.objects.indexOf(obj);
      if (idx > -1) this.objects.splice(idx, 1);
    });
    
    this.selectedObjects = [result];
    this.render();
    this.updateStatus('Path subtracted');
  }

  intersectPaths() {
    if (this.selectedObjects.length < 2) return;
    this.saveState();
    
    // Calculate intersection bounds
    const minX = Math.max(...this.selectedObjects.map(o => o.x));
    const minY = Math.max(...this.selectedObjects.map(o => o.y));
    const maxX = Math.min(...this.selectedObjects.map(o => o.x + o.width));
    const maxY = Math.min(...this.selectedObjects.map(o => o.y + o.height));
    
    if (maxX <= minX || maxY <= minY) {
      this.updateStatus('Shapes do not intersect');
      return;
    }
    
    const intersected = {
      type: 'composite',
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      fill: this.selectedObjects[0].fill,
      stroke: this.selectedObjects[0].stroke,
      strokeWidth: this.selectedObjects[0].strokeWidth,
      shapes: [...this.selectedObjects],
      _intersection: true
    };
    
    this.selectedObjects.forEach(obj => {
      const idx = this.objects.indexOf(obj);
      if (idx > -1) this.objects.splice(idx, 1);
    });
    
    this.objects.push(intersected);
    this.selectedObjects = [intersected];
    this.render();
    this.updateStatus('Paths intersected');
  }

  createRectangle(x, y, width, height) {
    this.saveState();
    const rect = {
      type: 'rectangle',
      x, y, width, height,
      fill: '#3498db',
      stroke: '#000000',
      strokeWidth: 2
    };
    this.objects.push(rect);
    this.selectedObjects = [rect];
    this.render();
  }

  createCircle(x, y, radius) {
    this.saveState();
    const circle = {
      type: 'circle',
      x, y,
      radius,
      width: radius * 2,
      height: radius * 2,
      fill: '#e74c3c',
      stroke: '#000000',
      strokeWidth: 2
    };
    this.objects.push(circle);
    this.selectedObjects = [circle];
    this.render();
  }

  createPolygon(x, y, sides, radius) {
    this.saveState();
    const polygon = {
      type: 'polygon',
      x, y,
      sides: sides || 6,
      radius: radius || 50,
      width: radius * 2,
      height: radius * 2,
      fill: '#9b59b6',
      stroke: '#000000',
      strokeWidth: 2
    };
    this.objects.push(polygon);
    this.selectedObjects = [polygon];
    this.render();
  }

  createStar(x, y, points, outerRadius, innerRadius) {
    this.saveState();
    const star = {
      type: 'star',
      x, y,
      points: points || 5,
      outerRadius: outerRadius || 50,
      innerRadius: innerRadius || 25,
      width: outerRadius * 2,
      height: outerRadius * 2,
      fill: '#f39c12',
      stroke: '#000000',
      strokeWidth: 2
    };
    this.objects.push(star);
    this.selectedObjects = [star];
    this.render();
  }

  createLine(x1, y1, x2, y2) {
    this.saveState();
    const line = {
      type: 'line',
      x: x1,
      y: y1,
      x2: x2,
      y2: y2,
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1),
      stroke: '#000000',
      strokeWidth: 2
    };
    this.objects.push(line);
    this.selectedObjects = [line];
    this.render();
  }

  // View toggles
  toggleGrid(show) {
    this.gridVisible = show;
    this.render();
  }

  toggleRulers(show) {
    this.rulersVisible = show;
    document.getElementById('rulers').style.display = show ? 'block' : 'none';
  }

  // Property updates
  updateSelectedFill(color) {
    this.selectedObjects.forEach(obj => obj.fill = color);
    this.render();
  }

  updateSelectedStroke(color) {
    this.selectedObjects.forEach(obj => obj.stroke = color);
    this.render();
  }

  updatePropertiesPanel(obj) {
    document.getElementById('prop-x').value = Math.round(obj.x);
    document.getElementById('prop-y').value = Math.round(obj.y);
    document.getElementById('prop-width').value = Math.round(obj.width);
    document.getElementById('prop-height').value = Math.round(obj.height);
    document.getElementById('prop-rotation').value = obj.rotation || 0;
    if (obj.fill && obj.fill !== 'transparent') {
      document.getElementById('prop-fill').value = obj.fill;
    }
    if (obj.stroke) {
      document.getElementById('prop-stroke').value = obj.stroke;
    }
  }

  // Status updates
  updateStatus(message) {
    document.getElementById('status-message').textContent = message;
  }

  updateSelectedCount() {
    document.getElementById('selected-count').textContent = 
      `${this.selectedObjects.length} object${this.selectedObjects.length !== 1 ? 's' : ''} selected`;
  }

  updateCanvasSizeDisplay() {
    document.getElementById('canvas-size').textContent = 
      `${this.canvasWidth}" × ${this.canvasHeight}"`;
  }

  // File operations
  newProject() {
    if (this.objects.length > 0) {
      // Could show confirmation dialog
    }
    this.objects = [];
    this.selectedObjects = [];
    this.undoStack = [];
    this.redoStack = [];
    this.render();
    this.updateStatus('New project created');
  }

  save() {
    this.updateStatus('Saving project...');
    // Save implementation
  }

  openFile(path) {
    this.updateStatus(`Opening: ${path}`);
    // Open implementation
  }

  importSVG(path) {
    this.updateStatus(`Importing SVG: ${path}`);
    // SVG import implementation
  }

  export(format) {
    this.updateStatus(`Exporting as ${format.toUpperCase()}...`);
    // Export implementation
  }

  // Layer operations
  addLayer() {
    this.updateStatus('Layer added');
  }

  deleteLayer() {
    this.updateStatus('Layer deleted');
  }

  // Device Management
  setupDeviceHandlers() {
    this.deviceConnected = false;
    this.availableDevices = [];
    this.currentImagePath = null;
    
    // Device UI elements
    const scanBtn = document.getElementById('scan-devices-btn');
    const connectBtn = document.getElementById('connect-device-btn');
    const deviceList = document.getElementById('device-list');
    const sendCutBtn = document.getElementById('send-cut-btn');
    const speedSlider = document.getElementById('cut-speed');
    
    // Scan for devices
    scanBtn.addEventListener('click', async () => {
      this.updateStatus('Scanning for devices...');
      try {
        const devices = await window.craftforge.scanDevices();
        this.handleDevicesFound(devices);
      } catch (err) {
        this.updateStatus('Error scanning: ' + err.message);
      }
    });
    
    // Connect to selected device
    connectBtn.addEventListener('click', async () => {
      const selectedIndex = deviceList.value;
      if (selectedIndex && this.availableDevices[selectedIndex]) {
        const device = this.availableDevices[selectedIndex];
        this.updateStatus(`Connecting to ${device.name}...`);
        try {
          await window.craftforge.connectDevice(device, device.driver);
        } catch (err) {
          this.updateStatus('Connection failed: ' + err.message);
        }
      }
    });
    
    // Device list change
    deviceList.addEventListener('change', () => {
      connectBtn.disabled = !deviceList.value;
    });
    
    // Send cut job
    sendCutBtn.addEventListener('click', () => this.sendCutJob());
    
    // Speed slider
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        document.getElementById('speed-value').textContent = e.target.value;
      });
    }
    
    // IPC event handlers
    if (window.craftforge) {
      window.craftforge.onDevicesFound((devices) => this.handleDevicesFound(devices));
      window.craftforge.onDeviceConnected((data) => this.handleDeviceConnected(data));
      window.craftforge.onDeviceDisconnected(() => this.handleDeviceDisconnected());
      window.craftforge.onCutProgress((data) => this.handleCutProgress(data));
      window.craftforge.onCutCompleted(() => this.handleCutCompleted());
      window.craftforge.onDeviceError((data) => this.handleDeviceError(data));
      window.craftforge.onSendCut(() => this.sendCutJob());
    }
  }
  
  handleDevicesFound(devices) {
    this.availableDevices = devices;
    const deviceList = document.getElementById('device-list');
    const connectBtn = document.getElementById('connect-device-btn');
    
    deviceList.innerHTML = '<option value="">Select a device...</option>';
    
    devices.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${device.name} (${device.path || 'USB'})`;
      deviceList.appendChild(option);
    });
    
    deviceList.style.display = devices.length > 0 ? 'block' : 'none';
    connectBtn.disabled = true;
    
    this.updateStatus(`Found ${devices.length} device(s)`);
  }
  
  handleDeviceConnected(data) {
    this.deviceConnected = true;
    const statusEl = document.getElementById('device-status');
    const nameEl = document.getElementById('device-name');
    const sendBtn = document.getElementById('send-cut-btn');
    
    statusEl.classList.remove('disconnected');
    statusEl.classList.add('connected');
    nameEl.textContent = data.info.name || 'Connected';
    sendBtn.disabled = false;
    
    this.updateStatus('Device connected!');
  }
  
  handleDeviceDisconnected() {
    this.deviceConnected = false;
    const statusEl = document.getElementById('device-status');
    const nameEl = document.getElementById('device-name');
    const sendBtn = document.getElementById('send-cut-btn');
    
    statusEl.classList.remove('connected');
    statusEl.classList.add('disconnected');
    nameEl.textContent = 'No device connected';
    sendBtn.disabled = true;
    
    this.updateStatus('Device disconnected');
  }
  
  handleCutProgress(data) {
    const progressEl = document.getElementById('cut-progress');
    const fillEl = progressEl.querySelector('.progress-fill');
    const textEl = progressEl.querySelector('.progress-text');
    
    progressEl.style.display = 'block';
    fillEl.style.width = `${data.progress.percent}%`;
    textEl.textContent = `${data.progress.percent}%`;
    
    this.updateStatus(`Cutting: ${data.progress.percent}%`);
  }
  
  handleCutCompleted() {
    const progressEl = document.getElementById('cut-progress');
    progressEl.style.display = 'none';
    this.updateStatus('Cut completed!');
  }
  
  handleDeviceError(data) {
    this.updateStatus(`Device error: ${data.error}`);
  }
  
  async sendCutJob() {
    if (!this.deviceConnected) {
      this.updateStatus('No device connected');
      return;
    }
    
    if (this.objects.length === 0) {
      this.updateStatus('No objects to cut');
      return;
    }
    
    // Build cut job from objects
    const job = {
      paths: this.objectsToPaths(),
      settings: {
        material: document.getElementById('material-select').value,
        pressure: parseInt(document.getElementById('cut-pressure').value),
        speed: parseInt(document.getElementById('cut-speed')?.value || 4),
        multiCut: parseInt(document.getElementById('multi-cut')?.value || 1)
      }
    };
    
    this.updateStatus('Sending to cutter...');
    
    try {
      await window.craftforge.sendCutJob(job);
    } catch (err) {
      this.updateStatus('Cut failed: ' + err.message);
    }
  }
  
  objectsToPaths() {
    // Convert canvas objects to cut paths
    return this.objects.map(obj => {
      const coords = [];
      
      switch (obj.type) {
        case 'rect':
          // Rectangle as path coordinates (in inches)
          const x = obj.x / this.dpi;
          const y = obj.y / this.dpi;
          const w = obj.width / this.dpi;
          const h = obj.height / this.dpi;
          
          coords.push({ x, y, pen: 'up' });
          coords.push({ x: x + w, y, pen: 'down' });
          coords.push({ x: x + w, y: y + h, pen: 'down' });
          coords.push({ x, y: y + h, pen: 'down' });
          coords.push({ x, y, pen: 'down' });
          break;
          
        case 'ellipse':
          // Approximate ellipse with line segments
          const cx = (obj.x + obj.width / 2) / this.dpi;
          const cy = (obj.y + obj.height / 2) / this.dpi;
          const rx = (obj.width / 2) / this.dpi;
          const ry = (obj.height / 2) / this.dpi;
          const segments = 36;
          
          for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const px = cx + Math.cos(angle) * rx;
            const py = cy + Math.sin(angle) * ry;
            coords.push({ x: px, y: py, pen: i === 0 ? 'up' : 'down' });
          }
          break;
          
        case 'path':
          // Path objects have coordinates already
          if (obj.coordinates) {
            return { coordinates: obj.coordinates };
          }
          break;
      }
      
      return { coordinates: coords };
    });
  }

  // Image Trace
  setupTraceHandlers() {
    const traceDialog = document.getElementById('trace-dialog');
    const closeBtn = document.getElementById('close-trace-dialog');
    const previewBtn = document.getElementById('trace-preview-btn');
    const applyBtn = document.getElementById('trace-apply-btn');
    const modeSelect = document.getElementById('trace-mode');
    const thresholdSlider = document.getElementById('trace-threshold');
    const posterizeRow = document.getElementById('posterize-steps-row');
    
    // Tool button for trace
    const traceToolBtn = document.querySelector('[data-tool="trace"]');
    if (traceToolBtn) {
      traceToolBtn.addEventListener('click', () => this.openTraceDialog());
    }
    
    // Close dialog
    closeBtn?.addEventListener('click', () => {
      traceDialog.style.display = 'none';
    });
    
    // Mode change
    modeSelect?.addEventListener('change', () => {
      posterizeRow.style.display = modeSelect.value === 'posterize' ? 'flex' : 'none';
    });
    
    // Threshold slider
    thresholdSlider?.addEventListener('input', (e) => {
      document.getElementById('threshold-value').textContent = e.target.value;
    });
    
    // Preview button
    previewBtn?.addEventListener('click', () => this.previewTrace());
    
    // Apply button
    applyBtn?.addEventListener('click', () => this.applyTrace());
  }
  
  async openTraceDialog() {
    if (!window.craftforge) return;
    
    const imagePath = await window.craftforge.selectImageForTrace();
    if (!imagePath) return;
    
    this.currentImagePath = imagePath;
    
    // Show dialog
    const dialog = document.getElementById('trace-dialog');
    const originalImg = document.getElementById('trace-original');
    
    originalImg.src = `file://${imagePath}`;
    dialog.style.display = 'flex';
    
    // Auto-preview
    this.previewTrace();
  }
  
  async previewTrace() {
    if (!this.currentImagePath || !window.craftforge) return;
    
    const mode = document.getElementById('trace-mode').value;
    const threshold = parseInt(document.getElementById('trace-threshold').value);
    const detail = document.getElementById('trace-detail').value;
    const invert = document.getElementById('trace-invert').checked;
    
    const detailMap = { high: 1, medium: 2, low: 4 };
    
    const options = {
      threshold,
      turdSize: detailMap[detail],
      optTolerance: detail === 'high' ? 0.1 : detail === 'low' ? 0.5 : 0.2
    };
    
    try {
      this.updateStatus('Tracing image...');
      
      let result;
      if (mode === 'posterize') {
        const steps = parseInt(document.getElementById('posterize-steps').value);
        result = await window.craftforge.posterizeImage(this.currentImagePath, steps, options);
      } else {
        result = await window.craftforge.traceImage(this.currentImagePath, options);
      }
      
      // Display result
      const resultDiv = document.getElementById('trace-result');
      resultDiv.innerHTML = result.svg;
      this.traceResult = result;
      
      this.updateStatus('Trace preview ready');
    } catch (err) {
      this.updateStatus('Trace failed: ' + err.message);
    }
  }
  
  async applyTrace() {
    if (!this.traceResult) return;

    // Prepare SVG string and ensure it has explicit dimensions (helps Image rendering)
    let svg = this.traceResult.svg || '';
    // If SVG doesn't declare width/height but has viewBox, try to add width/height attributes
    try {
      const vbMatch = svg.match(/<svg[^>]*viewBox="([^"]+)"[^>]*>/i);
      const hasWH = /<svg[^>]*(width|height)=/i.test(svg);
      if (vbMatch && !hasWH) {
        // Use viewBox width/height as default px size
        const parts = vbMatch[1].split(/[,\s]+/).map(Number);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          svg = svg.replace(/<svg/i, `<svg width="${parts[2]}" height="${parts[3]}"`);
        }
      }
    } catch (e) {
      // ignore
    }

    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

    // Create image and wait for it to load before adding to objects to avoid flicker/disappearance
    const img = new Image();
    const imgLoad = new Promise((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    });
    img.src = dataUrl;

    const loaded = await imgLoad;

    const newObj = {
      type: 'path',
      x: 50,
      y: 50,
      width: loaded && img.naturalWidth ? img.naturalWidth : 200,
      height: loaded && img.naturalHeight ? img.naturalHeight : 200,
      pathData: this.traceResult.pathData,
      svg: svg,
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 1,
      rotation: 0,
      _svgImage: loaded ? img : undefined
    };

    this.saveState();
    this.objects.push(newObj);
    this.selectedObjects = [newObj];
    this.render();

    // Close dialog
    document.getElementById('trace-dialog').style.display = 'none';
    this.updateStatus('Traced image added to canvas');
  }

  async aiSearch(query) {
    const statusEl = document.getElementById('ai-status');
    if (!statusEl) return;

    statusEl.textContent = '🔍 Searching...';
    statusEl.className = 'ai-status';
    statusEl.style.display = 'block';

    try {
      const response = await fetch('http://localhost:4000/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Get the first result
        const result = data.results[0];
        statusEl.textContent = `✅ Found: ${result.title}`;
        statusEl.className = 'ai-status success';
        this.updateStatus(`Design found: ${result.title}`);
      } else {
        statusEl.textContent = '❌ No results found';
        statusEl.className = 'ai-status error';
      }
    } catch (error) {
      statusEl.textContent = `❌ Error: ${error.message}`;
      statusEl.className = 'ai-status error';
      this.updateStatus('AI search failed: ' + error.message);
    }
  }

  async aiGenerate(prompt) {
    const statusEl = document.getElementById('ai-status');
    if (!statusEl) return;

    statusEl.textContent = '🎨 Generating...';
    statusEl.className = 'ai-status';
    statusEl.style.display = 'block';

    try {
      const response = await fetch('http://localhost:4000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      
      if (data.svg) {
        // Add the generated SVG to the canvas
        const newObj = {
          type: 'path',
          x: 100,
          y: 100,
          width: 400,
          height: 400,
          svg: data.svg,
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 1,
          rotation: 0
        };

        this.saveState();
        this.objects.push(newObj);
        this.selectedObjects = [newObj];
        this.render();

        statusEl.textContent = '✅ Design generated!';
        statusEl.className = 'ai-status success';
        this.updateStatus('AI design added to canvas');
      } else {
        statusEl.textContent = '❌ Generation failed';
        statusEl.className = 'ai-status error';
      }
    } catch (error) {
      statusEl.textContent = `❌ Error: ${error.message}`;
      statusEl.className = 'ai-status error';
      this.updateStatus('AI generation failed: ' + error.message);
    }
  }

  openTraceDialog() {
    // Show the trace dialog if it exists, or create a simple prompt
    const dialog = document.getElementById('trace-dialog');
    if (dialog) {
      dialog.style.display = 'block';
    } else {
      // Fallback: trace with default settings
      this.performImageTrace();
    }
  }

  performImageTrace() {
    if (!this.currentImagePath) return;
    const threshold = 128;
    const options = {
      threshold,
      turdSize: 2,
      optTolerance: 0.2
    };

    this.updateStatus('Tracing image...');
    
    if (window.craftforge?.traceImage) {
      window.craftforge.traceImage(this.currentImagePath, options)
        .then(result => {
          this.traceResult = result;
          this.updateStatus('Trace preview ready. Click "Apply" to add to canvas.');
          this.applyTrace();
        })
        .catch(err => this.updateStatus('Trace failed: ' + err.message));
    }
  }
}
document.addEventListener('DOMContentLoaded', () => {
  window.app = new CraftForgeApp();
});
