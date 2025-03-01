import { ActionPanel, Form, Action, showToast, Toast, Icon, useNavigation } from "@raycast/api";
import { useState, useEffect } from "react";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

type ResolutionOption = {
  value: string; // The index number (e.g., "20")
  title: string; // Formatted details (e.g., "3440x1440 | 50Hz | 10bpc | Default")
  unsafe: boolean;
  icon: string;
  current: boolean;
};

type ResolutionFormProps = {
  display: {
    tagID: string;
    name: string;
  };
};

function parseResolutionList(output: string): ResolutionOption[] {
  // Split the output into non-empty lines.
  const lines = output.split("\n").filter((line) => line.trim().length > 0);
  const options: ResolutionOption[] = [];
  
  for (const line of lines) {
    // Example line:
    // "20 - 1280x832 HiDPI 60Hz 10bpc Native"
    const parts = line.split(" - ");
    if (parts.length < 2) continue;
    const index = parts[0].trim(); // e.g. "20"
    const details = parts[1].trim();
    const tokens = details.split(/\s+/);
    if (tokens.length < 3) continue;
    
    // First token is always the resolution.
    const resolution = tokens[0];
    
    // Check if "HiDPI" is present immediately after the resolution.
    let hasHiDPI = false;
    let startIndex = 1;
    if (tokens[1] === "HiDPI") {
      hasHiDPI = true;
      startIndex = 2;
    }
    
    // Next tokens: refresh rate and color depth.
    const refreshRate = tokens[startIndex] || "";
    const colorDepth = tokens[startIndex + 1] || "";
    
    // Build extras array: include "Default" if present.
    const extras: string[] = [];
    if (tokens.includes("Default")) {
      extras.push("Default");
    }
    // "Native" should always be last if present.
    if (tokens.includes("Native")) {
      extras.push("Native");
    }
    
    // Build title: start with resolution, then HiDPI (if present), then refresh rate, color depth, then extras.
    const titleParts: string[] = [];
    titleParts.push(resolution);
    if (hasHiDPI) {
      titleParts.push("HiDPI");
    }
    titleParts.push(refreshRate);
    titleParts.push(colorDepth);
    titleParts.push(...extras);
    const title = titleParts.join(" | ");
    
    const unsafe = tokens.includes("Unsafe");
    const current = tokens.includes("Current");
    const icon = current ? Icon.CircleFilled : Icon.CircleDisabled;
    
    options.push({ value: index, title, unsafe, icon, current });
  }
  
  return options;
}

export default function ResolutionForm(props: ResolutionFormProps) {
  const { display } = props;
  const tagID = display.tagID;
  const displayName = display.name;
  const { pop } = useNavigation();

  const [resolutionOptions, setResolutionOptions] = useState<ResolutionOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadResolutions() {
      try {
        const { stdout } = await execPromise(
          `/Applications/BetterDisplay.app/Contents/MacOS/BetterDisplay get -tagID=${tagID} -feature=displayModeList`
        );
        const options = parseResolutionList(stdout);
        setResolutionOptions(options);
      } catch (error) {
        console.error("Failed to load resolution options", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadResolutions();
  }, [tagID]);

  // Set defaultValue to the value of the current resolution option (if available)
  const defaultValue = resolutionOptions.find((option) => option.current)?.value;

  return (
    <Form
      isLoading={isLoading}
      navigationTitle={`Change Resolution for ${displayName}`}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Set Resolution"
            onSubmit={async (values) => {
              const selectedModeNumber = values.resolution as string;
              try {
                const command = `/Applications/BetterDisplay.app/Contents/MacOS/BetterDisplay set -tagID=${tagID} -feature=displayModeNumber -value=${selectedModeNumber}`;
                await execPromise(command);
                await showToast({
                  title: "Resolution Set",
                  message: `Display mode changed to option ${selectedModeNumber}`,
                  style: Toast.Style.Success,
                });
                pop();
              } catch (error) {
                console.error("Failed to set resolution", error);
                await showToast({
                  title: "Error Setting Resolution",
                  message: error instanceof Error ? error.message : "Unknown error",
                  style: Toast.Style.Failure,
                });
              }
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Description title="Display" text={displayName} />
      <Form.Dropdown id="resolution" title="Resolution" defaultValue={defaultValue}>
        <Form.Dropdown.Section title="Safe Resolutions">
          {resolutionOptions
            .filter((option) => !option.unsafe)
            .map((option) => (
              <Form.Dropdown.Item key={option.value} value={option.value} title={option.title} icon={option.icon} />
            ))}
        </Form.Dropdown.Section>
        <Form.Dropdown.Section title="Unsafe Resolutions">
          {resolutionOptions
            .filter((option) => option.unsafe)
            .map((option) => (
              <Form.Dropdown.Item key={option.value} value={option.value} title={option.title} icon={option.icon} />
            ))}
        </Form.Dropdown.Section>
      </Form.Dropdown>
    </Form>
  );
}
