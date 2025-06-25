const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');


// xuthority-dev/src/config/swaggerDef.js
const swaggerDefinition = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Xuthority API',
      version: '1.0.0',
      description: 'Automatically generated API documentation.',
      contact: {
        name: 'Xuthority',
        url: 'https://xuthority.com',
        email: 'support@xuthority.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      },
      termsOfService: 'https://xuthority.com/terms',
      xuthority: 'https://xuthority.com',
      xuthorityDev: 'https://xuthority-dev.com',
      xuthorityDevApi: 'http://localhost:8081/api/v1',
      xuthorityDevApiDocs: 'http://localhost:8081/api-docs',
      xuthorityDevApiDocsSwagger: 'http://localhost:8081/swagger.json',
      xuthorityDevApiDocsSwaggerUi: 'http://localhost:8081/api-docs',
      xuthorityDevApiDocsSwaggerUiSwagger: 'http://localhost:8081/swagger.json'
    },
    servers: [
      { url: 'http://localhost:8081/api/v1' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

const swaggerSpec = swaggerJSDoc(swaggerDefinition);

/**
 * Mounts Swagger UI at /api-docs
 * @param {Express.Application} app
 */
function setupSwagger(app) {
  const outputPath = path.join(__dirname, '../../swagger.json');
  fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
  console.log(`Swagger documentation generated at ${outputPath}`);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;
