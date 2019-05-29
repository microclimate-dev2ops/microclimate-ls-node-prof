/*******************************************************************************
 * Licensed Materials - Property of IBM "Restricted Materials of IBM"
 *
 * Copyright IBM Corp. 2018 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 ******************************************************************************/
import { inspect } from 'util';

import * as fs from 'fs-extra';
import * as Path from 'path';
import { URL } from 'url';
import {
  ClientCapabilities,
  Connection,
  createConnection,
  Diagnostic,
  DidChangeConfigurationNotification,
  DidChangeConfigurationParams,
  DidOpenTextDocumentParams,
  InitializeParams,
  ProposedFeatures,
  TextDocumentItem,
  TextDocuments,
  WorkspaceFolder,
  WorkspaceFoldersChangeEvent,
} from 'vscode-languageserver';

import ProfilingManager from './modules/ProfilingManager';

// There are defaults in package.json but these will be picked up
// if someone deletes all the settings.
interface CodewindSettings {
  profilingfolder: string;
  showProfiling: boolean;
}
const defaultSettings: CodewindSettings  = {
  profilingfolder: 'load-test',
  showProfiling: false,
};
let settings: CodewindSettings = defaultSettings;

let projectFolders: string[] = null;

const highlightedTextDocuments: Map<TextDocumentItem, Diagnostic[] | null> = new Map();

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection: Connection = createConnection(ProposedFeatures.all);
const profilingManager: ProfilingManager = new ProfilingManager(connection);

// Create a simple text document manager. The text document manager
// supports full document sync only
const documents: TextDocuments = new TextDocuments();

let hasConfigurationCapability: boolean = false;
let canNotifyConfigChanges: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
  const capabilities: ClientCapabilities = params.capabilities;

  // connection.console.log(`onInitialize: Params are:`);
  // connection.console.log(inspect(params));

  // Does the client support the `workspace/configuration` request?
  // If not, we will fall back using global settings
  hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
  // connection.console.log(`hasConfigurationCapability = ${hasConfigurationCapability}`);

  // Does the client notify us of config changes. (This is different to the above, theia supports
  // notification but doesn't have capabilities.workspace.configuration.)
  if (capabilities.workspace &&
      capabilities.workspace.didChangeConfiguration &&
      capabilities.workspace.didChangeConfiguration.dynamicRegistration) {
        canNotifyConfigChanges = true;
  }
  hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
  hasDiagnosticRelatedInformationCapability =
    !!(capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation);

  // connection.console.log(`configuration is: ${connection.workspace.getConfiguration()}`);

  return {
    capabilities: {
      textDocumentSync: documents.syncKind,
    },
  };
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.workspace.getConfiguration({ section: 'codewindProfiling' }).then((result: any) => {
      try {
        // connection.console.log(`Settings are: ${inspect(settings)}`);
        if (settings) {
          settings = result as CodewindSettings;
        }
      } catch (err) {
        connection.console.log(inspect(err));
      }
    },
      (err: any) => connection.console.log(inspect(err)),
    );
  }
  if (canNotifyConfigChanges) {
    connection.client.register(
      DidChangeConfigurationNotification.type,
      { section: 'codewindProfiling' },
    );
    connection.onDidChangeConfiguration(async (change: DidChangeConfigurationParams) => {
      settings = change.settings.codewindProfiling as CodewindSettings;

      // clear diagnostics if disabled showProfiling
      if (!settings.showProfiling) {
        connection.console.log('Profiling Toggled Off');
        resetAllDiagnostics();
      } else {
        connection.console.log('Profiling Toggled On');
        restoreAllDiagnostics();
      }

      // We need to refresh the folders if the settings changed.
      projectFolders = null;
      // connection.console.log(`Settings updated to: ${inspect(settings)}`);
    });
    // connection.client.register(
    //   DidChangeWatchedFilesNotification.type,
    //   undefined
    // );
  }
  connection.console.log(`hasWorkspaceFolderCapability = ${hasWorkspaceFolderCapability}`);
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((event: WorkspaceFoldersChangeEvent) => {
      connection.console.log('Workspace folder change event received.');
    });
  }
  // connection.console.log("Adding onDidChangeWatchedFiles");
  // connection.onDidChangeWatchedFiles(async changeEvent => {
  //   // Monitored files have change in VSCode
  //   connection.console.log('We received a file change event');
  //   connection.console.log(inspect(changeEvent   ));
  //   let folders = await connection.workspace.getWorkspaceFolders();

  //   for( const folder of folders) {
  //     connection.console.log('Found folder: ' + inspect(folder));
  //   }
  //   // for (const change of changeEvent.changes) {

  //   // }
  // });

  connection.console.log(`Workspace project folders are: ${inspect(projectFolders)}`);

  connection.onDidOpenTextDocument(async (openEvent: DidOpenTextDocumentParams) => {
    // Monitored files have change in VSCode
    const textDocument: TextDocumentItem = openEvent.textDocument;

    if ('javascript' !== textDocument.languageId) { return; }

    // if no entry exists for the text document make a record that the file has been opened
    if (!highlightedTextDocuments.has(textDocument)) {
      highlightedTextDocuments.set(textDocument, null);
    }
    // don't show anything if option turned off
    if (!settings.showProfiling) {
      resetAllDiagnostics();
      return;
    }

    getDiagnostics(textDocument);
  });
});

async function getDiagnostics(textDocument: TextDocumentItem): Promise<void> {
  // Lazily initialize project folders.
  if (!projectFolders) {
    // TODO - This needs to update when new folders are added.
    projectFolders = await getCodewindProjectFolders();
  }
  // connection.console.log(inspect(projectFolders));

  const url: URL = new URL(textDocument.uri);
  const pathname: string = url.pathname;
  connection.console.log(`Finding project for: ${pathname} `);
  const projectDir: string = getProjectForPath(pathname);
  if (projectDir) {
    try {
      connection.console.log(`Finding load-test results for: ${pathname} in project directory ${projectDir}`);
      const loadTestResults: string = await getLatestLoadTestResults(projectDir, settings.profilingfolder);
      connection.console.log(`Latest load test results for ${pathname} are in project directory ${loadTestResults}`);
      highlightFunctions(textDocument, loadTestResults);
    } catch (err) {
      connection.console.error(inspect(err));
    }
  } else {
    // If our settings have changed we need to send back empty diagnostics to clear
    // any previous diagnostics.
    const emptyDiagnostics: Diagnostic[] = [];
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: emptyDiagnostics });
  }
}

function restoreAllDiagnostics(): void {
  for (const [document, diagnostics] of highlightedTextDocuments) {
    // if diagnostics have never been defined then check for profiling data
    if (diagnostics === null) {
      getDiagnostics(document);
    } else {
      connection.sendDiagnostics({ uri: document.uri, diagnostics: highlightedTextDocuments.get(document)});
    }
  }
}

function resetAllDiagnostics(): void {
  for (const document of highlightedTextDocuments.keys()) {
    connection.sendDiagnostics({ uri: document.uri, diagnostics: [] });
  }

  // textDocumentUris.clear();
}

function getProjectForPath(pathname: string): string {
  for (const path of projectFolders) {
    if ( pathname.startsWith(path)) {
      return path;
    }
  }
  return null;
}

async function getLatestLoadTestResults(projectFolder: string, profilingfolder: string): Promise<string> {
  const loadtestDir: string = Path.join(projectFolder, profilingfolder);
  try {
      // If the load test has been deleted we can just handle the exception and move on.
      const resultDirs: string[] = [];
      for (const dir of await fs.readdir(loadtestDir)) {
        const stat: fs.stat = await fs.stat(Path.join(loadtestDir, dir));
        // Check for directories with an integer date stamp as we expect.
        if (stat.isDirectory() && /^[0-9]{14}$/.test(dir)) {
          resultDirs.push(dir);
        }
      }
      resultDirs.sort( (a: string, b: string) => parseInt(b, 10) - parseInt(a, 10));
      // connection.console.log(inspect(resultDirs));
      // Load the latest results file for this project here.
      // connection.console.log(`Latest performance results are in: ${Path.join(loadtestDir, resultDirs[0])}`);
      return Path.join(loadtestDir, resultDirs[0]);
    } catch (e) {
      connection.console.log(`Problem reading results from ${loadtestDir}`);
    }
  return null;
}

async function getCodewindProjectFolders(): Promise<string[]> {
  const workspaceFolders: WorkspaceFolder[] = await connection.workspace.getWorkspaceFolders();
  const cwProjectFolders: string[] = [];
  for ( const folder of workspaceFolders) {
    connection.console.log('getMicrocliamteProjectFolders - found folder: ' + inspect(folder));
    const url: URL = new URL(folder.uri);
    const pathname: string = url.pathname;
    connection.console.log('Pathname is: ' + pathname);

    const workspaceProjectFolders: string[] = await searchForFolders(pathname, settings.profilingfolder);
    cwProjectFolders.push(...workspaceProjectFolders);
  }
  return cwProjectFolders;
}

async function searchForFolders(pathname: string, name: string): Promise<string[]> {
  const projectPaths: string[] = [];
  try {
    const entries: string[] = await fs.readdir(pathname);
    const subdirs: string[] = [];
    for ( const entry of entries ) {
      const stat: fs.stat = await fs.stat(Path.join(pathname, entry));
      if (stat.isDirectory()) {
        if ( entry === name) {
          // Add directories containing load-test subdirs, but don't search load-test directories.
          // connection.console.log("Found dir: " + entry + " in " + pathname);
          projectPaths.push(pathname);
        } else if ( !entry.startsWith('.') ) {
          // Avoid hidden directories (like .git).
          subdirs.push(entry);
          const subPaths: string[] = await searchForFolders(Path.join(pathname, entry), name);
          // connection.console.log(`concatenating: ${inspect(subPaths)}`);
          projectPaths.push(...subPaths);
          // connection.console.log(`projectPaths: ${inspect(projectPaths)}`);
        }
      }
    }
  } catch (e) {
    connection.console.log(inspect(e));
  }
  // connection.console.log(`Returning: ${inspect(projectPaths)}`);
  return projectPaths;
}

async function highlightFunctions(textDocument: TextDocumentItem, profilingPath: string): Promise<void> {
  try {
    const diagnostics: Diagnostic[] = profilingManager.getDiagnosticsForFile(
      textDocument.uri, profilingPath, projectFolders, hasDiagnosticRelatedInformationCapability,
    );
    highlightedTextDocuments.set(textDocument, diagnostics);
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
  } catch (err) {
    connection.console.error(inspect(err));
  }
}

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
