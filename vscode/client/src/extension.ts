/*******************************************************************************
 * Licensed Materials - Property of IBM "Restricted Materials of IBM"
 *
 * Copyright IBM Corp. 2018 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 ******************************************************************************/

import * as path from 'path';
import {
  commands,
  ExtensionContext,
  StatusBarAlignment,
  StatusBarItem,
  window,
  workspace,
  WorkspaceConfiguration,
} from 'vscode';

import {
  Disposable,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient';

const CONFIG_SECTION: string = 'codewindProfiling';
const CONFIG_SHOW_PROFILING: string = 'showProfiling';
const TOGGLE_COMMAND_ID: string = 'extension.toggleProfiling';

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
    outputChannelName: 'Codewind Language Server',
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/*.{js,json}'),
    },
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    'codewindLanguageServer',
    'Codewind Language Server',
    serverOptions,
    clientOptions,
  );

  const disposable: Disposable = commands.registerCommand(TOGGLE_COMMAND_ID, () => {
    // The code you place here will be executed every time your command is executed
    const newShowProfiling: boolean = !isShowProfiling();
    const config: WorkspaceConfiguration = workspace.getConfiguration(CONFIG_SECTION);
    config.update(CONFIG_SHOW_PROFILING, newShowProfiling);
    setStatusBarMessage(newShowProfiling);

    window.showInformationMessage(
      `Codewind Profiling: Method profiling ${ newShowProfiling ? 'enabled' : 'disabled' }.`,
    );
  });

  // do this AFTER registering the toggle command
  setStatusBarMessage(isShowProfiling());

  context.subscriptions.push(disposable);

  // Start the client. This will also launch the server
  client.start();
}

export async function deactivate(): Promise<void> {
  if (statusBarItem != null) {
    statusBarItem.dispose();
  }
  if (client) {
    await client.stop();
  }
}

function isShowProfiling(): boolean {
  const config: WorkspaceConfiguration = workspace.getConfiguration(CONFIG_SECTION);
  return config.get<boolean>(CONFIG_SHOW_PROFILING);
}

// Persistent statusBarItem shows the user whether or not the extension is active, and can be clicked to toggle.
// only undefined initially (on activation); will be present the rest of the time.
let statusBarItem: StatusBarItem | undefined;

function setStatusBarMessage(profilingEnabled: boolean): void {
  if (statusBarItem != null) {
    statusBarItem.dispose();
  }
  // Extensions that show persistent status items like this always do so on the right side.
  // Priority 1000 is totally arbitrary, I like having it as left as possible.
  statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 1000);
  // https://octicons.github.com/icon/dashboard/
  statusBarItem.text = `$(dashboard) ${ profilingEnabled ? 'Profiling on ' : 'Profiling off' }`;
  statusBarItem.command = TOGGLE_COMMAND_ID;
  statusBarItem.tooltip = 'Click to toggle';
  statusBarItem.show();
}
