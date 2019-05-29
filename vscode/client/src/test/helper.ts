/********************************************************************************
 * Licensed Materials - Property of IBM "Restricted Materials of IBM"
 *
 * Copyright IBM Corp. 2019 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 ******************************************************************************/
'use strict';

import * as path from 'path';
import * as vscode from 'vscode';
import {
  Extension,
  Range,
  TextEditorEdit,
  Uri,
 } from 'vscode';

export let doc: vscode.TextDocument;
export let editor: vscode.TextEditor;
export let documentEol: string;
export let platformEol: string;

const workspacePath: string = path.resolve(__dirname, 'workspace');
export async function activate(docUri: vscode.Uri): Promise<void> {
  // The extensionId is `publisher.name` from package.json
  const ext: Extension<any> = vscode.extensions.getExtension('IBM.codewind-ls-node-prof');
  await ext.activate();
  try {
    await vscode.workspace.updateWorkspaceFolders(0, null, { uri: Uri.file(workspacePath) });
    doc = await vscode.workspace.openTextDocument(docUri);
    editor = await vscode.window.showTextDocument(doc);
    await sleep(2000); // Wait for server activation
  } catch (e) {
    console.error(e);
  }
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getDocPath(p: string): string {
  return path.resolve(workspacePath, 'project', p);
}

export function getDocUri(p: string): Uri {
  return vscode.Uri.file(getDocPath(p));
}

export async function setTestContent(content: string): Promise<boolean> {
  const all: Range = new vscode.Range(
    doc.positionAt(0),
    doc.positionAt(doc.getText().length),
  );
  return editor.edit((eb: TextEditorEdit) => eb.replace(all, content));
}
