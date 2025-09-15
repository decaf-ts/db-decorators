![Banner](./workdocs/assets/Banner.png)
### DB-Decorators: Database Operations Made Simple

The db-decorators library provides a comprehensive set of TypeScript decorators and utilities for database operations. It implements the repository pattern with support for model definition, validation, identity management, and operation hooks. The library enables developers to define database models with decorators, perform CRUD operations with validation, and customize behavior during database operations through operation hooks.



![Licence](https://img.shields.io/github/license/decaf-ts/db-decorators.svg?style=plastic)
![GitHub language count](https://img.shields.io/github/languages/count/decaf-ts/db-decorators?style=plastic)
![GitHub top language](https://img.shields.io/github/languages/top/decaf-ts/db-decorators?style=plastic)

[![Build & Test](https://github.com/decaf-ts/db-decorators/actions/workflows/nodejs-build-prod.yaml/badge.svg)](https://github.com/decaf-ts/db-decorators/actions/workflows/nodejs-build-prod.yaml)
[![CodeQL](https://github.com/decaf-ts/db-decorators/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/decaf-ts/db-decorators/actions/workflows/codeql-analysis.yml)[![Snyk Analysis](https://github.com/decaf-ts/db-decorators/actions/workflows/snyk-analysis.yaml/badge.svg)](https://github.com/decaf-ts/db-decorators/actions/workflows/snyk-analysis.yaml)
[![Pages builder](https://github.com/decaf-ts/db-decorators/actions/workflows/pages.yaml/badge.svg)](https://github.com/decaf-ts/db-decorators/actions/workflows/pages.yaml)
[![.github/workflows/release-on-tag.yaml](https://github.com/decaf-ts/db-decorators/actions/workflows/release-on-tag.yaml/badge.svg?event=release)](https://github.com/decaf-ts/db-decorators/actions/workflows/release-on-tag.yaml)

![Open Issues](https://img.shields.io/github/issues/decaf-ts/db-decorators.svg)
![Closed Issues](https://img.shields.io/github/issues-closed/decaf-ts/db-decorators.svg)
![Pull Requests](https://img.shields.io/github/issues-pr-closed/decaf-ts/db-decorators.svg)
![Maintained](https://img.shields.io/badge/Maintained%3F-yes-green.svg)

![Forks](https://img.shields.io/github/forks/decaf-ts/db-decorators.svg)
![Stars](https://img.shields.io/github/stars/decaf-ts/db-decorators.svg)
![Watchers](https://img.shields.io/github/watchers/decaf-ts/db-decorators.svg)

![Node Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2Fbadges%2Fshields%2Fmaster%2Fpackage.json&label=Node&query=$.engines.node&colorB=blue)
![NPM Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2Fbadges%2Fshields%2Fmaster%2Fpackage.json&label=NPM&query=$.engines.npm&colorB=purple)

Documentation available [here](https://decaf-ts.github.io/db-decorators/)


### DB-Decorators

The db-decorators library is a powerful TypeScript framework for database operations that leverages decorators to simplify database interactions. It provides a comprehensive solution for implementing the repository pattern with built-in support for model definition, validation, identity management, and operation hooks.

#### Key Features

1. **Repository Pattern Implementation**
  - Abstract `BaseRepository` class providing the foundation for CRUD operations
  - Concrete `Repository` class with validation support
  - Support for bulk operations through the `BulkCrudOperator` interface

2. **Model Management**
  - Model definition with TypeScript decorators
  - Identity management with the `@id()` decorator
  - Property composition with `@composed()` and `@composedFromKeys()` decorators
  - Versioning support with the `@version()` decorator
  - Transient properties with the `@transient()` decorator

3. **Operation Hooks**
  - Pre-operation hooks with `@on()`, `@onCreate()`, `@onUpdate()`, etc.
  - Post-operation hooks with `@after()`, `@afterCreate()`, `@afterUpdate()`, etc.
  - Custom operation handlers through the `Operations` registry

4. **Context Management**
  - Hierarchical context chains with parent-child relationships
  - Context accumulation for state management
  - Operation-specific context creation

5. **Validation**
  - Integration with decorator-validation library
  - Automatic validation during CRUD operations
  - Custom validation rules through decorators

The library is designed to be extensible and adaptable to different database backends, providing a consistent API regardless of the underlying storage mechanism.


### How to Use

- [Initial Setup](./workdocs/tutorials/For%20Developers.md#_initial-setup_)
- [Installation](./workdocs/tutorials/For%20Developers.md#installation)

## DB-Decorators Examples

### 1. Defining Models with Decorators

#### Basic Model Definition

Description: Create a User model with ID, name, email, and password fields. The ID is marked as required and readonly, the password is hashed, and the email is required.

```typescript
import { Model } from "@decaf-ts/decorator-validation";
import { id, hash, version, transient } from "@decaf-ts/db-decorators";
import { required, minLength, email as emailValidator } from "@decaf-ts/decorator-validation";

class User extends Model {
  @id()
  id: string;

  @required()
  @minLength(3)
  name: string;

  @required()
  @emailValidator()
  email: string;

  @required()
  @minLength(8)
  @hash()
  password: string;

  @version()
  version: number;

  @transient()
  temporaryData: any;
}
```

#### Composed Properties

Description: Create a Product model with a SKU that is automatically composed from other properties.

```typescript
import { Model } from "@decaf-ts/decorator-validation";
import { id, composed, composedFromKeys } from "@decaf-ts/db-decorators";
import { required } from "@decaf-ts/decorator-validation";

class Product extends Model {
  @id()
  id: string;

  @required()
  category: string;

  @required()
  name: string;

  @required()
  variant: string;

  @composed(['category', 'name', 'variant'], '-')
  sku: string;

  @composedFromKeys(['category', 'name'], '_', true, 'PROD_', '_KEY')
  productKey: string;
}
```

### 2. Implementing Repositories

#### Basic Repository Implementation

Description: Create a repository for the User model that implements the required CRUD operations.

```typescript
import { Repository } from "@decaf-ts/db-decorators";
import { User } from "./models/User";

class UserRepository extends Repository<User> {
  constructor() {
    super(User);
  }

  async create(model: User, ...args: any[]): Promise<User> {
    // Implementation for creating a user in the database
    console.log(`Creating user: ${model.name}`);
    // Assign an ID if not already present
    if (!model.id) {
      model.id = Date.now().toString();
    }
    return model;
  }

  async read(key: string | number, ...args: any[]): Promise<User> {
    // Implementation for reading a user from the database
    console.log(`Reading user with ID: ${key}`);
    return new User({ id: key, name: "Example User", email: "user@example.com" });
  }

  async update(model: User, ...args: any[]): Promise<User> {
    // Implementation for updating a user in the database
    console.log(`Updating user: ${model.name}`);
    return model;
  }

  async delete(key: string | number, ...args: any[]): Promise<User> {
    // Implementation for deleting a user from the database
    console.log(`Deleting user with ID: ${key}`);
    const user = await this.read(key);
    return user;
  }
}
```

#### Using Bulk Operations

Description: Implement bulk operations for efficient batch processing of multiple models.

```typescript
import { Repository } from "@decaf-ts/db-decorators";
import { Product } from "./models/Product";

class ProductRepository extends Repository<Product> {
  constructor() {
    super(Product);
  }

  // Implement required CRUD methods
  async create(model: Product, ...args: any[]): Promise<Product> {
    // Implementation
    return model;
  }

  async read(key: string | number, ...args: any[]): Promise<Product> {
    // Implementation
    return new Product({ id: key });
  }

  async update(model: Product, ...args: any[]): Promise<Product> {
    // Implementation
    return model;
  }

  async delete(key: string | number, ...args: any[]): Promise<Product> {
    // Implementation
    return await this.read(key);
  }

  // Override bulk methods for optimized implementation
  async createAll(models: Product[], ...args: any[]): Promise<Product[]> {
    console.log(`Bulk creating ${models.length} products`);
    // Custom implementation for bulk creation
    return models.map(model => {
      if (!model.id) {
        model.id = Date.now().toString();
      }
      return model;
    });
  }

  async readAll(keys: string[] | number[], ...args: any[]): Promise<Product[]> {
    console.log(`Bulk reading ${keys.length} products`);
    // Custom implementation for bulk reading
    return keys.map(key => new Product({ id: key }));
  }
}
```

### 3. Using Operation Hooks

#### Property Transformation Hooks

Description: Use operation hooks to transform property values during database operations.

```typescript
import { Model } from "@decaf-ts/decorator-validation";
import { id, onCreate, onUpdate, onCreateUpdate } from "@decaf-ts/db-decorators";
import { required } from "@decaf-ts/decorator-validation";

// Handler function for setting creation timestamp
function setCreationTimestamp(repo, context, data, key, model) {
  model[key] = new Date().toISOString();
}

// Handler function for setting update timestamp
function setUpdateTimestamp(repo, context, data, key, model) {
  model[key] = new Date().toISOString();
}

// Handler function for normalizing email
function normalizeEmail(repo, context, data, key, model) {
  if (model[key]) {
    model[key] = model[key].toLowerCase().trim();
  }
}

class User extends Model {
  @id()
  id: string;

  @required()
  name: string;

  @required()
  @onCreateUpdate(normalizeEmail)
  email: string;

  @onCreate(setCreationTimestamp)
  createdAt: string;

  @onUpdate(setUpdateTimestamp)
  updatedAt: string;
}
```

#### Post-Operation Hooks

Description: Use post-operation hooks to perform actions after database operations.

```typescript
import { Model } from "@decaf-ts/decorator-validation";
import { id, afterCreate, afterUpdate, afterDelete } from "@decaf-ts/db-decorators";

// Handler function for logging after creation
function logCreation(repo, context, data, key, model) {
  console.log(`User created: ${model.id} - ${model.name}`);
}

// Handler function for logging after update
function logUpdate(repo, context, data, key, model) {
  console.log(`User updated: ${model.id} - ${model.name}`);
}

// Handler function for logging after deletion
function logDeletion(repo, context, data, key, model) {
  console.log(`User deleted: ${model.id} - ${model.name}`);
}

class User extends Model {
  @id()
  id: string;

  @required()
  name: string;

  @required()
  email: string;

  @afterCreate(logCreation)
  @afterUpdate(logUpdate)
  @afterDelete(logDeletion)
  _log: any; // This property is just a placeholder for the decorators
}
```

### 4. Working with Contexts

#### Creating and Using Contexts

Description: Create and use contexts to manage operation state and configuration.

```typescript
import { Context, Repository } from "@decaf-ts/db-decorators";
import { User } from "./models/User";

class UserRepository extends Repository<User> {
  constructor() {
    super(User);
  }

  // Implement required CRUD methods
  async create(model: User, ...args: any[]): Promise<User> {
    // Implementation
    return model;
  }

  async read(key: string | number, ...args: any[]): Promise<User> {
    // Implementation
    return new User({ id: key });
  }

  async update(model: User, ...args: any[]): Promise<User> {
    // Implementation
    return model;
  }

  async delete(key: string | number, ...args: any[]): Promise<User> {
    // Implementation
    return await this.read(key);
  }

  // Example of using context
  async createWithAudit(model: User, userId: string): Promise<User> {
    // Create a context with audit information
    const context = new Context().accumulate({
      auditUser: userId,
      auditTimestamp: new Date(),
      skipValidation: false
    });

    // Pass the context to the create method
    return this.create(model, context);
  }
}

// Usage
const userRepo = new UserRepository();
const newUser = new User({ name: "John Doe", email: "john@example.com" });
const createdUser = await userRepo.createWithAudit(newUser, "admin123");
```

#### Context Hierarchies

Description: Create hierarchical contexts for complex operations.

```typescript
import { Context, OperationKeys } from "@decaf-ts/db-decorators";
import { User } from "./models/User";

// Create a parent context
const parentContext = new Context().accumulate({
  transactionId: "tx123",
  batchOperation: true
});

// Create a child context for a specific operation
const childContext = parentContext.child<User, Context<any>>(
  OperationKeys.CREATE,
  User
).accumulate({
  operationId: "op456",
  validationLevel: "strict"
});

// Access values from the context hierarchy
console.log(childContext.get("transactionId")); // "tx123" (inherited from parent)
console.log(childContext.get("operationId")); // "op456" (from child)
```

### 5. Performing CRUD Operations

#### Basic CRUD Operations

Description: Perform basic CRUD operations using a repository.

```typescript
import { User } from "./models/User";
import { UserRepository } from "./repositories/UserRepository";

async function userCrudExample() {
  const userRepo = new UserRepository();

  // Create a new user
  const newUser = new User({
    name: "Alice Smith",
    email: "alice@example.com",
    password: "securePassword123"
  });
  const createdUser = await userRepo.create(newUser);
  console.log("Created user:", createdUser);

  // Read a user
  const userId = createdUser.id;
  const retrievedUser = await userRepo.read(userId);
  console.log("Retrieved user:", retrievedUser);

  // Update a user
  retrievedUser.name = "Alice Johnson";
  const updatedUser = await userRepo.update(retrievedUser);
  console.log("Updated user:", updatedUser);

  // Delete a user
  const deletedUser = await userRepo.delete(userId);
  console.log("Deleted user:", deletedUser);
}
```

#### Bulk Operations

Description: Perform bulk operations for efficient batch processing.

```typescript
import { Product } from "./models/Product";
import { ProductRepository } from "./repositories/ProductRepository";

async function productBulkExample() {
  const productRepo = new ProductRepository();

  // Create multiple products
  const products = [
    new Product({ category: "Electronics", name: "Laptop", variant: "15-inch" }),
    new Product({ category: "Electronics", name: "Laptop", variant: "13-inch" }),
    new Product({ category: "Electronics", name: "Smartphone", variant: "Pro" })
  ];
  const createdProducts = await productRepo.createAll(products);
  console.log("Created products:", createdProducts);

  // Read multiple products
  const productIds = createdProducts.map(p => p.id);
  const retrievedProducts = await productRepo.readAll(productIds);
  console.log("Retrieved products:", retrievedProducts);

  // Update multiple products
  const updatedProducts = retrievedProducts.map(p => {
    p.name = p.name + " (Updated)";
    return p;
  });
  const savedProducts = await productRepo.updateAll(updatedProducts);
  console.log("Updated products:", savedProducts);

  // Delete multiple products
  const deletedProducts = await productRepo.deleteAll(productIds);
  console.log("Deleted products:", deletedProducts);
}
```

### 6. Validation

#### Model Validation

Description: Validate models during CRUD operations to ensure data integrity.

```typescript
import { Model, ModelErrorDefinition } from "@decaf-ts/decorator-validation";
import { id } from "@decaf-ts/db-decorators";
import { required, minLength, maxLength, email, pattern } from "@decaf-ts/decorator-validation";

class User extends Model {
  @id()
  id: string;

  @required()
  @minLength(2)
  @maxLength(50)
  name: string;

  @required()
  @email()
  emailAddress: string;

  @required()
  @minLength(8)
  @pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")
  password: string;

  // Manual validation example
  hasErrors(): ModelErrorDefinition | undefined {
    const errors = super.hasErrors();
    
    // Add custom validation logic
    if (this.name && this.name.includes('admin') && !this.emailAddress.includes('admin')) {
      if (!errors) {
        return {
          name: ["Admin users must have an admin email address"]
        };
      }
      errors.name = errors.name || [];
      errors.name.push("Admin users must have an admin email address");
    }
    
    return errors;
  }
}

// Usage in a repository
class UserRepository extends Repository<User> {
  // ... other methods
  
  async create(model: User, ...args: any[]): Promise<User> {
    // The Repository class will automatically validate the model
    // and throw a ValidationError if validation fails
    
    // Custom validation can also be performed
    const errors = model.hasErrors();
    if (errors) {
      throw new ValidationError(errors.toString());
    }
    
    // Proceed with creation if validation passes
    return model;
  }
}
```

### 7. Identity Management

#### Working with Model IDs

Description: Use the identity module to work with model IDs.

```typescript
import { Model } from "@decaf-ts/decorator-validation";
import { id } from "@decaf-ts/db-decorators";
import { findPrimaryKey, findModelId } from "@decaf-ts/db-decorators";

class Document extends Model {
  @id()
  documentId: string;
  
  title: string;
  content: string;
}

// Create a document instance
const doc = new Document({
  documentId: "doc-123",
  title: "Sample Document",
  content: "This is a sample document."
});

// Find the primary key property
const pkInfo = findPrimaryKey(doc);
console.log("Primary key property:", pkInfo.id); // "documentId"
console.log("Primary key metadata:", pkInfo.props);

// Get the primary key value
const docId = findModelId(doc);
console.log("Document ID:", docId); // "doc-123"

// Try to get ID from a model without an ID value
const emptyDoc = new Document();
try {
  const id = findModelId(emptyDoc); // Will throw an error
} catch (error) {
  console.error("Error:", error.message);
}

// Get ID with returnEmpty option
const emptyId = findModelId(emptyDoc, true); // Returns undefined instead of throwing
console.log("Empty ID:", emptyId);
```





### Related

[![decaf-ts](https://github-readme-stats.vercel.app/api/pin/?username=decaf-ts&repo=decaf-ts)](https://github.com/decaf-ts/decaf-ts)
[![decorator-validation](https://github-readme-stats.vercel.app/api/pin/?username=decaf-ts&repo=decorator-validation)](https://github.com/decaf-ts/decorator-validation)
[![reflection](https://github-readme-stats.vercel.app/api/pin/?username=decaf-ts&repo=Reflection)](https://github.com/decaf-ts/Reflection)


### Social

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/decaf-ts/)




#### Languages

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![ShellScript](https://img.shields.io/badge/Shell_Script-121011?style=for-the-badge&logo=gnu-bash&logoColor=white)

## Getting help

If you have bug reports, questions or suggestions please [create a new issue](https://github.com/decaf-ts/ts-workspace/issues/new/choose).

## Contributing

I am grateful for any contributions made to this project. Please read [this](./workdocs/98-Contributing.md) to get started.

## Supporting

The first and easiest way you can support it is by [Contributing](./workdocs/98-Contributing.md). Even just finding a typo in the documentation is important.

Financial support is always welcome and helps keep both me and the project alive and healthy.

So if you can, if this project in any way. either by learning something or simply by helping you save precious time, please consider donating.

## License

This project is released under the [MIT License](./LICENSE.md).

By developers, for developers...