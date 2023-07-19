# GraphQL Editor Integration - CRUD

This integration allows basic CRUD operations with mongodb as a database

## How to use in GraphQL Editor

1. Select `Type` and `field` in stucco config
2. Select `From integration`
3. Select `gei-crud/Query.objects` for objects or `gei-crud/Mutation.create` for Creation

## How to use in code

```sh
$ npm i gei-users
```

Add this to your `stucco.json` file

```json
{
  "resolvers": {
    "<Type>.<fieldName>": {
      "resolve": {
        "name": "node_modules/gei-crud/lib/Query/objects"
      }
    },
    "<Type>.<fieldName>": {
      "resolve": {
        "name": "node_modules/gei-crud/lib/Mutation/create"
      }
    }
  }
}
```

where `Type` and `fieldName` are defined for your schema, for example:

```json
{
  "resolvers": {
    "Query.posts": {
      "data": {
        "model": "Post"
      },
      "resolve": {
        "name": "node_modules/gei-crud/lib/Query/objects"
      }
    },
    "Mutation.createPost": {
      "data": {
        "model": "Post"
      },
      "resolve": {
        "name": "node_modules/gei-crud/lib/Mutation/create"
      }
    }
  }
}
```

They need to implement the SDL type parameters.
