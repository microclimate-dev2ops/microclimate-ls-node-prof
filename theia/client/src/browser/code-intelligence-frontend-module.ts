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

import { CommandContribution } from '@theia/core';
import { LanguageClientContribution } from "@theia/languages/lib/browser";
import { CodeIntelligenceClientContribution } from "./code-intelligence-client-contribution";
import { bindCodeIntelligencePreferences } from './code-intelligence-preferences';
import { CodeIntelligenceCommandContribution } from "./code-intelligence-command-contribution";

export default new ContainerModule(bind => {
    bind(CodeIntelligenceClientContribution).toSelf().inSingletonScope();
    bind(LanguageClientContribution).toDynamicValue(ctx => ctx.container.get(CodeIntelligenceClientContribution));
    bind(CommandContribution).to(CodeIntelligenceCommandContribution);
    bindCodeIntelligencePreferences(bind);
});
