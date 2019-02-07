/********************************************************************************
 * Licensed Materials - Property of IBM "Restricted Materials of IBM"
 *
 * Copyright IBM Corp. 2019 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 ******************************************************************************/
'use strict';

import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate, sleep } from './helper';

describe('Should get diagnostics', () => {
  const docUri = getDocUri('test.js');

  it('Generates the message and displays at the right line', async () => {
    await testDiagnostics(docUri, [
      { message: 'Function example accumulated 55 ticks', range: toRange(6, 0, 6, 9999), severity: vscode.DiagnosticSeverity.Warning, source: 'Microclimate Language Server' },
      { message: 'Function <anonymous function> accumulated 115 ticks', range: toRange(0, 0, 0, 9999), severity: vscode.DiagnosticSeverity.Warning, source: 'Microclimate Language Server' }
    ]);
  });
});

function toRange(sLine: number, sChar: number, eLine: number, eChar: number) {
  const start = new vscode.Position(sLine, sChar);
  const end = new vscode.Position(eLine, eChar);
  return new vscode.Range(start, end);
}

async function getDiagnostics(docUri: vscode.Uri) {
  await activate(docUri);
  return vscode.languages.getDiagnostics(docUri);
}

async function testDiagnostics(docUri: vscode.Uri, expectedDiagnostics: vscode.Diagnostic[]) {

  const actualDiagnostics = await getDiagnostics(docUri);
  assert.equal(actualDiagnostics.length, expectedDiagnostics.length);

  expectedDiagnostics.forEach((expectedDiagnostic, i) => {
    const actualDiagnostic = actualDiagnostics[i];
    console.dir(actualDiagnostic);

    assert.equal(actualDiagnostic.message, expectedDiagnostic.message);
    assert.deepEqual(actualDiagnostic.range, expectedDiagnostic.range);
    assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity);
  });
}
