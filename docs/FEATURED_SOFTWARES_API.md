# Featured Softwares API

## Overview
This API provides access to featured softwares with their top-rated products. It returns active softwares along with their highest-rated products, ensuring each software has at least one product.

## Endpoint

### GET /api/v1/software/featured-with-products

Get featured softwares with their top-rated products.

**Method:** GET  
**Access:** Public  
**Rate Limit:** Standard rate limiting applies

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination (min: 1) |
| `limit` | integer | 10 | Number of softwares per page (min: 1, max: 100) |
| `productsPerSoftware` | integer | 4 | Number of top products to return per software (min: 1, max: 20) |
| `minRating` | number | 0 | Minimum rating filter for products (min: 0, max: 5) |
| `sortBy` | string | "createdAt" | Sort field: `createdAt`, `avgRating`, `totalReviews`, `productCount`, `name` |
| `sortOrder` | string | "desc" | Sort order: `asc` or `desc` |

## Response Format

```json
{
  "success": true,
  "data": [
    {
      "software": {
        "_id": "string",
        "name": "string",
        "slug": "string",
        "status": "active",
        "createdBy": {
          "firstName": "string",
          "lastName": "string",
          "email": "string"
        },
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      },
      "topProducts": [
        {
          "_id": "string",
          "name": "string",
          "slug": "string",
          "description": "string",
          "logoUrl": "string",
          "websiteUrl": "string",
          "avgRating": 4.5,
          "totalReviews": 25,
          "views": 150,
          "likes": 10,
          "status": "published",
          "isActive": "active",
          "isFeatured": true,
          "userId": {
            "firstName": "string",
            "lastName": "string",
            "companyName": "string",
            "email": "string"
          },
          "industries": [
            {
              "name": "string",
              "slug": "string",
              "status": "active"
            }
          ],
          "languages": [
            {
              "name": "string",
              "slug": "string",
              "status": "active"
            }
          ],
          "integrations": [
            {
              "name": "string",
              "image": "string",
              "status": "active"
            }
          ],
          "marketSegment": [
            {
              "name": "string",
              "slug": "string",
              "status": "active"
            }
          ],
          "whoCanUse": [
            {
              "name": "string",
              "slug": "string",
              "status": "active"
            }
          ],
          "solutionIds": [
            {
              "name": "string",
              "slug": "string",
              "status": "active"
            }
          ],
          "createdAt": "2023-01-01T00:00:00.000Z",
          "updatedAt": "2023-01-01T00:00:00.000Z"
        }
      ],
      "productCount": 4,
      "hasMinimumProducts": true
    }
  ],
  "message": "Featured softwares with top products retrieved successfully",
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "meta": {
    "totalSoftwaresWithProducts": 45,
    "productsPerSoftware": 4,
    "minRating": 0,
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
}
```

## Example Requests

### Basic Request
```bash
curl -X GET "http://localhost:3000/api/v1/software/featured-with-products"
```

### With Query Parameters
```bash
curl -X GET "http://localhost:3000/api/v1/software/featured-with-products?page=2&limit=5&productsPerSoftware=6&minRating=3.5&sortBy=avgRating&sortOrder=desc"
```

### JavaScript/Axios Example
```javascript
// Basic request
const response = await axios.get('/api/v1/software/featured-with-products');

// With parameters
const response = await axios.get('/api/v1/software/featured-with-products', {
  params: {
    page: 1,
    limit: 10,
    productsPerSoftware: 6,
    minRating: 3.0,
    sortBy: 'avgRating',
    sortOrder: 'desc'
  }
});
```

## Response Fields Explained

### Software Object
- `_id`: Unique identifier for the software
- `name`: Name of the software
- `slug`: URL-friendly version of the software name
- `status`: Current status (always "active" for featured softwares)
- `createdBy`: User who created the software entry

### Top Products Array
- Each product is fully populated with related data
- Products are sorted by `avgRating` (descending) then `totalReviews` (descending)
- Only includes products with status "published" or "approved" and isActive "active"
- Includes all related entities (industries, languages, integrations, etc.)

### Meta Information
- `totalSoftwaresWithProducts`: Total number of softwares that have at least one product
- `productsPerSoftware`: Number of products returned per software
- `minRating`: Minimum rating filter applied
- `sortBy`: Field used for sorting
- `sortOrder`: Sort direction

## Filtering Logic

1. **Software Filter**: Only active softwares are included
2. **Product Filter**: Only published/approved and active products are included
3. **Rating Filter**: Products below `minRating` are excluded
4. **Minimum Products**: Only softwares with at least one product are returned
5. **Product Limit**: Maximum `productsPerSoftware` products per software

## Sorting Options

| Sort Field | Description |
|------------|-------------|
| `createdAt` | Sort by software creation date |
| `avgRating` | Sort by average rating of software's top products |
| `totalReviews` | Sort by total reviews of software's top products |
| `productCount` | Sort by number of products per software |
| `name` | Sort by software name alphabetically |

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Validation error message",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "details": [
      "Products per software must be between 1 and 20"
    ]
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "message": "Failed to fetch featured softwares with top products",
    "code": "FEATURED_SOFTWARES_FETCH_FAILED",
    "statusCode": 500
  }
}
```

## Use Cases

1. **Homepage Featured Section**: Display top softwares with their best products
2. **Software Discovery**: Help users find quality software based on product ratings
3. **Product Recommendations**: Show related products within software categories
4. **Analytics Dashboard**: Track software performance based on product ratings

## Performance Considerations

- Results are paginated to avoid large response sizes
- Database queries are optimized with proper indexing
- Related data is efficiently populated in single queries
- Response includes metadata for client-side pagination

## Notes

- Only softwares with at least one product will be returned
- Products are pre-filtered for quality (published/approved status)
- The API respects the relationship between softwares and products
- All timestamps are in ISO 8601 format (UTC)
- Response times may vary based on the number of products and complexity of filters 