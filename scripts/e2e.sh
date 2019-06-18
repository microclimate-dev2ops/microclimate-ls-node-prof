#!/usr/bin/env bash
CODE_TESTS_PATH="$(pwd)/vscode/client/out/test";
CODE_TESTS_WORKSPACE="$(pwd)/vscode/client/out/test/workspace";

export CODE_TESTS_PATH;
export CODE_TESTS_WORKSPACE;

node "$(pwd)/vscode/client/node_modules/vscode/bin/test"
