# xuthority-dev Backend

A scalable, secure Node.js/Express backend following strict MVC, clean architecture, and enterprise DevOps standards.

## Features
- Strict MVC and service layer separation
- MongoDB (Mongoose) integration
- JWT authentication & role-based authorization
- Secure file uploads (S3, Multer, Sharp)
- Rate limiting, CORS, Helmet, input validation
- Centralized error handling & logging (Winston)
- Redis caching
- Swagger/OpenAPI documentation
- Jest & Supertest for testing
- Dockerized for local/prod

## Project Structure
```
src/
  config/         # App configs (db, AWS, Redis, logger, etc.)
  controllers/    # HTTP controllers (thin)
  models/         # Mongoose models
  routes/         # Express routes
  middleware/     # Auth, validation, error, logging, etc.
  services/       # Business logic
  utils/          # Helpers, error/response utils
  validators/     # express-validator schemas
  jobs/           # Background jobs/queues
  database/       # Seeds, migrations, indexes
  events/         # Event handlers
  monitoring/     # Metrics, health
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- AWS S3 credentials (for file uploads)
- Redis (for caching)
- Docker (optional, for containerization)

### Setup
1. Clone the repo:
   ```sh
   git clone <repo-url>
   cd xuthority-dev
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Copy and configure environment variables:
   ```sh
   cp .env.example .env
   # Edit .env with your values
   ```
4. Start MongoDB, Redis, and (optionally) S3 localstack.
5. Run the app:
   ```sh
   npm run dev
   ```

### Scripts
- `npm run dev` - Start with nodemon
- `npm start` - Start in production
- `npm test` - Run tests
- `npm run lint` - Lint code

## API Documentation
- Swagger UI: `/api-docs`
- Postman collection: `postman/collection.json`

## License
MIT 