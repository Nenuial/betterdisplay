import { useState, useEffect } from "react";
import { List, Color, ActionPanel, Action, Toast, showToast } from "@raycast/api";
import {
  fetchDisplays,
  fetchDisplayStatus,
  fetchDisplayResolution,
  fetchMainDisplay,
  Display,
} from "./utils";
import { toggleDisplay, togglePIP } from "./actions";

type FilterOption = "all" | "displays" | "virtualScreens";

type DisplayItemProps = {
  display: Display;
  status: string;
  resolution: string;
  isMain: boolean;
  onToggle: () => void;
};

function DisplayItem({ display, status, resolution, isMain, onToggle }: DisplayItemProps) {
  const normalizedStatus = status || "Loading";
  const statusColor = normalizedStatus.toLowerCase() === "on" ? Color.Green : Color.Red;

  // Build accessories. Always include the status tag.
  const accessories: List.Item.Accessory[] = [
    {
      tag: {
        value: normalizedStatus,
        color: statusColor,
      },
    },
  ];

  // Only show resolution if the display is on.
  if (normalizedStatus.toLowerCase() === "on" && resolution && resolution !== "Loading") {
    accessories.push({
      tag: {
        value: resolution,
        color: Color.Blue,
      },
    });
  }

  return (
    <List.Item
      key={display.tagID}
      id={display.tagID}
      title={display.name}
      subtitle={isMain ? "Main Display" : undefined}
      accessories={accessories}
      actions={
        <ActionPanel>
          <Action
            title="Toggle Display"
            onAction={async () => {
              try {
                await toggleDisplay(display.tagID);
                await showToast({
                  title: "Display toggled",
                  message: `${display.name} has been toggled.`,
                  style: Toast.Style.Success,
                });
                onToggle();
              } catch (error) {
                await showToast({
                  title: "Error toggling display",
                  message: error instanceof Error ? error.message : "Unknown error",
                  style: Toast.Style.Failure,
                });
              }
            }}
          />
          {normalizedStatus.toLowerCase() === "on" && (
            <Action
              title="Toggle PIP"
              onAction={async () => {
                try {
                  await togglePIP(display.tagID);
                  await showToast({
                    title: "PIP toggled",
                    message: `${display.name} PIP has been toggled.`,
                    style: Toast.Style.Success,
                  });
                  onToggle();
                } catch (error) {
                  await showToast({
                    title: "Error toggling PIP",
                    message: error instanceof Error ? error.message : "Unknown error",
                    style: Toast.Style.Failure,
                  });
                }
              }}
            />
          )}
        </ActionPanel>
      }
    />
  );
}

export default function ListDisplays() {
  const [displays, setDisplays] = useState<Display[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statuses, setStatuses] = useState<{ [tagID: string]: string }>({});
  const [resolutions, setResolutions] = useState<{ [tagID: string]: string }>({});
  const [filter, setFilter] = useState<FilterOption>("all");
  const [mainDisplay, setMainDisplay] = useState<Display | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  // Load all displays.
  useEffect(() => {
    async function loadDisplays() {
      try {
        const stdout = await fetchDisplays();
        const jsonString = stdout ? `[${stdout.trim()}]` : "[]";
        const data = JSON.parse(jsonString) as Display[];
        setDisplays(data);
      } catch (error) {
        console.error("Failed to load displays", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDisplays();
  }, []);

  // Load main display.
  useEffect(() => {
    async function loadMainDisplay() {
      const main = await fetchMainDisplay();
      setMainDisplay(main);
    }
    loadMainDisplay();
  }, []);

  // Fetch connection statuses. Refresh when refreshCount changes.
  useEffect(() => {
    async function loadStatuses() {
      const newStatuses: { [tagID: string]: string } = {};
      await Promise.all(
        displays.map(async (display) => {
          const status = await fetchDisplayStatus(display.tagID);
          newStatuses[display.tagID] = status;
        })
      );
      setStatuses(newStatuses);
    }
    if (displays.length > 0) {
      loadStatuses();
    }
  }, [displays, refreshCount]);

  // Fetch resolutions only for displays that are "on".
  useEffect(() => {
    async function loadResolutions() {
      const newResolutions: { [tagID: string]: string } = {};
      await Promise.all(
        displays.map(async (display) => {
          const status = statuses[display.tagID];
          if (status && status.toLowerCase() === "on") {
            const resolution = await fetchDisplayResolution(display.tagID);
            newResolutions[display.tagID] = resolution;
          }
        })
      );
      setResolutions(newResolutions);
    }
    if (displays.length > 0 && Object.keys(statuses).length > 0) {
      loadResolutions();
    }
  }, [displays, statuses, refreshCount]);

  // Function to trigger a refresh of statuses/resolutions.
  const handleToggleRefresh = () => {
    setRefreshCount((prev) => prev + 1);
  };

  // Categorize displays.
  const displayItems = displays.filter((d) => d.deviceType === "Display");
  const virtualScreenItems = displays.filter((d) => d.deviceType === "VirtualScreen");

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Filter displays by name"
      searchBarAccessory={
        <List.Dropdown
          tooltip="Filter Display Type"
          storeValue={true}
          onChange={(newValue) => setFilter(newValue as FilterOption)}
        >
          <List.Dropdown.Section title="Filter">
            <List.Dropdown.Item value="all" title="All" />
            <List.Dropdown.Item value="displays" title="Displays" />
            <List.Dropdown.Item value="virtualScreens" title="Virtual Screens" />
          </List.Dropdown.Section>
        </List.Dropdown>
      }
    >
      {(filter === "all" || filter === "displays") && (
        <List.Section title="Displays">
          {displayItems.map((display) => (
            <DisplayItem
              key={display.tagID}
              display={display}
              status={statuses[display.tagID] || "Loading"}
              resolution={resolutions[display.tagID] || "Loading"}
              isMain={mainDisplay?.tagID === display.tagID}
              onToggle={handleToggleRefresh}
            />
          ))}
        </List.Section>
      )}
      {(filter === "all" || filter === "virtualScreens") && (
        <List.Section title="Virtual Screens">
          {virtualScreenItems.map((display) => (
            <DisplayItem
              key={display.tagID}
              display={display}
              status={statuses[display.tagID] || "Loading"}
              resolution={resolutions[display.tagID] || "Loading"}
              isMain={mainDisplay?.tagID === display.tagID}
              onToggle={handleToggleRefresh}
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}
