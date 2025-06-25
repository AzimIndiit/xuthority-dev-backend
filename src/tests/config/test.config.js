module.exports = {
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/xuthority_test',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'test-jwt-secret-key',
    expiresIn: '1h'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379/1'
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test-access-key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test-secret-key',
    region: process.env.AWS_REGION || 'us-east-1',
    s3: {
      bucket: process.env.AWS_S3_BUCKET || 'test-bucket'
    }
  }
}; 