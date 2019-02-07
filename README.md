# Microclimate Node.js Profiling Language Server
You can use the Microclimate Node.js Profiling Language Server to provide code highlighting showing relative time spent in JavaScript functions based on profiling data gathered through Microclimate Load Testing.

## Running/Development
With Visual Studio Code:
- Clone this repsitory locally.
- Run `npm install` in the `vscode` folder. This installs all necessary npm modules in both the client and server folder
- Open the clone of this repository in Visual Studio Code.
- Press Ctrl+Shift+B (Cmd+Shift+B on Mac) to compile the client and server.
- Switch to the Debug viewlet.
- Select `Launch Client` from the drop down and press the Run icon.
- If you want to debug the server as well use the launch configuration `Attach to Server`

## Usage
With Visual Studio Code:
- Open a local project created with https://microclimate-dev2ops.github.io/installlocally and profiled using the [Performance Test](https://microclimate-dev2ops.github.io/performancetesting#performance-testing-your-project) feature of Microclimate.
- This will create profiling data in a `load-test/[datestamp]/profiling.json` file in your Microclimate project.
- In Visual Studio Code (in the [Extension Development Host] instance if you are developing/debugging) open a JavaScript file.
- The language server will highlight any lines which were found in the profiling data and annotate them to show how often they were seen and where they were called from.

## Testing
Setup:
- Run `npm install` in the `vscode` folder.

In Visual Studio Code:
- Press Ctrl+Shift+B (Cmd+Shift+B on Mac) to compile the client and server.
- Run `npm run prepare-tests` in the `vscode` folder.
- Switch to the Debug viewlet.
- Select `Langauge Server E2E Test` from the drop down.
- Run the test config.
- An additional editor will momentarily open while the tests are run. It will close automatically once they are complete.
- Switch to the output view with Ctrl+Shift+U (Cmd+Shift+U on Mac) to see the results of the tests.