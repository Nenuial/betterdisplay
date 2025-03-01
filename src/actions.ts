import { exec } from "child_process";
import { promisify } from "util";
import { getPreferenceValues } from "@raycast/api";

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

// New functions for brightness adjustments.
export async function increaseBrightness(tagID: string): Promise<string> {
  const preferences = getPreferenceValues<{ brightnessIncrement: string }>();
  const increment = Number(preferences.brightnessIncrement) || 0.05;
  const getCmd = `/Applications/BetterDisplay.app/Contents/MacOS/BetterDisplay get -tagID=${tagID} -feature=brightness`;
  const { stdout: currStr } = await execPromise(getCmd);
  const currentBrightness = parseFloat(currStr.trim());
  const newBrightness = Math.min(1, currentBrightness + increment);
  const setCmd = `/Applications/BetterDisplay.app/Contents/MacOS/BetterDisplay set -tagID=${tagID} -feature=brightness -value=${newBrightness}`;
  const { stdout } = await execPromise(setCmd);
  return stdout.trim();
}

export async function decreaseBrightness(tagID: string): Promise<string> {
  const preferences = getPreferenceValues<{ brightnessIncrement: string }>();
  const increment = Number(preferences.brightnessIncrement) || 0.05;
  const getCmd = `/Applications/BetterDisplay.app/Contents/MacOS/BetterDisplay get -tagID=${tagID} -feature=brightness`;
  const { stdout: currStr } = await execPromise(getCmd);
  const currentBrightness = parseFloat(currStr.trim());
  const newBrightness = Math.max(0, currentBrightness - increment);
  const setCmd = `/Applications/BetterDisplay.app/Contents/MacOS/BetterDisplay set -tagID=${tagID} -feature=brightness -value=${newBrightness}`;
  const { stdout } = await execPromise(setCmd);
  return stdout.trim();
}
