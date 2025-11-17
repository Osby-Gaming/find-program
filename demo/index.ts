import { findProgram } from "../dist/esm";

// Finds the install location of Counter-Strike 2 by looking for the uninstall registry key.
console.log(await findProgram({
    "windows_display_name": "Counter-Strike 2",
    "windows_uninstall_registry_key": "Steam App 730"
}));

// Finds the install location of Counter-Strike 2 by looking in the software registry.
console.log(await findProgram({
    "windows_publisher_name": "Valve",
    "windows_program_name": "cs2"
}));