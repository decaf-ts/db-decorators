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
