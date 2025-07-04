# Xuthority Backend API

A scalable Node.js backend for the Xuthority platform, providing comprehensive APIs for software reviews, vendor management, and product discovery.

## Features

- **Software Management**: Create, read, update, and delete software entries
- **Product Management**: Full CRUD operations for products with rich metadata
- **Review System**: Comprehensive review management with ratings and comments
- **User Authentication**: JWT-based authentication with role-based access
- **File Upload**: AWS S3 integration for file storage
- **Search & Filtering**: Advanced search and filtering capabilities
- **API Documentation**: Swagger/OpenAPI documentation
- **Testing**: Comprehensive test suite with integration tests

## New Features

### Featured Softwares API
- **Endpoint**: `GET /api/v1/software/featured-with-products`
- **Purpose**: Returns active softwares with their top-rated products
- **Features**:
  - Returns at least 4 products per software (configurable)
  - Filters by minimum rating
  - Supports pagination and sorting
  - Only includes softwares that have associated products
  - Comprehensive product data with all relationships populated

## API Endpoints

### Software Endpoints
- `GET /api/v1/software` - Get all software with pagination
- `GET /api/v1/software/active` - Get active software only
- `GET /api/v1/software/featured-with-products` - **NEW** Get featured softwares with top products
- `GET /api/v1/software/:id` - Get software by ID
- `GET /api/v1/software/slug/:slug` - Get software by slug
- `POST /api/v1/software` - Create new software (auth required)
- `PUT /api/v1/software/:id` - Update software (auth required)
- `DELETE /api/v1/software/:id` - Delete software (auth required)

### Featured Softwares Query Parameters
- `page` (integer): Page number for pagination (default: 1)
- `limit` (integer): Number of softwares per page (default: 10, max: 100)
- `productsPerSoftware` (integer): Number of top products per software (default: 4, max: 20)
- `minRating` (number): Minimum rating filter for products (default: 0, max: 5)
- `sortBy` (string): Sort field - `createdAt`, `avgRating`, `totalReviews`, `productCount`, `name`
- `sortOrder` (string): Sort order - `asc` or `desc`

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=8081
NODE_ENV=development
JWT_SECRET=your-jwt-secret
MONGODB_URI=mongodb://localhost:27017/xuthority
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket
```

## Database

The application uses MongoDB with the following main collections:
- `softwares` - Software entries
- `products` - Product information with software associations
- `users` - User accounts and authentication
- `productreviews` - Product reviews and ratings
- `industries` - Industry categories
- `integrations` - Integration options

## Testing

Run the test suite:
```bash
npm test
```

## API Documentation

- Swagger UI: `http://localhost:8081/api-docs`
- OpenAPI Spec: `http://localhost:8081/swagger.json`

## Architecture

- **MVC Pattern**: Clean separation of concerns
- **Service Layer**: Business logic abstraction
- **Middleware**: Authentication, validation, error handling
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: AWS S3 integration
- **Caching**: Redis for performance optimization

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 