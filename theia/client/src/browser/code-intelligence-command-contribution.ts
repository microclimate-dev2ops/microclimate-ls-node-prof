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
    CommandContribution,
		CommandRegistry,
		MessageService
} from '@theia/core';
import { PreferenceService } from '@theia/core/lib/browser';

export const ToggleProfilingCommand = {
	id: 'ToggleProfiling.command',
	label: "Code Intelligence: Toggle Profiling"
};
@injectable()
export class CodeIntelligenceCommandContribution implements CommandContribution {

	constructor(
			@inject(PreferenceService) private readonly preferenceService: PreferenceService,
			@inject(MessageService) private readonly messageService: MessageService,
	) { }

	registerCommands(registry: CommandRegistry): void {
			registry.registerCommand(ToggleProfilingCommand, {
					execute: () => {
						const newShowProfiling: boolean = !this.preferenceService.get('microclimateProfiling.showProfiling');
						this.preferenceService.set('microclimateProfiling.showProfiling', newShowProfiling);
						this.messageService.info(`Code Intelligence: Method profiling ${ newShowProfiling ? 'enabled' : 'disabled' }.`,);
					}
			});
	}
}
