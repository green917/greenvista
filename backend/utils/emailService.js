const SibApiV3Sdk = require('sib-api-v3-sdk');

// Configure Brevo API
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];

// Re-initialize API Key configuration to ensure it picks up latest environment variables
const setBrevoApiKey = () => {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    console.warn('[Brevo] API Key is missing in environment variables!');
  }
  apiKey.apiKey = key;
};

// Create API instance
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email
const sendOTPEmail = async (email, otp, purpose = 'login') => {
  setBrevoApiKey();
  try {
    let subject, emailTitle;

    if (purpose === 'login') {
      subject = 'GREEN VISTA - Login OTP Verification';
      emailTitle = 'Login Verification';
    } else if (purpose === 'registration') {
      subject = 'GREEN VISTA - Registration OTP Verification';
      emailTitle = 'Registration Verification';
    } else if (purpose === 'password-reset') {
      subject = 'GREEN VISTA - Password Reset OTP Verification';
      emailTitle = 'Password Reset Verification';
    } else {
      subject = 'GREEN VISTA - Service Request OTP Verification';
      emailTitle = 'Service Request Verification';
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #27ae60; padding: 20px; text-align: center; color: white; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🌿 GREEN VISTA</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px;">Where Nature Meets Art</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; border: 1px solid #ddd;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">
            ${emailTitle}
          </h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Hello,<br><br>
            Your One-Time Password (OTP) for ${purpose === 'login' ? 'login' : purpose === 'registration' ? 'account registration' : purpose === 'password-reset' ? 'password reset' : 'submitting a service request'} is:
          </p>
          
          <div style="background-color: #27ae60; padding: 20px; text-align: center; margin: 30px 0; border-radius: 5px;">
            <h3 style="color: white; margin: 0; font-size: 36px; letter-spacing: 5px;">
              ${otp}
            </h3>
          </div>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            <strong>⏱️ This OTP is valid for 1 minutes only.</strong>
          </p>
          
          <p style="color: #d9534f; line-height: 1.6; margin-bottom: 20px;">
            ⚠️ Never share this OTP with anyone. We will never ask for your OTP.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; margin-bottom: 10px;">
            If you didn't request this OTP, please ignore this email.
          </p>
          
          <p style="color: #999; font-size: 12px;">
            <strong>Contact Information:</strong><br>
            Email: greenvistaaa@gmail.com<br>
            Phone: +91 9019004060<br>
            Hours: Monday - Friday, 9 AM - 6 PM
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2025 GREEN VISTA. All rights reserved.</p>
        </div>
      </div>
    `;

    // Create email object for Brevo
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name: 'GREEN VISTA',
      email: process.env.BREVO_SENDER_EMAIL || 'greenvistaaa@gmail.com'
    };
    sendSmtpEmail.to = [{ email: email }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    // Send email via Brevo API
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('[Brevo] OTP email sent successfully to:', email);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    // Extract the real error message from Brevo response body
    const errorMessage = error.response && error.response.body ?
      JSON.stringify(error.response.body) :
      error.message;

    console.error('[Brevo] Email sending error:', errorMessage);
    return { success: false, message: 'Failed to send OTP', error: errorMessage };
  }
};

// Send Service Request Notification
const sendServiceRequestNotification = async (ownerEmail, ownerName, requestDetails) => {
  setBrevoApiKey();
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #27ae60; padding: 20px; text-align: center; color: white; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🌿 GREEN VISTA</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px;">Where Nature Meets Art</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; border: 1px solid #ddd;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">✅ Service Request Submitted</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Dear ${ownerName},<br><br>
            Your service request has been successfully submitted to our admin team.
          </p>
          
          <div style="background-color: white; padding: 20px; border-left: 4px solid #27ae60; margin: 20px 0;">
            <h3 style="color: #27ae60; margin-top: 0;">Request Details:</h3>
            <p style="margin: 10px 0;"><strong>Type:</strong> ${requestDetails.type}</p>
            <p style="margin: 10px 0;"><strong>Details:</strong> ${requestDetails.details}</p>
            <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #f39c12; font-weight: bold;">Pending Review</span></p>
            <p style="margin: 10px 0;"><strong>Request ID:</strong> ${requestDetails.requestId}</p>
          </div>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Our admin team will review your request and get back to you within 24 hours.
          </p>
          
          <p style="color: #999; font-size: 12px;">
            <strong>Contact Information:</strong><br>
            Email: greenvistaaa@gmail.com<br>
            Phone: +91 9019004060<br>
            Hours: Monday - Friday, 9 AM - 6 PM
          </p>
        </div>
      </div>
    `;

    // Create email object for Brevo
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name: 'GREEN VISTA',
      email: process.env.BREVO_SENDER_EMAIL || 'greenvistaaa@gmail.com'
    };
    sendSmtpEmail.to = [{ email: ownerEmail }];
    sendSmtpEmail.subject = '✅ GREEN VISTA - Service Request Received';
    sendSmtpEmail.htmlContent = htmlContent;

    // Send email via Brevo API
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('[Brevo] Service request notification sent successfully to:', ownerEmail);
    return { success: true, message: 'Notification sent successfully' };
  } catch (error) {
    // Extract the real error message from Brevo response body
    const errorMessage = error.response && error.response.body ?
      JSON.stringify(error.response.body) :
      error.message;

    console.error('[Brevo] Email sending error:', errorMessage);
    return { success: false, message: 'Failed to send notification', error: errorMessage };
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendServiceRequestNotification
};
