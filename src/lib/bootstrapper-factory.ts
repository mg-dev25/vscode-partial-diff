import Bootstrapper from './bootstrapper';
import CommandFactory from './command-factory';
import WorkspaceAdaptor from './adaptors/workspace';
import ContentProvider from './content-provider';
import NormalisationRuleStore from './normalisation-rule-store';
import SelectionInfoRegistry from './selection-info-registry';
import * as vscode from 'vscode';
import CommandAdaptor from './adaptors/command';
import WindowAdaptor from './adaptors/window';
import { NullVsTelemetryReporter, VsTelemetryReporterCreator } from './telemetry-reporter';

export default class BootstrapperFactory {
    private workspaceAdaptor?: WorkspaceAdaptor;

    create() {
        const logger = console;
        const selectionInfoRegistry = new SelectionInfoRegistry();
        const workspaceAdaptor = this.getWorkspaceAdaptor();
        const commandAdaptor = new CommandAdaptor(vscode.commands, vscode.Uri.parse, logger);
        const normalisationRuleStore = new NormalisationRuleStore(workspaceAdaptor);
        const commandFactory = new CommandFactory(
            selectionInfoRegistry,
            normalisationRuleStore,
            commandAdaptor,
            new WindowAdaptor(vscode.window),
            vscode.env.clipboard,
            () => new Date()
        );
        const contentProvider = new ContentProvider(selectionInfoRegistry, normalisationRuleStore);
        return new Bootstrapper(commandFactory, contentProvider, workspaceAdaptor, commandAdaptor);
    }

    private getWorkspaceAdaptor() {
        this.workspaceAdaptor = this.workspaceAdaptor || new WorkspaceAdaptor(vscode.workspace);
        return this.workspaceAdaptor;
    }

    getVsTelemetryReporterCreator(): VsTelemetryReporterCreator {
        const enableTelemetry = this.getWorkspaceAdaptor().get<boolean>('enableTelemetry');

        if (enableTelemetry) {
            try {
                // Dynamic import to avoid dependency errors in non-VSCode environments
                const VsTelemetryReporter = require('@vscode/extension-telemetry');
                return (id: string, version: string, telemetryKey: string) => {
                    try {
                        return new VsTelemetryReporter(id, version, telemetryKey);
                    } catch (e) {
                        console.error('Failed to create VSCode telemetry reporter:', e);
                        return new NullVsTelemetryReporter();
                    }
                };
            } catch (e) {
                // If vscode-extension-telemetry isn't available (like in Open VSX)
                console.error('Failed to load vscode-extension-telemetry:', e);
                return () => new NullVsTelemetryReporter();
            }
        } else {
            return () => new NullVsTelemetryReporter();
        }
    }
}
