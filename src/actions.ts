import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function toggleDisplay(tagID: string): Promise<string> {
  try {
    const command = `/Applications/BetterDisplay.app/Contents/MacOS/BetterDisplay toggle -tagID=${tagID} -feature=connected`;
    const { stdout } = await execPromise(command);
    return stdout.trim();
  } catch (error) {
    console.error(`Error toggling display with tagID ${tagID}:`, error);
    throw error;
  }
}

export async function togglePIP(tagID: string): Promise<string> {
  try {
    const command = `/Applications/BetterDisplay.app/Contents/MacOS/BetterDisplay toggle -tagID=${tagID} -feature=pip`;
    const { stdout } = await execPromise(command);
    return stdout.trim();
  } catch (error) {
    console.error(`Error toggling PIP for display with tagID ${tagID}:`, error);
    throw error;
  }
}

export async function fetchDisplayModeList(tagID: string): Promise<string> {
  try {
    const command = `/Applications/BetterDisplay.app/Contents/MacOS/BetterDisplay get -tagID=${tagID} -feature=displayModeList`;
    const { stdout } = await execPromise(command);
    return stdout;
  } catch (error) {
    console.error(`Error fetching display mode list for tagID ${tagID}:`, error);
    throw error;
  }
}

export async function setDisplayResolution(tagID: string, modeNumber: string): Promise<string> {
  try {
    const command = `/Applications/BetterDisplay.app/Contents/MacOS/BetterDisplay set -tagID=${tagID} -feature=displayModeNumber -value=${modeNumber}`;
    const { stdout } = await execPromise(command);
    return stdout.trim();
  } catch (error) {
    console.error(`Error setting display resolution for tagID ${tagID}:`, error);
    throw error;
  }
}
