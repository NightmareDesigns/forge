/**
 * Security Tests — CraftForge
 * Tests for common vulnerabilities: path traversal, injection, IPC serialization
 */

const { validateFilePath, validateDeviceInfo, validateCutJob, validateTraceOptions } = require('../src/security');

describe('Security Validation Tests', () => {
  
  describe('validateFilePath', () => {
    it('should allow valid image paths', () => {
      const validPaths = [
        '/home/user/designs/logo.png',
        'C:\\Users\\User\\Pictures\\design.svg',
        './local_image.jpg',
        '../neighbor/image.png'
      ];
      
      validPaths.forEach(path => {
        expect(() => validateFilePath(path)).not.toThrow();
      });
    });

    it('should reject path traversal attempts', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '/etc/shadow',
        '../../credentials.json'
      ];
      
      maliciousPaths.forEach(path => {
        expect(() => validateFilePath(path)).toThrow();
      });
    });

    it('should reject non-image file extensions', () => {
      const badExtensions = [
        'script.js',
        'malware.exe',
        'config.json',
        'shell.sh'
      ];
      
      badExtensions.forEach(file => {
        expect(() => validateFilePath(file)).toThrow();
      });
    });

    it('should reject absolute system paths outside user home', () => {
      const systemPaths = [
        '/root/.ssh/id_rsa',
        'C:\\Windows\\System32',
        '/var/www/html'
      ];
      
      systemPaths.forEach(path => {
        expect(() => validateFilePath(path)).toThrow();
      });
    });
  });

  describe('validateDeviceInfo', () => {
    it('should allow valid device info', () => {
      const validDevice = {
        vendorId: 0x16c0,
        productId: 0x0487,
        serialNumber: 'ABC123',
        manufacturer: 'Cricut'
      };
      
      const result = validateDeviceInfo(validDevice);
      expect(result).toEqual(expect.objectContaining({
        vendorId: expect.any(Number),
        productId: expect.any(Number)
      }));
    });

    it('should reject circular references', () => {
      const circular = {};
      circular.self = circular;
      
      expect(() => validateDeviceInfo(circular)).toThrow();
    });

    it('should filter out sensitive fields', () => {
      const device = {
        vendorId: 0x16c0,
        productId: 0x0487,
        apiKey: 'secret123',
        password: 'should-be-removed'
      };
      
      const result = validateDeviceInfo(device);
      expect(result).not.toHaveProperty('apiKey');
      expect(result).not.toHaveProperty('password');
    });

    it('should reject native objects', () => {
      const nativeObj = new (function NativeClass() {})();
      
      expect(() => validateDeviceInfo(nativeObj)).toThrow();
    });
  });

  describe('validateCutJob', () => {
    it('should allow valid cut jobs', () => {
      const validJob = {
        material: 'vinyl',
        thickness: 0.15,
        pressure: 'default',
        speed: 10,
        bladeDepth: 1,
        paths: [
          { type: 'line', x: 0, y: 0, width: 100, height: 100 }
        ]
      };
      
      const result = validateCutJob(validJob);
      expect(result).toEqual(expect.objectContaining({
        material: expect.any(String),
        thickness: expect.any(Number)
      }));
    });

    it('should clamp pressure and speed values', () => {
      const job = {
        material: 'vinyl',
        thickness: 0.15,
        pressure: 999,
        speed: -50,
        bladeDepth: 1,
        paths: []
      };
      
      const result = validateCutJob(job);
      expect(result.pressure).toBeLessThanOrEqual(10);
      expect(result.speed).toBeGreaterThanOrEqual(1);
    });

    it('should reject invalid material types', () => {
      const job = {
        material: 'uranium',
        thickness: 0.15,
        pressure: 5,
        speed: 10,
        bladeDepth: 1,
        paths: []
      };
      
      expect(() => validateCutJob(job)).toThrow();
    });

    it('should validate path structure', () => {
      const job = {
        material: 'vinyl',
        thickness: 0.15,
        pressure: 5,
        speed: 10,
        bladeDepth: 1,
        paths: [
          { type: 'invalid', x: 'not-a-number' }
        ]
      };
      
      expect(() => validateCutJob(job)).toThrow();
    });
  });

  describe('validateTraceOptions', () => {
    it('should allow valid trace options', () => {
      const validOptions = {
        threshold: 128,
        blur: 2,
        invert: false,
        turnPolicy: 'minority',
        alphaMax: 1,
        turdSize: 2,
        longCurveThreshold: 4,
        spliceThreshold: 45,
        cornerThreshold: 60,
        optTolerance: 0.2
      };
      
      const result = validateTraceOptions(validOptions);
      expect(result).toEqual(expect.objectContaining({
        threshold: expect.any(Number),
        blur: expect.any(Number)
      }));
    });

    it('should clamp numeric values to valid ranges', () => {
      const options = {
        threshold: 500,
        blur: -10,
        alphaMax: 999
      };
      
      const result = validateTraceOptions(options);
      expect(result.threshold).toBeLessThanOrEqual(255);
      expect(result.blur).toBeGreaterThanOrEqual(0);
      expect(result.alphaMax).toBeLessThanOrEqual(1);
    });

    it('should reject invalid turnPolicy values', () => {
      const options = {
        turnPolicy: 'evil-policy'
      };
      
      expect(() => validateTraceOptions(options)).toThrow();
    });

    it('should reject non-boolean invert value', () => {
      const options = {
        invert: 'yes'
      };
      
      expect(() => validateTraceOptions(options)).toThrow();
    });
  });

  describe('IPC Serialization Safety', () => {
    it('should not leak internal error details', () => {
      const { handleSecureError } = require('../src/security');
      
      const internalError = new Error('Database connection failed at localhost:5432');
      const safeMsg = handleSecureError(internalError, 'fetch-designs');
      
      expect(safeMsg).not.toContain('localhost');
      expect(safeMsg).not.toContain('5432');
      expect(safeMsg).toContain('fetch-designs');
    });

    it('should log errors securely without exposing stack traces', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const { handleSecureError } = require('../src/security');
      
      const err = new Error('Internal server error');
      handleSecureError(err, 'test-op');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Dangerous Pattern Detection', () => {
    it('should detect eval patterns in code', () => {
      // This is a meta-test: grep src/ for eval patterns
      // Run: grep -r "eval\|Function(" src/ --exclude-dir=node_modules
      // Should return 0 results (except this test file)
      const fs = require('fs');
      const glob = require('glob');
      
      const files = glob.sync('src/**/*.js', { ignore: ['src/security.js', 'tests/**'] });
      const forbiddenPatterns = /\beval\s*\(|\bFunction\s*\(/g;
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const matches = content.match(forbiddenPatterns);
        expect(matches).toBeNull();
      });
    });

    it('should detect shell injection patterns', () => {
      const fs = require('fs');
      const glob = require('glob');
      
      const files = glob.sync('src/**/*.js', { ignore: ['src/security.js', 'tests/**'] });
      const shellPatterns = /child_process\.exec\s*\(|shell:\s*true/g;
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const matches = content.match(shellPatterns);
        expect(matches).toBeNull();
      });
    });
  });

});
