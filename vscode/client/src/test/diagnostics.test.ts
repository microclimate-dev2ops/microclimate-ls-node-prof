/********************************************************************************
 * Licensed Materials - Property of IBM "Restricted Materials of IBM"
 *
 * Copyright IBM Corp. 2019 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 ******************************************************************************/
'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import { activate, getDocUri } from './helper';

describe('Should get diagnostics', () => {
  const docUri: vscode.Uri = getDocUri('test.js');

  it('Generates the message and displays at the right line', async () => {
    await testDiagnostics(docUri, [
      {
        message: 'Function example() was the running function in 30.22% of samples.',
        range: toRange(6, 0, 6, 9999),
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'Codewind Language Server',
      },
      {
        message: 'Function <anonymous function> was the running function in 63.19% of samples.',
        range: toRange(0, 0, 0, 9999),
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'Codewind Language Server' },
    ]);
  });
});

function toRange(sLine: number, sChar: number, eLine: number, eChar: number): vscode.Range {
  const start: vscode.Position = new vscode.Position(sLine, sChar);
  const end: vscode.Position = new vscode.Position(eLine, eChar);
  return new vscode.Range(start, end);
}

async function getDiagnostics(docUri: vscode.Uri): Promise<vscode.Diagnostic[]> {
  await activate(docUri);
  return vscode.languages.getDiagnostics(docUri);
}

async function testDiagnostics(docUri: vscode.Uri, expectedDiagnostics: vscode.Diagnostic[]): Promise<void> {

  const actualDiagnostics: vscode.Diagnostic[] = await getDiagnostics(docUri);
  assert.equal(actualDiagnostics.length, expectedDiagnostics.length);

  expectedDiagnostics.forEach((expectedDiagnostic: vscode.Diagnostic, i: number) => {
    const actualDiagnostic: vscode.Diagnostic = actualDiagnostics[i];
    assert.equal(actualDiagnostic.message, expectedDiagnostic.message);
    assert.deepEqual(actualDiagnostic.range, expectedDiagnostic.range);
    assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity);
  });
}
