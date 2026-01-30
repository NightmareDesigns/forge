/**
 * License Manager UI — CraftForge
 * Displays license status and handles key activation
 */

class LicenseUI {
  constructor() {
    this.licenseStatus = null;
    this.init();
  }

  /**
   * Initialize license UI
   */
  async init() {
    // Listen for license status updates
    window.craftforge.onLicenseStatus((status) => {
      this.licenseStatus = status;
      this.updateStatusBar(status);
    });

    // Get initial status
    const status = await window.craftforge.getLicenseStatus();
    this.licenseStatus = status;
    this.updateStatusBar(status);

    // Check if locked
    const lockStatus = await window.craftforge.checkLicenseLocked();
    if (lockStatus.isLocked) {
      this.showLicenseDialog();
    }
  }

  /**
   * Update status bar with license info
   */
  updateStatusBar(status) {
    const statusBar = document.getElementById('license-status') || this.createStatusBar();
    statusBar.textContent = `📋 ${status.status}`;
    statusBar.className = `license-status ${status.type}`;
    statusBar.style.cursor = 'pointer';
    statusBar.onclick = () => this.showLicenseInfo();
  }

  /**
   * Create status bar if it doesn't exist
   */
  createStatusBar() {
    const bar = document.createElement('div');
    bar.id = 'license-status';
    bar.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: #333;
      color: #fff;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 9999;
      cursor: pointer;
    `;
    document.body.appendChild(bar);
    return bar;
  }

  /**
   * Show license information modal
   */
  showLicenseInfo() {
    const modal = this.createModal('License Information');

    const content = document.createElement('div');
    content.innerHTML = `
      <div style="font-family: monospace; margin: 10px 0;">
        <p><strong>Status:</strong> ${this.licenseStatus.status}</p>
        <p><strong>Type:</strong> ${this.licenseStatus.type}</p>
        ${this.licenseStatus.trialEndDate ? `<p><strong>Trial Ends:</strong> ${new Date(this.licenseStatus.trialEndDate).toLocaleDateString()}</p>` : ''}
        ${this.licenseStatus.activationDate ? `<p><strong>Activated:</strong> ${new Date(this.licenseStatus.activationDate).toLocaleDateString()}</p>` : ''}
        <p><strong>Machine ID:</strong> ${this.licenseStatus.machineId}</p>
      </div>
      <button id="close-license-modal" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    document.getElementById('close-license-modal').onclick = () => {
      modal.remove();
    };
  }

  /**
   * Show license activation dialog (when locked or on manual trigger)
   */
  showLicenseDialog() {
    const modal = this.createModal('Activate License Key');

    const content = document.createElement('div');
    content.innerHTML = `
      <div style="margin: 10px 0;">
        <p>Enter your license key to activate Nightmare Designs SVG Forge:</p>
        <input 
          type="text" 
          id="license-key-input" 
          placeholder="XXXX-XXXX-XXXX-XXXX" 
          style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px;"
          maxlength="19"
        />
        <div id="activation-error" style="color: red; margin: 10px 0; display: none;"></div>
        <div style="display: flex; gap: 10px; margin-top: 15px;">
          <button id="activate-btn" style="flex: 1; padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Activate</button>
          <button id="close-license-btn" style="flex: 1; padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 15px;">
          <strong>Purchase License:</strong> Visit https://nightmaredesigns.org to purchase a license key for \$79.99
        </p>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    const keyInput = document.getElementById('license-key-input');
    const activateBtn = document.getElementById('activate-btn');
    const closeBtn = document.getElementById('close-license-btn');
    const errorDiv = document.getElementById('activation-error');

    // Format key input (auto-add dashes)
    keyInput.onkeyup = (e) => {
      let value = e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
      if (value.length > 16) value = value.substring(0, 16);
      let formatted = '';
      for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += '-';
        formatted += value[i];
      }
      e.target.value = formatted;
    };

    activateBtn.onclick = async () => {
      const key = keyInput.value.trim();
      if (!key) {
        errorDiv.textContent = 'Please enter a license key';
        errorDiv.style.display = 'block';
        return;
      }

      activateBtn.disabled = true;
      activateBtn.textContent = 'Activating...';

      try {
        const result = await window.craftforge.activateLicense(key);
        if (result.success) {
          errorDiv.style.display = 'none';
          modal.remove();
          alert('License activated successfully! Please restart the application.');
          // Optionally restart app or reload
        } else {
          errorDiv.textContent = `Activation failed: ${result.error}`;
          errorDiv.style.display = 'block';
          activateBtn.disabled = false;
          activateBtn.textContent = 'Activate';
        }
      } catch (err) {
        errorDiv.textContent = `Error: ${err.message}`;
        errorDiv.style.display = 'block';
        activateBtn.disabled = false;
        activateBtn.textContent = 'Activate';
      }
    };

    closeBtn.onclick = () => {
      // Check if locked; if so, don't allow close
      const lockStatus = this.licenseStatus;
      if (lockStatus.type === 'expired') {
        alert('Trial expired. You must enter a valid license key to continue using Nightmare Designs SVG Forge.');
      } else {
        modal.remove();
      }
    };

    // Focus on input
    setTimeout(() => keyInput.focus(), 100);
  }

  /**
   * Create a modal dialog
   */
  createModal(title) {
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      width: 90%;
    `;

    const header = document.createElement('h2');
    header.textContent = title;
    header.style.marginTop = '0';
    dialog.appendChild(header);

    backdrop.appendChild(dialog);
    backdrop.onclick = (e) => {
      if (e.target === backdrop) {
        // Don't close if locked
        if (this.licenseStatus.type !== 'expired') {
          backdrop.remove();
        }
      }
    };

    return dialog;
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new LicenseUI();
  });
} else {
  new LicenseUI();
}
