import { promisified as regedit, type RegistryItem } from "regedit";

export interface Clue {
    windows_registry_key?: string,
    windows_display_name?: string
}

const PREFIXES = ["HKCU", "HKLM"];
const SUFFIX = "\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall";

/**
 * @param {Clue} clue
 */
export default async function findProgram(clue: RequireAtLeastOne<Clue, 'windows_registry_key' | 'windows_display_name'>) {
    const registries: [string, string] = [
        PREFIXES[0] + SUFFIX,
        PREFIXES[1] + SUFFIX
    ]

    const registryResponses = await regedit.list(registries) as Record<typeof registries[0] | typeof registries[1], RegistryItem>;

    const responseHKCU = registryResponses[registries[0]];
    const responseHKLM = registryResponses[registries[1]];

    if (!responseHKCU?.exists || !responseHKLM?.exists) {
        throw Error("Registry doesn't exist.");
    }

    let i = 0;

    for (let response of [responseHKCU, responseHKLM]) {
        for (let key of response.keys) {
            if (key === clue.windows_registry_key) {
                const address = registries[i] + "\\" + key;

                const programRegistry = (await regedit.list([
                    address
                ]))[address];

                if (!programRegistry?.exists) {
                    continue;
                }

                const displayName = programRegistry.values["DisplayName"];

                if (!displayName && clue.windows_display_name) {
                    console.error("Found matching registry key but not display name.");

                    continue;
                }

                const installLocation = programRegistry.values["InstallLocation"];

                if (!installLocation || typeof installLocation.value !== "string") {
                    return new Error("Found registry item but it lacks an install location value.")
                }

                return installLocation.value;
            }
        }

        i++;
    }
}