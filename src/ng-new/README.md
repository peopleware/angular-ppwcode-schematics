# ng-new

The `ng new` command creates a new project by combining the workspace and application schematics.

Usage:
```bash
ng new <project-name> --collection=@ppwcode/angular-schematics
```

## Flow
The `ng new` command will by default first execute the `workspace` schematic.
After that it will run the `application` schematic.

It is possible to skip the `application` schematic by adding the `--create-application false` flag
to the `ng new` command.


## Differences with the default schematic
This is basically a simplified version of the default schematic that does two things:

* Run the modified `workspace` and `application` schematics when invoked
* Drastically reduce the number of options and replace them with sensible defaults

The remaining options are described below:

### Options

| Option             | Description                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| name               | The name of the new app.                                                                       |
| prefix             | The prefix to apply to generated selectors in the application.                                 |
| create-application | Whether or not the application schematic should be run. Must be either true (default) or false.|
