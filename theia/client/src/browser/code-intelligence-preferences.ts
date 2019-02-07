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

import { interfaces } from 'inversify';
import { createPreferenceProxy, PreferenceContribution, PreferenceProxy, PreferenceSchema, PreferenceService } from '@theia/core/lib/browser';

export const CodeIntelligenceConfigSchema: PreferenceSchema = {
    "type": "object",
    "title": "Microclimate Profiling Configuration",
    "properties": {
      // The first part of the key must match the id we give the plugin.
      "microclimateProfiling.profilingfolder": {
        "scope": "resource",
        "type": "string",
        "default": "load-test",
        "description": "The folder name containing load-test results files."
      },
      "microclimateProfiling.showProfiling": {
        "scope": "resource",
        "type": "boolean",
        "default": true,
        "description": "The folder name containing load-test results files."
      },
    }
};

export interface CodeIntelligenceConfiguration  {
  profilingfolder: string;
}

export const CodeIntelligencePreferences = Symbol('CodeIntelligencePreferences');
export type CodeIntelligencePreferences = PreferenceProxy<CodeIntelligenceConfiguration>;

export function createCodeIntelligencePreferences(preferences: PreferenceService): CodeIntelligencePreferences {
    return createPreferenceProxy(preferences, CodeIntelligenceConfigSchema);
}

export function bindCodeIntelligencePreferences(bind: interfaces.Bind): void {
  bind(CodeIntelligencePreferences).toDynamicValue(ctx => {
      const preferences = ctx.container.get<PreferenceService>(PreferenceService);
      return createCodeIntelligencePreferences(preferences);
  });
  bind(PreferenceContribution).toConstantValue({ schema: CodeIntelligenceConfigSchema });
}

