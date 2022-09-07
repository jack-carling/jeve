## 0.2.1 (2022-09-07)

### Features

- Added handling of `itemMethods` in UI
- Basic overview of schema and validations in UI

## 0.2.0 (2022-09-04)

### Breaking changes

- HTTP methods are no longer only defined in the `resourceMethods` array. The values in `resourceMethods` defines which methods are supported at the resource endpoint, supported values are **GET** and **POST**. The `itemMethods` array contains which methods are allowed at the item endpoint: `/resource/id` which is the `_id` of the document. Supported `itemMethods` values are:
  - GET
  - PUT
  - PATCH
  - DELETE

### Features

- Added `itemMethods`
- HTTP method **GET** is no longer added to `resourceMethods` or `itemMethods` by default
  in order to enabled the creation of restricted endpoints

## 0.1.6 (2022-09-03)

### Features

- Added `object` as valid type in schema

## 0.1.5 (2022-08-28)

### Features

- Added `min`, `max`, `minLength` and `maxLength` as valid data validation keys

## 0.1.4 (2022-08-27)

### Features

- Improved casting and validations

## 0.1.3 (2022-08-26)

### Features

- Validating keys in schema
- Adding `default` as valid data validation key

## 0.1.2 (2022-08-24)

### Bug fixes

- Handling objects inside an array in a schema

## 0.1.1 (2022-08-23)

### Bug fixes

- Remove certain private class functions

## 0.1.0 (2022-08-23)

### Bug fixes

- Fixed how assets are handled by express static

## 0.0.9 (2022-08-17)

### Bug fixes

- Include files when publishing to npm

## 0.0.8 (2022-08-17)

### Features

- Added files for documentation

## 0.0.7 (2022-08-17)

### Code refactoring

- Fixed tests

## 0.0.6 (2022-08-16)

### Features

- Export schema as JSON in preparation for documentation

## 0.0.5 (2022-08-16)

### Features

- Custom routes

## 0.0.4 (2022-08-14)

### Features

- Middleware in schema with the `preHandler` hook

### Other

- Added license

## 0.0.3 (2022-08-14)

### Code refactoring

- New tests
- Added private class functions

## 0.0.2 (2022-08-13)

### Code refactoring

- Promises to ensure initialization
- Started integration tests

## 0.0.1 (2022-08-12)

### Features

- Chalk logging
- Dynamically created routes
- Dynamically created Mongoose Schemas
- Validations on initialization
- Handle GET, POST, PUT, PATCH & DELETE
