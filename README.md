# Microclimate Language Server for Node.js Profiling

You can use the Microclimate Language Server for Node.js Profiling to provide code highlighting showing relative time spent in JavaScript functions based on profiling data gathered through Microclimate Load Testing.

## Usage

With Visual Studio Code:

- Open a local project created with <https://microclimate-dev2ops.github.io/installlocally> and profiled using the [Performance Test](https://microclimate-dev2ops.github.io/performancetesting#performance-testing-your-project) feature of Microclimate.
- This will create profiling data in a `load-test/[datestamp]/profiling.json` file in your Microclimate project.
- In Visual Studio Code (in the [Extension Development Host] instance if you are developing/debugging) open a JavaScript file.
- The extension will highlight any lines which were found in the profiling data and annotate them to show how often they were seen and where they were called from.

---

## Development

### Running the Extension

With Visual Studio Code:

- Clone this repsitory locally.
- Run `npm install` in the cloned `microclimate-ls-node-prof` folder. This installs all necessary npm modules in both the client and server folder
- Open the clone of this repository in Visual Studio Code.
- Press Ctrl+Shift+B (Cmd+Shift+B on Mac) to compile the client and server.
- Switch to the Debug viewlet.
- Select `Launch Client` from the drop down and press the Run icon.
- If you want to debug the server as well use the launch configuration `Attach to Server`.

### Testing

Setup:

- Run `npm install` in the `microclimate-ls-node-prof` folder.

In Visual Studio Code:

- Press Ctrl+Shift+B (Cmd+Shift+B on Mac) to compile the client and server.
- Run `npm run prepare-tests` in the `vscode/client` folder.
- Switch to the Debug viewlet.
- Select `Langauge Server E2E Test` from the drop down.
- Run the test config.
- An additional editor will momentarily open while the tests are run. It will close automatically once they are complete.
- Switch to the output view with Ctrl+Shift+U (Cmd+Shift+U on Mac) to see the results of the tests.

### Building/Installing the Extension

To build a `.vsix` extension package that can then be installed/published:

- Run `npm install` in the `microclimate-ls-node-prof` folder.
- Install the `vsce` package globally with `npm install -g vsce`.
- Run `vsce package` in the `microclimate-ls-node-prof` folder.
- A `.vsix` file will then be generated.

To install the extension:

- Run `code --install-extension <name of generated vsix file>` in the `microclimate-ls-node-prof` folder.
- Restart Visual Studio Code.
- The extension should appear in your list of installed extensions.

For more information refer to: <https://code.visualstudio.com/api/working-with-extensions/publishing-extension>
