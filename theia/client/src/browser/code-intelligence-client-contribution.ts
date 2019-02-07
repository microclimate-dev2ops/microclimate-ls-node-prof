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

import { injectable, inject } from "inversify";
import {
    BaseLanguageClientContribution,
    Workspace,
    Languages,
    LanguageClientFactory,
} from '@theia/languages/lib/browser';
import { MC_LANGUAGE_ID, MC_LANGUAGE_NAME } from '../common';

@injectable()
export class CodeIntelligenceClientContribution extends BaseLanguageClientContribution {

    readonly id = MC_LANGUAGE_ID;
    readonly name = MC_LANGUAGE_NAME;

    constructor(
        @inject(Workspace) protected readonly workspace: Workspace,
        @inject(Languages) protected readonly languages: Languages,
        @inject(LanguageClientFactory) protected readonly languageClientFactory: LanguageClientFactory
    ) {
        super(workspace, languages, languageClientFactory);
    }

    protected get documentSelector() {
        return [
            'javascript'
        ];
    }

    protected get globPatterns() {
        return [
            '**/*.js'
        ];
    }

}
