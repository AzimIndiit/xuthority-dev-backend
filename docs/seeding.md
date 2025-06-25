# Database Seeding & Migration Guide

This guide covers the comprehensive database seeding and migration system for the Xuthority backend application.

## Table of Contents

- [Overview](#overview)
- [Seeding System](#seeding-system)
- [Migration System](#migration-system)
- [Available Commands](#available-commands)
- [Data Structure](#data-structure)
- [Troubleshooting](#troubleshooting)

## Overview

The Xuthority application includes a robust seeding and migration system that provides:

- **Comprehensive Test Data**: Realistic sample data for all modules
- **Automated Admin User Creation**: Creates admin user with proper credentials
- **Database Indexing**: Optimized indexes for performance
- **Data Validation**: Integrity checks and validation
- **Flexible Execution**: Run all modules or specific ones
- **Safe Operations**: Dry-run support and proper error handling

## Seeding System

### What Gets Seeded

The seeding system populates the following modules with realistic data:

| Module | Description | Sample Count |
|--------|-------------|--------------|
| **Languages** | Programming languages (JavaScript, Python, Java, etc.) | ~30 items |
| **Industries** | Software & Solution categories | ~45 items |
| **Integrations** | Popular tools and services with images | ~50 items |
| **Market Segments** | Business segments and target markets | ~55 items |
| **User Roles** | Professional roles (CEO, Developer, etc.) | ~100 items |
| **Software** | Popular software tools and applications | ~20 items |
| **Solutions** | Consulting and development solutions | ~25 items |

### Admin User

The seeding process automatically creates an admin user:

```
Email: admin@xuthority.com
Password: Admin123!@#
Role: admin
Status: active, verified
```

⚠️ **Security Note**: Change the admin password immediately in production!

### Sample Data Quality

All seed data includes:
- **Realistic Names**: Actual software, tools, and technologies
- **Proper Descriptions**: Detailed, professional descriptions
- **Categorization**: Proper categories and classifications
- **Status Variety**: Mix of active and inactive items
- **Relationships**: Proper user associations (createdBy fields)
- **SEO-Friendly Slugs**: Auto-generated using slugify library

## Migration System

The migration system handles:

### Database Indexes

Automatically creates optimized indexes for:
- **Unique Fields**: name, email, slug
- **Query Fields**: status, category, complexity
- **Sorting Fields**: createdAt, updatedAt
- **Reference Fields**: createdBy, userId
- **Compound Indexes**: Multi-field indexes for complex queries

### Data Integrity

Validates:
- Required field presence
- Proper schema compliance
- Reference integrity
- Duplicate detection

### Statistics

Provides comprehensive database statistics:
- Document counts per collection
- Total database size
- Index information
- Performance metrics

## Available Commands

### Seeding Commands

```bash
# Seed all modules (recommended)
npm run seed

# Clear database only (no seeding)
npm run seed:clear

# Seed specific modules
npm run seed:languages
npm run seed:industries
npm run seed:integrations
npm run seed:market-segments
npm run seed:user-roles
npm run seed:software
npm run seed:solutions
```

### Migration Commands

```bash
# Run full migration
npm run migrate

# Dry run (preview changes without applying)
npm run migrate:dry-run
```

### Advanced Usage

```bash
# Direct script execution with options
node scripts/seed.js --clear-only
node scripts/seed.js --module=languages
node scripts/migrate.js --dry-run
```

## Data Structure

### Sample Software Entry

```json
{
  "name": "Visual Studio Code",
  "slug": "visual-studio-code",
  "description": "A lightweight but powerful source code editor...",
  "features": ["IntelliSense", "Debugging", "Built-in Git"],
  "technologies": ["Electron", "TypeScript", "Node.js"],
  "category": "Development Tools",
  "pricing": "Free",
  "website": "https://code.visualstudio.com",
  "status": "active",
  "createdBy": "ObjectId(...)",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Sample Solution Entry

```json
{
  "name": "AWS Cloud Migration",
  "slug": "aws-cloud-migration",
  "description": "Complete migration of legacy systems...",
  "deliverables": ["Migration Assessment", "Infrastructure Design"],
  "timeline": "12-16 weeks",
  "teamSize": "4-6 specialists",
  "complexity": "high",
  "category": "Cloud Migration",
  "pricing": "Custom Quote",
  "status": "active",
  "createdBy": "ObjectId(...)",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Sample Integration Entry

```json
{
  "name": "GitHub",
  "slug": "github",
  "image": "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
  "status": "active",
  "createdBy": "ObjectId(...)",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Execution Flow

### Seeding Process

1. **Database Connection**: Establish MongoDB connection
2. **Admin User Setup**: Create or verify admin user exists
3. **Module Seeding**: Process each module sequentially:
   - Clear existing data for the module
   - Create new documents with admin user reference
   - Generate unique slugs using slugify
   - Log progress and statistics
4. **Summary Report**: Display comprehensive results
5. **Cleanup**: Close database connections

### Migration Process

1. **Database Connection**: Establish MongoDB connection
2. **Index Creation**: Create optimized indexes for all collections
3. **Data Validation**: Check for integrity issues
4. **Statistics Generation**: Analyze database state
5. **Reporting**: Display results and recommendations
6. **Cleanup**: Close database connections

## Performance Considerations

### Seeding Performance

- **Sequential Processing**: Modules are seeded one at a time for data integrity
- **Batch Operations**: Individual documents created with proper error handling
- **Memory Management**: Efficient memory usage with streaming where possible
- **Progress Tracking**: Real-time progress reporting

### Migration Performance

- **Background Indexing**: Indexes created in background to avoid blocking
- **Dry Run Support**: Test operations without actual changes
- **Error Recovery**: Graceful handling of index creation conflicts
- **Resource Management**: Optimal resource utilization

## Best Practices

### Development Workflow

1. **Fresh Setup**: `npm run seed` for complete database setup
2. **Module Development**: Use specific module commands for focused testing
3. **Performance Testing**: Run `npm run migrate` after schema changes
4. **Data Validation**: Use dry-run commands to preview changes

### Production Considerations

1. **Backup First**: Always backup production data before migrations
2. **Test Environment**: Test seeding/migration in staging environment
3. **Gradual Rollout**: Consider gradual deployment of schema changes
4. **Monitoring**: Monitor performance after index creation

## Troubleshooting

### Common Issues

#### Connection Errors

```bash
Error: MongoServerSelectionTimeoutError
```

**Solution**: Check MongoDB connection string and ensure database is running.

#### Duplicate Key Errors

```bash
Error: E11000 duplicate key error
```

**Solution**: Clear existing data with `npm run seed:clear` before seeding.

#### Memory Issues

```bash
Error: JavaScript heap out of memory
```

**Solution**: Increase Node.js memory limit:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run seed
```

#### Permission Errors

```bash
Error: MongoError: not authorized
```

**Solution**: Verify database credentials and user permissions.

### Debug Commands

```bash
# Enable debug logging
DEBUG=* npm run seed

# Verbose migration output
npm run migrate:dry-run

# Check database statistics
npm run migrate
```

### Validation Checks

```bash
# Verify seeded data
node -e "
const { mongoose } = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const collections = ['languages', 'industries', 'software'];
  for (const col of collections) {
    const count = await mongoose.connection.db.collection(col).countDocuments();
    console.log(\`\${col}: \${count} documents\`);
  }
  process.exit(0);
});
"
```

## Security Considerations

### Admin User Security

- **Change Default Password**: Immediately change admin password in production
- **Strong Authentication**: Use strong, unique passwords
- **Role Management**: Review and adjust admin permissions as needed

### Database Security

- **Connection Security**: Use encrypted connections (SSL/TLS)
- **Access Control**: Implement proper database access controls
- **Audit Logging**: Enable audit logging for production environments

### Data Privacy

- **Sensitive Data**: Avoid seeding with real user data
- **Anonymization**: Use placeholder data for testing
- **Compliance**: Ensure seeded data complies with privacy regulations

## Support

For issues related to seeding and migration:

1. Check this documentation first
2. Review error logs and console output
3. Verify database connectivity and permissions
4. Test with dry-run commands
5. Contact the development team with specific error messages

---

**Last Updated**: January 2024  
**Version**: 1.0.0 