import { promisified as regedit, setExternalVBSLocation as VBA, type RegistryItem } from "regedit";
import type { RequireAtLeastOne } from "../types";

export const setExternalVBSLocation = VBA;

export interface Clue {
  windows_uninstall_registry_key?: string;
  windows_display_name?: string;
}

export interface PublisherClue {
  windows_publisher_name: string;
  windows_program_name: string;
}

const PREFIXES = ["HKCU", "HKLM"];

const VALID_INSTALL_LOCATION_VALUE_NAMES = [
  "installlocation",
  "installdir",
  "installpath",
];

function getValidInstallLocationValueName(item: RegistryItem): string | null {
  for (let value in item.values) {
    if (VALID_INSTALL_LOCATION_VALUE_NAMES.includes(value.toLowerCase())) {
      return value;
    }
  }

  return null;
}

export async function findProgram(
  clue:
    | RequireAtLeastOne<
        Clue,
        "windows_uninstall_registry_key" | "windows_display_name"
      >
    | PublisherClue
): Promise<string | null> {
  // @ts-expect-error
  if (typeof clue.windows_uninstall_registry_key === "string") {
    // @ts-expect-error
    return await findProgramByUninstallRegistryKeyOnWindows(clue);
  }

  // @ts-expect-error
  return await findProgramByPublisherNameOnWindows(clue);
}

/**
 * @param {Clue} clue
 */
async function findProgramByUninstallRegistryKeyOnWindows(
  clue: RequireAtLeastOne<
    Clue,
    "windows_uninstall_registry_key" | "windows_display_name"
  >
) {
  const SUFFIX = "\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall";

  const registries: [string, string] = [
    PREFIXES[0] + SUFFIX,
    PREFIXES[1] + SUFFIX,
  ];

  const registryResponses = (await regedit.list(registries)) as Record<
    (typeof registries)[0] | (typeof registries)[1],
    RegistryItem
  >;

  const responseHKCU = registryResponses[registries[0]];
  const responseHKLM = registryResponses[registries[1]];

  if (!responseHKCU?.exists || !responseHKLM?.exists) {
    throw new Error("Registry doesn't exist.");
  }

  let i = 0;

  for (let response of [responseHKCU, responseHKLM]) {
    for (let key of response.keys) {
      if (key === clue.windows_uninstall_registry_key) {
        const address = registries[i] + "\\" + key;

        const programRegistry = (await regedit.list([address]))[address];

        if (!programRegistry?.exists) {
          continue;
        }

        const displayName = programRegistry.values["DisplayName"]?.value;

        if (!displayName && clue.windows_display_name !== displayName) {
          console.error("Found matching registry key but not display name.");

          continue;
        }

        const valueName = getValidInstallLocationValueName(programRegistry);

        if (valueName === null) {
          throw new Error(
            "Found registry item but it lacks a valid install location value-pair."
          );
        }

        const installLocation = programRegistry.values[valueName];

        if (!installLocation || typeof installLocation.value !== "string") {
          throw new Error(
            "Found registry item but it lacks an install location value."
          );
        }

        return installLocation.value;
      }
    }

    i++;
  }

  i = 0;

  for (let response of [responseHKCU, responseHKLM]) {
    for (let key of response.keys) {
      const address = registries[i] + "\\" + key;

      const programRegistry = (await regedit.list([address]))[address];

      if (!programRegistry?.exists) {
        continue;
      }

      const displayName = programRegistry.values["DisplayName"]?.value;

      if (!displayName && clue.windows_display_name) {
        console.error(address, "Found no display name.");

        continue;
      }

      if (displayName === clue.windows_display_name) {
        const installLocation = programRegistry.values["InstallLocation"];

        if (!installLocation || typeof installLocation.value !== "string") {
          throw new Error(
            "Found registry item but it lacks an install location value."
          );
        }

        return installLocation.value;
      }
    }

    i++;
  }

  return null;
}

async function findProgramByPublisherNameOnWindows(
  clue: PublisherClue
): Promise<string | null> {
  const SUFFIXES: [string, string] = [
    "\\SOFTWARE" +
      `\\${clue.windows_publisher_name}\\${clue.windows_program_name}`,
    "\\SOFTWARE\\Wow6432Node" +
      `\\${clue.windows_publisher_name}\\${clue.windows_program_name}`,
  ];

  const registries: [string, string, string, string] = [
    PREFIXES[0] + SUFFIXES[0],
    PREFIXES[1] + SUFFIXES[0],
    PREFIXES[0] + SUFFIXES[1],
    PREFIXES[1] + SUFFIXES[1],
  ];

  const registryResponses = (await regedit.list(registries)) as Record<
    (typeof registries)[0] | (typeof registries)[1] | (typeof registries)[2] | (typeof registries)[3],
    RegistryItem
  >;

  const responseHKCU = registryResponses[registries[0]];
  const responseHKLM = registryResponses[registries[1]];
  const responseHKCU2 = registryResponses[registries[2]];
  const responseHKLM2 = registryResponses[registries[3]];

  if (!responseHKCU?.exists && !responseHKLM?.exists && !responseHKCU2?.exists && !responseHKLM2?.exists) {
    console.error("Registry doesn't exist.");

    return null;
  }

  for (let response of [responseHKCU, responseHKLM, responseHKCU2, responseHKLM2]) {
    if (!response?.exists) {
      continue;
    }

    const locationValueName = getValidInstallLocationValueName(response);

    if (!locationValueName) {
      throw new Error(
        "Found registry item but it lacks a valid install location value-pair."
      );
    }

    const installLocation = response.values[locationValueName];

    if (!installLocation || typeof installLocation.value !== "string") {
      throw new Error(
        "Found registry item but it lacks an install location value."
      );
    }

    return installLocation.value;
  }

  return null;
}
