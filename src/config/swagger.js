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
        AdminBearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Admin JWT token',
        },
      },
      schemas: {
        Admin: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Admin unique identifier',
              example: '60d21b4667d0d8992e610c85'
            },
            _id: {
              type: 'string',
              description: 'MongoDB ObjectId',
              example: '60d21b4667d0d8992e610c85'
            },
            firstName: {
              type: 'string',
              description: 'Admin first name',
              example: 'John'
            },
            lastName: {
              type: 'string',
              description: 'Admin last name',
              example: 'Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Admin email address',
              example: 'admin@xuthority.com'
            },
            role: {
              type: 'string',
              enum: ['admin'],
              description: 'Admin role',
              example: 'admin'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether admin account is active',
              example: true
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp',
              example: '2023-12-01T10:30:00.000Z'
            },
            notes: {
              type: 'string',
              description: 'Admin notes',
              example: 'Senior administrator for platform management'
            },
            avatar: {
              type: 'string',
              format: 'uri',
              description: 'Admin profile avatar URL',
              example: 'https://xuthority.s3.amazonaws.com/uploads/avatars/admin-123.jpg'
            },
            fullName: {
              type: 'string',
              description: 'Full name computed from first and last name',
              example: 'John Doe'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Admin creation timestamp',
              example: '2023-01-01T00:00:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Admin last update timestamp',
              example: '2023-12-01T10:30:00.000Z'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User unique identifier',
              example: '60d21b4667d0d8992e610c85'
            },
            _id: {
              type: 'string',
              description: 'MongoDB ObjectId',
              example: '60d21b4667d0d8992e610c85'
            },
            firstName: {
              type: 'string',
              description: 'User first name',
              example: 'Jane'
            },
            lastName: {
              type: 'string',
              description: 'User last name',
              example: 'Smith'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'jane.smith@example.com'
            },
            role: {
              type: 'string',
              enum: ['user', 'vendor'],
              description: 'User role',
              example: 'vendor'
            },
            isVerified: {
              type: 'boolean',
              description: 'Whether user is verified',
              example: true
            },
            avatar: {
              type: 'string',
              format: 'uri',
              description: 'User profile avatar URL',
              example: 'https://xuthority.s3.amazonaws.com/uploads/avatars/user-123.jpg'
            },
            companyName: {
              type: 'string',
              description: 'Company name (for vendors)',
              example: 'TechCorp Inc.'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
              example: '2023-01-01T00:00:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
              example: '2023-12-01T10:30:00.000Z'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Error message',
                  example: 'Invalid credentials'
                },
                code: {
                  type: 'string',
                  description: 'Error code',
                  example: 'INVALID_CREDENTIALS'
                },
                statusCode: {
                  type: 'integer',
                  description: 'HTTP status code',
                  example: 401
                },
                details: {
                  type: 'object',
                  description: 'Additional error details',
                  example: {}
                }
              }
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            currentPage: {
              type: 'integer',
              description: 'Current page number',
              example: 1
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages',
              example: 10
            },
            totalItems: {
              type: 'integer',
              description: 'Total number of items',
              example: 100
            },
            itemsPerPage: {
              type: 'integer',
              description: 'Number of items per page',
              example: 10
            },
            hasNext: {
              type: 'boolean',
              description: 'Whether there is a next page',
              example: true
            },
            hasPrev: {
              type: 'boolean',
              description: 'Whether there is a previous page',
              example: false
            }
          }
        }
      }
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
