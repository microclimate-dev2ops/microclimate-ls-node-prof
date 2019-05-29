/*******************************************************************************
 * Licensed Materials - Property of IBM "Restricted Materials of IBM"
 *
 * Copyright IBM Corp. 2019 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 ******************************************************************************/

import { readFileSync } from 'fs';
import { inspect } from 'util';
import {
  Connection,
  Diagnostic,
  DiagnosticSeverity,
  Position,
} from 'vscode-languageserver';
import { shortName } from './config';
import Tree from './Tree';
import TreeNode from './TreeNode';
import {
  TreeNodeMap,
} from './types';

interface DisplayNode {
  line: number;
  name: string;
  count: number;
  parents: DisplayParentMap;
}

interface DisplayParent {
  file: string;
  line: number;
  name: string;
  count: number;
}

type TreeMap = Map<string, Tree>;
type DisplayNodeMap = Map<string, DisplayNode>;
type DisplayParentMap = Map<string, DisplayParent>;

export default class ProfilingManager {
  private trees: TreeMap = new Map();
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  public getDiagnosticsForFile(
    codePath: string,
    profilingPath: string,
    projectFolders: string[],
    hasDiagnosticRelatedInformationCapability: boolean,
  ): Diagnostic[] {
    const localPath: string = this.getProjectDirectory(codePath, projectFolders);
    const appCodePath: string = this.convertToAppDirectory(codePath, localPath);

    // read file into tree
    const start: number = Date.now();
    this.connection.console.info(`Starting parsing: ${profilingPath}`);
    const tree: Tree = this.findOrCreateTree(profilingPath);
    this.connection.console.info(`Done parsing: ${profilingPath} in ${Date.now() - start}`);
    const nodes: TreeNode[] = this.getNodesInFile(tree, appCodePath);
    this.connection.console.log(inspect(nodes));
    return this.createDiagnostics(tree, nodes, localPath, hasDiagnosticRelatedInformationCapability);
  }

  private getProjectDirectory(filePath: string, projectFolders: string[]): string {
    const projectPath: string[] = projectFolders.filter((folderPath: string) => filePath.includes(folderPath));

    return projectPath.length >= 1 ? projectPath[0] : '';
  }

  private convertToAppDirectory(filePath: string, localPath: string): string {
    let updatedFilePath: string = filePath.replace('file://', '');
    updatedFilePath = updatedFilePath.replace(localPath, '/app');

    return updatedFilePath;
  }

  private findOrCreateTree(profilingPath: string): Tree {
    if (this.trees.get(profilingPath)) {
      return this.trees.get(profilingPath);
    }
    const treeRoot: TreeNode = new TreeNode(0, '(root)', '', 0, 0);
    const tree: Tree = new Tree(treeRoot);
    this.parse(tree, `${profilingPath}/profiling.json`);
    this.trees.set(profilingPath, tree);
    return tree;
  }

  private createDiagnostics(
    tree: Tree,
    nodes: TreeNode[],
    localPath: string,
    hasDiagnosticRelatedInformationCapability: boolean,
  ): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    try {
      // Merge counts where function is directly called by the same
      // parent even if there are differences further up the stack.
      const displayNodes: DisplayNodeMap = new Map();
      for (const node of nodes) {
        // Until we add child counts, ignore functions with no
        // direct ticks.
        if (node.count === 0) { continue; }
        const functionKey: string = `${node.name}:${node.line}`;
        let displayNode: DisplayNode = displayNodes.get(functionKey);
        if (!displayNode) {
          displayNode = {
            count: 0,
            line: node.line,
            name: node.name,
            parents: new Map(),
          };
          displayNodes.set(functionKey, displayNode);
        }
        displayNode.count += node.count;
        const parentNode: TreeNode = node.parentNode;
        const parentKey: string = `${parentNode.file}:${parentNode.name}:${parentNode.line}`;
        let parentDisplayNode: DisplayParent = displayNode.parents.get(parentKey);
        if (!parentDisplayNode) {
          parentDisplayNode = {
            count: 0,
            file: parentNode.file,
            line: parentNode.line,
            name: parentNode.name,
          };
          displayNode.parents.set(parentKey, parentDisplayNode);
        }
        // We are counting the number of calls to *this* function from the parent
        // in this stack. (We don't want to use the parent count here.)
        parentDisplayNode.count += node.count;
      }

      for (const displayNode of displayNodes.values()) {
        const functionName: string = displayNode.name ? displayNode.name + '()' : '<anonymous function>';
        const displayNodePercentage: number = (displayNode.count * 100.0) / tree.root.childCount;
        const message: string =
            `Function ${functionName} was the running function in ${displayNodePercentage.toFixed(2)}% of samples.`;
        const diagnostic: Diagnostic = {
          message,
          range: {
            // need to do -1 since editor's line numbers (internally) start at 0
            end: Position.create(this.convertLineNo(displayNode.line), 9999),
            start: Position.create(this.convertLineNo(displayNode.line), 0),
          },
          severity: DiagnosticSeverity.Warning,
          source: shortName,
        };

        if (hasDiagnosticRelatedInformationCapability) {
          if (!diagnostic.relatedInformation) {
            diagnostic.relatedInformation = [];
          }
          for (const displayParentNode of displayNode.parents.values()) {
            const parentFunctionName: string = displayParentNode.name ?
                                        displayParentNode.name + '()' :
                                        '<anonymous function>';
            const parentPercentage: number = (displayParentNode.count * 100.0) / displayNode.count;
            diagnostic.relatedInformation.push(
              {
                location: {
                  range: {
                    end: Position.create(this.convertLineNo(displayParentNode.line), 9999),
                    start: Position.create(this.convertLineNo(displayParentNode.line), 0),
                  },
                  uri: displayParentNode.file.replace('/app/', localPath),
                },
                message: `${parentFunctionName} made ${parentPercentage.toFixed(2)}% of sampled calls.`,
              },
            );
          }
        }
        diagnostics.push(diagnostic);
      }
    } catch (err) {
      this.connection.console.error(inspect(err));
    }
    return diagnostics;
  }

  private parse(tree: Tree, profilingFilePath: string): void {
    const profiling: string = JSON.parse(readFileSync(profilingFilePath, 'utf8'));
    // this.addSample(profiling[0]);
    for (const sample of profiling) {
      this.addSample(tree, sample);
    }
  }

  private getNodesInFile(tree: Tree, path: string): TreeNode[] {
    return tree.filterFromFile(path);
  }

  private addSample(tree: Tree, profilingRow: any): void {
    const indexedNodes: TreeNodeMap = new Map();
    // Index this so we can find parents faster.this.files
    profilingRow.functions.map((node: TreeNode) => { indexedNodes.set(node.self, node); });

    // for each node
    for (const fnDetails of profilingRow.functions) {
      if (fnDetails.name === '(program)') {
        continue;
      }
      tree.addOrUpdateNode(fnDetails, indexedNodes);
    }

    // useful code for debugging
    // var cache = [];
    // const test = JSON.stringify(this.tree.nodes, function(key, value) {
    //     if (typeof value === 'object' && value !== null) {
    //         if (cache.indexOf(value) !== -1) {
    //             // Duplicate reference found
    //             try {
    //                 // If this value does not reference a parent it can be deduped
    //                 return JSON.parse(JSON.stringify(value));
    //             } catch (error) {
    //                 // discard key if value cannot be deduped
    //                 return;
    //             }
    //         }
    //         // Store value in our collection
    //         cache.push(value);
    //     }
    //     return value;
    // });
    // cache = null;

    // this.connection.console.log(test);

  }

  private convertLineNo(lineNo: number): number {
    return lineNo > 0 ? lineNo - 1 : 0;
  }
}
