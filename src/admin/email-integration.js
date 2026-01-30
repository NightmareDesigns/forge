/**
 * CraftForge License System - Email Integration Example
 * 
 * This shows how to automatically email customers their software number
 * when they complete payment. Works with Stripe, PayPal, etc.
 */

const nodemailer = require('nodemailer');
const LicenseManager = require('./src/admin/LicenseManager');

/**
 * Configure your email service here
 * Using Gmail, Outlook, SendGrid, or your own SMTP server
 */
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.CRAFTFORGE_EMAIL || 'your-email@gmail.com',
    pass: process.env.CRAFTFORGE_EMAIL_PASSWORD || 'your-app-password'
  }
});

/**
 * Send welcome email with software number and license key
 * Call this after payment is confirmed
 */
async function sendLicenseEmail(customer, softwareNumber, licenseKey) {
  const licenseManager = new LicenseManager();
  const license = await licenseManager.getLicenseByKey(licenseKey);

  const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
    .header { border-bottom: 2px solid #8b0000; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #8b0000; }
    .content { color: #333; line-height: 1.6; }
    .key-box { 
      background: #f9f9f9; 
      border-left: 4px solid #8b0000; 
      padding: 15px; 
      margin: 20px 0;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }
    .code { 
      background: #0d0000; 
      color: #cccccc; 
      padding: 10px; 
      border-radius: 4px;
      font-weight: bold;
      word-break: break-all;
    }
    .footer { 
      border-top: 1px solid #ddd; 
      margin-top: 30px; 
      padding-top: 20px; 
      font-size: 12px; 
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎨 CraftForge</div>
      <p style="color: #666; margin: 10px 0 0 0;">License Activation</p>
    </div>

    <div class="content">
      <p>Hi ${customer.name},</p>

      <p>Thank you for your purchase! Your CraftForge ${customer.productType} ${customer.licenseType} license is ready to use.</p>

      <h3>Your License Details</h3>
      <p><strong>Software Number:</strong></p>
      <div class="key-box">
        <div class="code">${softwareNumber}</div>
      </div>

      <p><strong>License Key:</strong></p>
      <div class="key-box">
        <div class="code">${licenseKey}</div>
      </div>

      <h3>How to Activate</h3>
      <ol>
        <li>Open CraftForge</li>
        <li>Go to Help → License</li>
        <li>Paste your Software Number and License Key</li>
        <li>Click Activate</li>
      </ol>

      <h3>License Information</h3>
      <ul>
        <li><strong>Type:</strong> ${customer.licenseType}</li>
        <li><strong>Product:</strong> ${customer.productType}</li>
        <li><strong>Issued:</strong> ${new Date().toLocaleDateString()}</li>
        <li><strong>Expires:</strong> ${new Date(license.expiryDate).toLocaleDateString()}</li>
      </ul>

      <p style="color: #666; margin-top: 30px;">
        Questions? Visit <a href="https://craftforge.example.com/support">our support page</a> or reply to this email.
      </p>
    </div>

    <div class="footer">
      <p>© 2024 CraftForge. All rights reserved.</p>
      <p>Keep this email safe - you'll need this information to activate your license.</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.CRAFTFORGE_EMAIL || 'noreply@craftforge.example.com',
      to: customer.email,
      subject: 'Your CraftForge License - Activation Required',
      html: emailContent
    });

    console.log(`✓ License email sent to ${customer.email}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${customer.email}:`, error.message);
    throw error;
  }
}

/**
 * Example: Stripe webhook handler
 * Add this to your payment processing backend
 */
async function handleStripeWebhook(event) {
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const licenseManager = new LicenseManager();

    // Register the customer and generate license
    const result = await licenseManager.registerPayment({
      email: paymentIntent.receipt_email,
      name: paymentIntent.description || 'Customer',
      productType: 'CraftForge', // or from paymentIntent.metadata.product
      licenseType: paymentIntent.metadata.licenseType || 'personal',
      paymentAmount: paymentIntent.amount / 100, // Convert from cents
      paymentMethod: 'stripe',
      externalPaymentId: paymentIntent.id
    });

    // Send license email
    await sendLicenseEmail(
      result.customer,
      result.softwareNumber,
      result.licenseKey
    );

    console.log(`✓ Stripe payment processed for ${paymentIntent.receipt_email}`);
  }
}

/**
 * Example: PayPal webhook handler
 * Add this to your payment processing backend
 */
async function handlePayPalWebhook(event) {
  if (event.event_type === 'BILLING.SUBSCRIPTION.CREATED') {
    const subscriber = event.resource.subscriber;
    const licenseManager = new LicenseManager();

    // Register the customer and generate license
    const result = await licenseManager.registerPayment({
      email: subscriber.email_address,
      name: subscriber.name?.given_name + ' ' + subscriber.name?.surname || 'Customer',
      productType: 'CraftForge',
      licenseType: 'personal',
      paymentAmount: event.resource.plan?.pricing_schemes?.[0]?.price?.value || 0,
      paymentMethod: 'paypal',
      externalPaymentId: event.id
    });

    // Send license email
    await sendLicenseEmail(
      result.customer,
      result.softwareNumber,
      result.licenseKey
    );

    console.log(`✓ PayPal payment processed for ${subscriber.email_address}`);
  }
}

/**
 * Example: Simple Express route for manual license generation
 * Use this for testing or manual license issuance
 */
function createLicenseRoute(app) {
  const licenseManager = new LicenseManager();

  app.post('/manual-license', async (req, res) => {
    try {
      const { email, name, licenseType = 'personal' } = req.body;

      // Validate inputs
      if (!email || !name) {
        return res.status(400).json({ error: 'email and name required' });
      }

      // Register customer
      const result = await licenseManager.registerPayment({
        email,
        name,
        productType: 'CraftForge',
        licenseType,
        paymentAmount: 49.99,
        paymentMethod: 'manual'
      });

      // Send email
      await sendLicenseEmail(
        result.customer,
        result.softwareNumber,
        result.licenseKey
      );

      res.json({
        success: true,
        message: 'License generated and email sent',
        softwareNumber: result.softwareNumber,
        licenseKey: result.licenseKey
      });
    } catch (error) {
      console.error('License generation error:', error);
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  sendLicenseEmail,
  handleStripeWebhook,
  handlePayPalWebhook,
  createLicenseRoute,
  transporter
};

/**
 * SETUP INSTRUCTIONS
 * 
 * 1. Install nodemailer:
 *    npm install nodemailer
 * 
 * 2. Set environment variables:
 *    CRAFTFORGE_EMAIL=your-email@gmail.com
 *    CRAFTFORGE_EMAIL_PASSWORD=your-app-password
 * 
 * 3. For Gmail:
 *    - Enable "Less secure app access" OR
 *    - Generate an App Password: https://myaccount.google.com/apppasswords
 *    - Use the app password in CRAFTFORGE_EMAIL_PASSWORD
 * 
 * 4. For other services, use appropriate settings:
 *    - Outlook/Office 365: service: 'outlook'
 *    - SendGrid: Custom SMTP config
 *    - Your own SMTP: Configure host, port, etc.
 * 
 * 5. Integrate with your payment processor:
 *    - Stripe: Listen to payment_intent.succeeded webhooks
 *    - PayPal: Listen to BILLING.SUBSCRIPTION.CREATED webhooks
 *    - Other: Adapt the handlers for your service
 * 
 * EXAMPLE: Manual test
 * 
 *   const emailModule = require('./email-integration');
 *   const licenseManager = require('./src/admin/LicenseManager');
 *   
 *   const licMgr = new licenseManager();
 *   const result = await licMgr.registerPayment({
 *     email: 'test@example.com',
 *     name: 'Test User',
 *     productType: 'CraftForge',
 *     licenseType: 'personal',
 *     paymentAmount: 49.99,
 *     paymentMethod: 'test'
 *   });
 *   
 *   await emailModule.sendLicenseEmail(
 *     result.customer,
 *     result.softwareNumber,
 *     result.licenseKey
 *   );
 */
