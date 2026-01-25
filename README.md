![Banner](./workdocs/assets/decaf-logo.svg)
### DB-Decorators: Database Operations Made Simple

The db-decorators library provides a comprehensive set of TypeScript decorators and utilities for database operations. It implements the repository pattern with support for model definition, validation, identity management, and operation hooks. The library enables developers to define database models with decorators, perform CRUD operations with validation, and customize behavior during database operations through operation hooks.

> Release docs refreshed on 2025-11-26. See [workdocs/reports/RELEASE_NOTES.md](./workdocs/reports/RELEASE_NOTES.md) for ticket summaries.

### Core Concepts

*   **`Repository`**: An abstract base class that implements the repository pattern, providing a consistent interface for CRUD operations.
*   **Operation Hooks**: The `Repository` class provides `Prefix` and `Suffix` methods for each CRUD operation, allowing you to execute custom logic before and after the main operation.
*   **Operation Decorators**: Decorators like `@onCreate`, `@onUpdate`, `@onDelete`, and `@onRead` allow you to attach custom logic to specific repository operations.
*   **`Context`**: A class for passing contextual information through the different layers of your application.
*   **Database-related Decorators**: A set of decorators for handling common database tasks, such as defining primary keys (`@id`), generating values (`@generated`), hashing values (`@hash`), composing values from other properties (`@composed`), and managing version numbers (`@version`).

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

Minimal size: 8.1 KB kb gzipped



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


# How to Use

This guide provides examples of how to use the main features of the `@decaf-ts/db-decorators` library.

## Repository

The `Repository` class is an abstract base class that implements the repository pattern.

### Creating a Repository

To create a repository, you need to extend the `Repository` class and implement the abstract CRUD methods.

```typescript
import { Repository, Model } from '@decaf-ts/db-decorators';
import { model, id, required } from '@decaf-ts/decorator-validation';

@model()
class User extends Model {
  @id()
  id: string;

  @required()
  name: string;
}

class UserRepository extends Repository<User, any> {
  constructor() {
    super(User);
  }

  async create(model: User): Promise<User> {
    // Implementation for creating a user
    return model;
  }

  async read(key: string): Promise<User> {
    // Implementation for reading a user
    return new User({ id: key, name: 'User' });
  }

  async update(model: User): Promise<User> {
    // Implementation for updating a user
    return model;
  }

  async delete(key: string): Promise<User> {
    // Implementation for deleting a user
    const model = await this.read(key);
    return model;
  }
}
```

### Operation Hooks

The `Repository` class provides `Prefix` and `Suffix` methods for each CRUD operation, allowing you to execute custom logic before and after the main operation.

```typescript
class UserRepository extends Repository<User, any> {
  // ...

  protected async createPrefix(model: User, ...args: any[]): Promise<[User, ...any[], any]> {
    console.log('Before creating user...');
    return [model, ...args];
  }

  protected async createSuffix(model: User, context: any): Promise<User> {
    console.log('After creating user...');
    return model;
  }
}
```

## Operation Decorators

Decorators like `@onCreate`, `@onUpdate`, `@onDelete`, and `@onRead` allow you to attach custom logic to specific repository operations.

```typescript
import { onCreate, onUpdate } from '@decaf-ts/db-decorators';

const logOnCreate = onCreate((context, data, key, model) => {
  console.log(`Creating model: ${model.constructor.name}`);
});

@model()
@logOnCreate
class Product extends Model {
  // ...
}
```

## Context

The `Context` class is used for passing contextual information through the different layers of your application.

```typescript
import { Context } from '@decaf-ts/db-decorators';

const context = new Context();
context.set('user', 'admin');

// You can then pass the context to repository methods
// userRepository.create(user, context);
```

## Additional Decorators

### `@id`

Marks a property as the primary key.

```typescript
@model()
class Product extends Model {
  @id()
  productId: string;
}
```

### `@generated`

Indicates that a property's value is generated by the database.

```typescript
@model()
class Order extends Model {
  @id()
  @generated()
  orderId: number;
}
```

### `@hash`

Automatically hashes a property's value.

```typescript
@model()
class User extends Model {
  @hash()
  password!: string;
}
```

### `@composed`

Composes a property's value from other properties.

```typescript
@model()
class Person extends Model {
  @composed(['firstName', 'lastName'], ' ')
  fullName: string;

  firstName: string;
  lastName: string;
}
```

### `@version`

Automatically manages a version number for optimistic locking.

```typescript
@model()
class Account extends Model {
  @version()
  version: number;
}
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
