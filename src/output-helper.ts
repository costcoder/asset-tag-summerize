import * as fs from 'fs';
import * as path from 'path';
import {AwsTotalSummary, ServiceError} from "./interfaces.js";

/**
 * Generate a timestamped filename
 */
export function generateTimestampedFilename(prefix: string, extension: string): string {
    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/:/g, '-')
        .replace(/\..+/, ''); // Remove milliseconds
    return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Initialize output files and return their paths
 */
export function initializeOutputFiles(
    outputPath?: string,
    errorLogPath?: string
): { resultsFile: string; errorLogFile: string } {
    const resultsFile = outputPath || generateTimestampedFilename('scan-results', 'json');
    const errorLogFile = errorLogPath || generateTimestampedFilename('scan-errors', 'log');

    // Create initial JSON structure
    const initialData = {
        scanMetadata: {
            timestamp: new Date().toISOString(),
            status: 'in-progress'
        },
        summary: {},
        errors: []
    };

    fs.writeFileSync(resultsFile, JSON.stringify(initialData, null, 2));

    // Create empty error log
    const header = `Assets Scanner Error Log\n` +
                   `Started: ${new Date().toISOString()}\n` +
                   `${'='.repeat(80)}\n\n`;
    fs.writeFileSync(errorLogFile, header);

    return { resultsFile, errorLogFile };
}

/**
 * Write final results to JSON file
 */
export function writeFinalResults(
    filePath: string,
    summary: AwsTotalSummary,
    credentialsFile: string,
    errors: ServiceError[]
): void {
    const output = {
        scanMetadata: {
            timestamp: new Date().toISOString(),
            credentialsFile: credentialsFile,
            totalAccounts: Object.keys(summary.accountSummary).length,
            servicesScanned: 27,
            status: 'completed'
        },
        summary: summary,
        errors: errors
    };

    fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
}

/**
 * Append an error to the error log file
 */
export function appendErrorToLog(
    filePath: string,
    error: ServiceError,
    accountId?: string
): void {
    const logEntry = `[${error.timestamp}] ERROR - Service: ${error.service}\n` +
                     (accountId ? `Account: ${accountId}\n` : '') +
                     `Error Type: ${error.error}\n` +
                     `Message: ${error.message}\n` +
                     `${'-'.repeat(80)}\n\n`;

    fs.appendFileSync(filePath, logEntry);
}

/**
 * Write completion message to error log
 */
export function finalizeErrorLog(
    filePath: string,
    totalErrors: number
): void {
    const footer = `\n${'='.repeat(80)}\n` +
                   `Scan completed: ${new Date().toISOString()}\n` +
                   `Total errors: ${totalErrors}\n`;

    fs.appendFileSync(filePath, footer);
}
