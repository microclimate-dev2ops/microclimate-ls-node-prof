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

import { ContainerModule } from "inversify";
import { LanguageServerContribution } from "@theia/languages/lib/node";
import { CodeIntelligenceContribution } from './code-intelligence-contribution';

export default new ContainerModule(bind => {
    bind(LanguageServerContribution).to(CodeIntelligenceContribution).inSingletonScope();
});
