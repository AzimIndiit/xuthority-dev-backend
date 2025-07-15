# Product Soft Delete Implementation

## Overview
This document describes the implementation of soft delete functionality for products in the Xuthority platform. Instead of permanently deleting products, they are marked as `inactive` and can be restored later.

## Database Schema
The Product model already includes an `isActive` field:
```javascript
isActive: {
  type: String,
  enum: ["active", "inactive"],
  default: "active",
  index: true,
}
```

## API Endpoints

### 1. Delete Product (Soft Delete)
- **Endpoint**: `DELETE /api/v1/products/:id`
- **Method**: Soft delete by setting `isActive` to `inactive`
- **Access**: Private (Vendor only - own products)
- **Response**: Returns updated product with `isActive: "inactive"`

### 2. Restore Product
- **Endpoint**: `PUT /api/v1/products/:id/restore`
- **Method**: Reactivate by setting `isActive` to `active`
- **Access**: Private (Admin only)
- **Response**: Returns updated product with `isActive: "active"`

### 3. Get Deleted Products
- **Endpoint**: `GET /api/v1/products/my/deleted`
- **Method**: List deleted products
- **Access**: Private (Admin only)
- **Response**: Paginated list of inactive products

## Implementation Details

### Service Layer Changes
**File**: `src/services/productService.js`

#### deleteProduct Function
```javascript
const deleteProduct = async (productId, userId) => {
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 404);
  }

  // Check if product is already inactive
  if (product.isActive === 'inactive') {
    throw new ApiError('Product is already deleted', 'PRODUCT_ALREADY_DELETED', 400);
  }

  // Check ownership
  const isOwner = product.userId?.toString() === userId || 
                 product.vendor?.toString() === userId;
  
  if (!isOwner) {
    throw new ApiError('You can only delete your own products', 'UNAUTHORIZED_DELETE', 403);
  }

  // Soft delete: set isActive to inactive
  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    { 
      isActive: 'inactive',
      lastUpdated: new Date()
    },
    { new: true }
  ).populate('userId', 'firstName lastName companyName email');
  
  return updatedProduct;
};
```

#### restoreProduct Function
```javascript
const restoreProduct = async (productId, userId) => {
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 404);
  }

  // Check if product is already active
  if (product.isActive === 'active') {
    throw new ApiError('Product is already active', 'PRODUCT_ALREADY_ACTIVE', 400);
  }

  // Check ownership
  const isOwner = product.userId?.toString() === userId || 
                 product.vendor?.toString() === userId;
  
  if (!isOwner) {
    throw new ApiError('You can only restore your own products', 'UNAUTHORIZED_RESTORE', 403);
  }

  // Restore: set isActive to active
  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    { 
      isActive: 'active',
      lastUpdated: new Date()
    },
    { new: true }
  ).populate('userId', 'firstName lastName companyName email');
  
  return updatedProduct;
};
```

### Controller Layer Changes
**File**: `src/controllers/productController.js`

#### Updated deleteProduct Controller
- Returns updated product instead of success message
- Updates vendor's `totalProducts` count (-1)
- Logs soft delete action
- Returns message: "Product has been deactivated successfully"

#### New restoreProduct Controller (Admin Only)
- Validates admin access first
- Validates request parameters
- Calls `productService.restoreProduct()`
- Updates vendor's `totalProducts` count (+1)
- Logs restore action
- Returns message: "Product has been restored successfully"

#### New getMyDeletedProducts Controller (Admin Only)
- Validates admin access first
- Lists deleted products (`isActive: 'inactive'`)
- Supports pagination and sorting
- Sorted by `lastUpdated` by default (most recently deleted first)

### Route Changes
**File**: `src/routes/products.js`

#### Added Routes
```javascript
// Restore product
router.put('/:id/restore', 
  auth,
  productValidator.delete,
  validate(productValidator.delete, 'params'),
  productController.restoreProduct
);

// Get my deleted products
router.get('/my/deleted', 
  auth,
  productValidator.query,
  validate(productValidator.query, 'query'),
  productController.getMyDeletedProducts
);
```

## Error Handling

### New Error Codes
- `PRODUCT_ALREADY_DELETED`: Attempting to delete an already inactive product
- `PRODUCT_ALREADY_ACTIVE`: Attempting to restore an already active product
- `UNAUTHORIZED_RESTORE`: Attempting to restore someone else's product
- `ADMIN_ACCESS_REQUIRED`: Non-admin user trying to access admin-only functionality

### Error Messages
- Delete already deleted: "Product is already deleted"
- Restore already active: "Product is already active"
- Unauthorized restore: "You can only restore your own products"
- Admin access required: "Access denied. Only admins can view/restore deleted products."

## Public API Behavior
- Public product listings (`GET /api/v1/products/active`) continue to filter `isActive: 'active'`
- Inactive products are not visible in public listings
- Search results exclude inactive products
- Product details API returns 404 for inactive products (unless accessed by admin)
- **Only admin users can view inactive products**

## Database Queries
All existing queries that should exclude deleted products already filter by `isActive: 'active'`:
- Public product listings
- Search functionality
- Featured products
- Category browsing
- Favorites system

## User Access Control
### Regular Users and Vendors:
- Can only view active products (`isActive: 'active'`)
- Cannot access inactive products via any endpoint
- Get 404 error when trying to access inactive products by ID or slug
- Product listings automatically filter out inactive products

### Admin Users:
- Can view both active and inactive products
- Can access inactive products via ID or slug
- Can restore deleted products via `PUT /api/v1/products/:id/restore`
- Can view deleted products via `GET /api/v1/products/my/deleted`
- The `totalProducts` count is automatically updated on delete/restore

## Benefits
1. **Data Preservation**: No data loss from accidental deletions
2. **Audit Trail**: Maintains complete product history
3. **Easy Recovery**: Simple restoration process
4. **Performance**: Minimal impact on existing queries
5. **Compliance**: Helps with data retention requirements

## Testing
The implementation includes comprehensive error handling and has been tested for:
- ✅ Soft delete functionality
- ✅ Restore functionality  
- ✅ Error cases (already deleted, already active)
- ✅ Ownership validation
- ✅ Public API filtering
- ✅ Vendor product management

## Migration Notes
- No database migration required (schema already supports `isActive` field)
- Existing products default to `active` status
- Backward compatible with existing API consumers
- All existing filtering logic remains intact 