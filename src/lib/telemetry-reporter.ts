import { ObjectMap } from './utils/collections';
import * as fs from 'fs';

export interface VsTelemetryReporterLike {
    sendTelemetryEvent(eventName: string, properties?: ObjectMap<string>, measurements?: ObjectMap<number>): void;
    dispose(): Promise<any>;
}

export class TelemetryReporterLocator {
    private static telemetryReporter: TelemetryReporter;

    static load(packageConfPath: string, reporterCreator: VsTelemetryReporterCreator): void {
        try {
            const packageInfo = JSON.parse(fs.readFileSync(packageConfPath, 'utf8'));
            const extensionId = `${packageInfo.publisher}.${packageInfo.name}`;
            const extensionVersion = packageInfo.version;
            const key = packageInfo.telemetryKey;

            // Create the reporter (either real or null based on environment and settings)
            const vsTelemetryReporter = reporterCreator(extensionId, extensionVersion, key);
            TelemetryReporterLocator.telemetryReporter = new TelemetryReporter(vsTelemetryReporter);
        } catch (e) {
            console.error('Failed to create telemetry reporter:', e);
            TelemetryReporterLocator.telemetryReporter = new TelemetryReporter(new NullVsTelemetryReporter());
        }
    }

    static getReporter(): TelemetryReporter {
        return TelemetryReporterLocator.telemetryReporter || new TelemetryReporter(new NullVsTelemetryReporter());
    }
}

export class TelemetryReporter {
    constructor(private readonly reporter: VsTelemetryReporterLike) { }

    logCommandTrigger(commandName: string): void {
        try {
            this.reporter.sendTelemetryEvent('commandTriggered', { commandName });
        } catch (e) {
            // Silently fail if telemetry isn't available
            console.error('Error logging command trigger:', e);
        }
    }

    logCommandErrored(commandName: string): void {
        try {
            this.reporter.sendTelemetryEvent('commandErrored', { commandName });
        } catch (e) {
            // Silently fail if telemetry isn't available
            console.error('Error logging command error:', e);
        }
    }

    dispose(): Promise<any> {
        try {
            return this.reporter.dispose();
        } catch (e) {
            console.error('Error disposing telemetry reporter:', e);
            return Promise.resolve();
        }
    }
}

export type VsTelemetryReporterCreator = (extensionId: string, extensionVersion: string, telemetryKey: string) => VsTelemetryReporterLike;

export class NullVsTelemetryReporter implements VsTelemetryReporterLike {
    sendTelemetryEvent(_eventName: string, _properties?: ObjectMap<string>, _measurements?: ObjectMap<number>): void {
        // No-op implementation
    }

    dispose(): Promise<any> {
        return Promise.resolve();
    }
}
