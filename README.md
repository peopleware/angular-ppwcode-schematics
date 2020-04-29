# Getting Started With ppwcode schematics

This repository is a ppwcode schematic implementation 
that serves as a starting point to create a ppwcode compliant Angular repository.

### Generating

To generate an Angular project with ppw compliant configurations
1. Run `npm run build` in this project
2. Go to your desired directory by running: `cd ./to/your/desired/directory`
3. Run `ng new test --collection=<path_to_this_repo>/dist/collection.json`'

### Unit Testing

`npm run test` will run the unit tests, using Jasmine as a runner and test framework.

### Publishing

To publish, simply do:

```bash
npm run build
npm publish
```

That's it!
