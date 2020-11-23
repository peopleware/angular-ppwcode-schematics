# Getting Started With ppwcode schematics

This repository is a ppwcode schematic implementation 
that serves as a starting point to create a ppwcode compliant Angular repository.

### Usage as package

To generate an Angular project with ppw compliant configurations
1. Run `npm install -g @ppwcode/angular-schematics`.
2. Go to your desired directory by running: `cd ./to/your/desired/directory`
2. Run `ng new --collection=@ppwcode/angular-schematics`

### Dev workflow

If you want to test the development code follow the following steps:
1. Run `npm run build` in this project
2. Go to your desired directory by running: `cd ./to/your/desired/directory`
3. Run `ng new --collection=<path_to_this_repo>/dist/collection.json`

### Unit Testing

`npm run test` will run the unit tests, using Jasmine as a runner and test framework.

### Publishing

Publishing is performed by the GitHub workflow.

Do this by browsing to https://github.com/peopleware/angular-ppwcode-schematics/releases
and click "draft a new release".
