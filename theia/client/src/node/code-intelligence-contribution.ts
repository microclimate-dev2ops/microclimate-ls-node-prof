/*
* IBM Confidential
*
* OCO Source Materials
*
* Copyright IBM Corp. 2017
*
* The source code for this program is not published or otherwise divested
* of its trade secrets, irrespective of what has been deposited with the
* U.S. Copyright Office.
*/

import * as path from 'path';
import { injectable } from "inversify";
import { IConnection, BaseLanguageServerContribution } from "@theia/languages/lib/node";
import { MC_LANGUAGE_ID, MC_LANGUAGE_NAME } from '../common';

@injectable()
export class CodeIntelligenceContribution extends BaseLanguageServerContribution {

    readonly id = MC_LANGUAGE_ID;
    readonly name = MC_LANGUAGE_NAME;

    start(clientConnection: IConnection): void {
        const serverPath = path.resolve(__dirname, '../../../server');
        const nodePath = path.join(serverPath, 'lib', 'server.js');

        console.log(serverPath);
        console.log(nodePath);

        const command = 'node';
        const args: string[] = [
        ];

        args.push(
            nodePath,
            '--stdio'
        );

        try {
            console.log('Starting Code Intelligence language server.');
            const serverConnection = this.createProcessStreamConnection(command, args);
            serverConnection.reader.onError(err => {
                console.log(err);
             });
            console.log('Stared Code Intelligence language server.');
            console.dir(serverConnection);
            this.forward(clientConnection, serverConnection);
        } catch (error) {
            console.dir(error);
            throw error;
        }
    }
}
