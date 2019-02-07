/*******************************************************************************
 * Licensed Materials - Property of IBM "Restricted Materials of IBM"
 *
 * Copyright IBM Corp. 2018 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 ******************************************************************************/

import * as path from 'path';
import { commands, ExtensionContext, window, workspace, WorkspaceConfiguration } from 'vscode';

import {
  Disposable,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient';

let client: LanguageClient;

export function activate(context: ExtensionContext): void {

  const serverModule: string = path.join(__dirname, '../../..', 'server', 'lib', 'server.js');
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  const debugOptions: object = { execArgv: ['--nolazy', '--inspect=6009'] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    debug: {
      module: serverModule,
      options: debugOptions,
      transport: TransportKind.ipc,
    },
    run: { module: serverModule, transport: TransportKind.ipc },
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for javascript files
    documentSelector: [{ scheme: 'file', language: 'javascript' }],
    outputChannelName: 'Microclimate Language Server',
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/*.{js,json}'),
    },
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    'microclimateLanguageServer',
    'Microclimate Language Server',
    serverOptions,
    clientOptions,
  );

  const disposable: Disposable = commands.registerCommand('extension.toggleProfiling', () => {
    // The code you place here will be executed every time your command is executed
    const config: WorkspaceConfiguration = workspace.getConfiguration('microclimateProfiling');
    const newShowProfiling: boolean = !config.get('showProfiling');
    config.update('showProfiling', newShowProfiling);
    // const req: RequestType<
    // client.sendRequest()

    window.showInformationMessage(
      `Microclimate Profiling: Method profiling ${ newShowProfiling ? 'enabled' : 'disabled' }.`,
    );
  });

  context.subscriptions.push(disposable);

  // Start the client. This will also launch the server
  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
