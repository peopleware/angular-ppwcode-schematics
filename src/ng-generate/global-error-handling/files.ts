import { SchematicsException, Tree } from '@angular-devkit/schematics';
import * as ts from 'typescript';

/**
 * Gets a TypeScript SourceFile for the given path in the given tree.
 * @param host The host tree to look in.
 * @param path The path to the file in the tree to look for.
 * @throws a SchematicsException if the file could not be read.
 * @returns A TypeScript SourceFile instance representing the file.
 */
export const getTsSourceFile = (host: Tree, path: string): ts.SourceFile => {
    const buffer = host.read(path);
    if (!buffer) {
        throw new SchematicsException(`Could not read file (${path}).`);
    }

    const content = buffer.toString();
    
    return ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);
};
