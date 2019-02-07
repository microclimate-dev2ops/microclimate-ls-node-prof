/*******************************************************************************
 * Licensed Materials - Property of IBM "Restricted Materials of IBM"
 *
 * Copyright IBM Corp. 2018 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 ******************************************************************************/

import TreeNode from './TreeNode';
import { TreeNodeMap } from './types';

export default class Tree {
  public nodes: TreeNode[] = [];
  public maxDepth: number;
  public root: TreeNode;
  // This creates an empty object without methods like
  // hasOwnProperty. (We may want to add a field called
  // hasOwnProperty as the profiler lists it as the file
  // containing that function.)
  private files: Map<string, TreeNode[]> = new Map();

  constructor(root: TreeNode) {
    this.root = root;
    this.addToAllNodes(root);
  }

  public addOrUpdateNode(profileNode: TreeNode, index: TreeNodeMap): void {
    // if the node is the root node then simply update the count
    if (TreeNode.nodesMatch(this.root, profileNode)) {
      this.root.count += profileNode.count;
      return;
    }

    // Build a path of function names so we can search up from the root of
    // the tree.
    const path: TreeNode[] = [];
    let currentNode: TreeNode = profileNode;

    while (currentNode) {
      path.push(currentNode);
      currentNode = index.get(currentNode.parent);
    }
    path.reverse();

    let treeNode: TreeNode = this.root;
    let children: TreeNode[] = treeNode.children;
    if (!TreeNode.nodesMatch(this.root, path[0])) {
      console.error('We didn\'t end up at root!');
    }

    // Find the parent for this node.
    for (const pathNode of path.slice(1)) {
      // Need to follow the children from root to find where this
      // node slots in. Should not require parent to have been created
      // as it creates any parents not currently created
      // (In practise it probably will be.)
      let nextTreeNode: TreeNode = null;
      for (const child of children) {
        if (TreeNode.nodesMatch(child, pathNode)) {
          // console.log("Re-using node for " + pathNode.name);
          nextTreeNode = child;
          break;
        }
      }
      if (!nextTreeNode) {
        // console.log("Adding node for " + pathNode.name);
        // create new node
        nextTreeNode = new TreeNode(
          pathNode.self, pathNode.name, pathNode.file, pathNode.line, treeNode.self, treeNode,
        );
        this.addToAllNodes(nextTreeNode);
      }
      treeNode = nextTreeNode;
      children = treeNode.children;
    }

    // Add the ticks from this profiling node
    // (add since we may already have tick from a previous sample)
    treeNode.addTicks(profileNode.count);
  }

  public filterFromFile(path: string): TreeNode[] {
    return this.files.get(path) || [];
  }

  private addToAllNodes(node: TreeNode): void {
    this.nodes.push(node);
    // add child to parent node
    if (node.parentNode) { node.parentNode.children.push(node); }
    // add to indexes
    this.files.has(node.file) ? this.files.get(node.file).push(node)
                              : this.files.set(node.file, [node]);

    this.maxDepth = Math.max(this.maxDepth, node.depth);
  }
}
