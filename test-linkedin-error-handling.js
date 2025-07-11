const express = require('express');
const app = express();

// Simulate LinkedIn OAuth callback with error scenarios
app.get('/test-linkedin-errors', (req, res) => {
  const scenarios = [
    {
      name: 'User Cancelled Login',
      url: 'http://localhost:8081/api/v1/auth/linkedin/callback?error=user_cancelled_login&error_description=The+user+cancelled+LinkedIn+login',
      description: 'Simulates when user clicks "Cancel" on LinkedIn OAuth page'
    },
    {
      name: 'User Cancelled Verification',
      url: 'http://localhost:8081/api/v1/auth/linkedin/verify/callback?error=user_cancelled_login&error_description=The+user+cancelled+LinkedIn+verification',
      description: 'Simulates when user clicks "Cancel" during LinkedIn verification for review'
    },
    {
      name: 'LinkedIn Service Error',
      url: 'http://localhost:8081/api/v1/auth/linkedin/callback?error=temporarily_unavailable&error_description=LinkedIn+service+temporarily+unavailable',
      description: 'Simulates LinkedIn service being temporarily unavailable'
    },
    {
      name: 'Access Denied',
      url: 'http://localhost:8081/api/v1/auth/linkedin/verify/callback?error=access_denied&error_description=User+denied+access+to+LinkedIn+profile',
      description: 'Simulates when user denies access to LinkedIn profile during verification'
    }
  ];

  let html = `
    <html>
      <head>
        <title>LinkedIn Error Handling Test</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .scenario { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .scenario h3 { margin-top: 0; color: #333; }
          .scenario p { color: #666; }
          .test-btn { 
            background: #0077b5; 
            color: white; 
            padding: 10px 20px; 
            text-decoration: none; 
            border-radius: 5px; 
            display: inline-block; 
            margin-top: 10px;
          }
          .test-btn:hover { background: #005885; }
          .info { background: #e7f3ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>LinkedIn OAuth Error Handling Test</h1>
        <div class="info">
          <strong>Instructions:</strong> Click the test buttons below to simulate different LinkedIn OAuth error scenarios. 
          Each will redirect you through the error handling flow and back to the appropriate frontend page.
        </div>
        
        ${scenarios.map(scenario => `
          <div class="scenario">
            <h3>${scenario.name}</h3>
            <p>${scenario.description}</p>
            <a href="${scenario.url}" class="test-btn">Test This Scenario</a>
          </div>
        `).join('')}
        
        <div class="info">
          <strong>Expected Behavior:</strong>
          <ul>
            <li>Regular login errors redirect to <code>/auth/callback?error=...</code></li>
            <li>Verification errors redirect to <code>/write-review?linkedin_error=...&preserve_state=true</code></li>
            <li>User stays on step 2 with selected software preserved</li>
            <li>Appropriate error messages are shown via toast notifications</li>
          </ul>
        </div>
      </body>
    </html>
  `;

  res.send(html);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`LinkedIn Error Handling Test Server running on http://localhost:${PORT}`);
  console.log(`Visit http://localhost:${PORT}/test-linkedin-errors to test error scenarios`);
}); 