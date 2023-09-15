# Welcome to gei-bookings :book:

[![Version](https://img.shields.io/npm/v/gei-bookings.svg)](https://www.npmjs.com/package/gei-bookings)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/graphql-editor/graphql-editor-integrations/blob/master/LICENSE)
[![Build Status](https://github.com/graphql-editor/graphql-editor-integrations/actions/workflows/release.yml/badge.svg)](https://github.com/graphql-editor/graphql-editor-integrations/actions?query=branch%3Amaster)

> The &#34;Gei-bookings&#34; integration is focused on providing essential tools for handling bookings and services, with enchanced error detection system which helps resolving problems

### :house: [Homepage](https://github.com/graphql-editor/graphql-editor-integrations)

## Installation :zap:

<!-- prettier-ignore -->
```sh
npm install gei-bookings
```

## Usage 🏗️

##### We will be using graphql-editor-cli to speed-up the usage process, </br> You can install it with:

<!-- prettier-ignore -->
```sh
npm install -g graphql-editor-cli
```

First, you can check out our [gei-bookings sandbox schema](https://app.graphqleditor.com/editor-integrations/bookings-sandbox) or create your own schema, but be sure to connect gei-bookings to your resolvers in microservices.

create your .graphql-editor.json file in the root dir of project:

```json
{
  "namespace": "editor-integrations",
  "project": "bookings-sandbox",
  "projectVersion": "latest",
  "typingsEnv": "node",
  "typingsHost": "http://localhost:8080/",
  "typingsDir": "./src",
  "backendSrc": "./src",
  "backendLib": "./lib",
  "schemaDir": "./"
}
```

And run the follwing command in the project:

```sh
gecli schema && gecli cloud install
```

Now everything should work! Have fun using :smile:

## Author

👤 **GraphQL Editor**

- Website: https://graphqleditor.com
- Github: [@graphql-editor](https://github.com/graphql-editor)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

Feel free to check [issues page](https://github.com/graphql-editor/graphql-editor-integrations/issues).

## 📝 License

Copyright © 2023 [GraphQL Editor](https://github.com/graphql-editor).

This project is [MIT](https://github.com/graphql-editor/graphql-editor-integrations/blob/master/LICENSE) licensed.
