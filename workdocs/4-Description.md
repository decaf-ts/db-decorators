
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
