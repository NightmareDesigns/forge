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
    
    this.init();
  }

  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.setupToolbar();
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
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTool = btn.dataset.tool;
        this.updateStatus(`Tool: ${this.currentTool}`);
      });
    });
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
        if (obj.fill !== 'transparent') this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        this.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        break;
      case 'ellipse':
        this.ctx.beginPath();
        this.ctx.ellipse(obj.x + obj.width/2, obj.y + obj.height/2, obj.width/2, obj.height/2, 0, 0, Math.PI * 2);
        if (obj.fill !== 'transparent') this.ctx.fill();
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
    
    if (this.currentTool === 'select') {
      this.handleSelection(x, y);
    } else if (this.currentTool === 'shapes') {
      this.startDrawingShape(x, y);
    }
  }

  handleMouseMove(e) {
    // Handle dragging, drawing, etc.
  }

  handleMouseUp(e) {
    // Finish operations
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
  }

  // Tool operations
  selectTool(tool) {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
    this.currentTool = tool;
  }

  handleSelection(x, y) {
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

  selectAll() {
    this.selectedObjects = [...this.objects];
    this.render();
    this.updateSelectedCount();
  }

  groupSelected() {
    // Group implementation
    this.updateStatus('Grouped objects');
  }

  ungroupSelected() {
    // Ungroup implementation
    this.updateStatus('Ungrouped objects');
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
  
  applyTrace() {
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
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new CraftForgeApp();
});
