# Workspace

The workspace schematic is used to generate a new Angular workspace. A workspace can contain 1 or more Angular projects
(i.e. applications or libraries) which are typically co-located in a single source control repository.

In other words, the workspace creates the 'environment' in which the projects live. It defines cross-project settings 
for formatting, compiling, etc.

The schematic can be run by invoking the following command:

```bash
ng new <project-name> --collection=@ppwcode/angular-schematics
```

The project name can be omitted, Angular CLI will then prompt you for a name to use.

Keep in mind that running `ng new` will, by default, create both a workspace _and_ an application within the workspace.
If desired, application creating can be omitted by adding the `--create-application false` flag to the `ng new` command.

Further info on workspaces can be found in the [Angular documentation](https://angular.io/guide/file-structure).

## Flow

The workspace flow is fairly simple. First, we execute the `workspace` schematic of `@schematics/angular`. 

After that we add some extra files to our newly created workspace:

* `.nvmrc`
* `.prettierignore`
* `.prettierrc.js`

And finally, we override `tsconfig.json`.

## Differences with the default schematic

### Files

####Added:
* `.nvmrc`
  * This file defines the node version to be used for this project.
  In combination with NVM/AVN or similar version managers, it allows all developers to be sure they are running the same
  version of Node.
* `.prettierrc.js`
  * Configuration for [Prettier](https://prettier.io/). Support for Prettier is built right into all JetBrains IDE's,
  this config file will make sure everyone is using the same settings.
* `.prettierignore`
  * There are some files and folders we _don't_ want Prettier to format; these are defined here.

