# Tips for Developers
  
To build all the integrations just use `npm run build` in root folder.

## Create and update integrations
Integrations are workspaces in root package.json.  

When you add new integration you have to generate index.ts file using `gecli gei init`  
  
After you finish updating integration or finish writing the new one, just use `npm run integrate` inside of the integration folder to generate resolvers into stucco.json. You can update all integrations using the same command at the root folder.  
  
## Update sandbox
  
You can test integrations in sample project in sandbox folder. If you're adding a new resolvers you have to update the schema 'beerpub-graphql-integrations' in the web at graphql-editor and connect resolvers in 'Microservices' section.  
To update prepared schema and connected resolvers in stucco.json use command `npm run update` inside of 'packages/sandboxes/rest-users-s3'.