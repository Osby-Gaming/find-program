# find-program
Find the install location of a program with some clues. Not recommended for production use, works primarily with steam games on windows at the moment. Will be improved once need be for our other projects.

## Usage
```ts
import { findProgram } from "find-program";

const installLocation = await findProgram({
    "windows_display_name": "Counter-Strike 2",
    "windows_uninstall_registry_key": "Steam App 730"
});
```

## API
### findProgram
`findProgram` takes a clue object as its only argument. The clue object is an object with the following properties:

| Property | Type | Description |
| --- | --- | --- |
| `windows_display_name` | string? | The display name of the program you want to find. |
| `windows_uninstall_registry_key` | string? | The uninstall registry key of the program you want to find. |
| `windows_publisher_name` | string? | The publisher name of the program you want to find. |
| `windows_program_name` | string? | The program name of the program you want to find. |

You either need to provide a `windows_display_name` and/or a `windows_uninstall_registry_key`, or you need to provide both a `windows_publisher_name` and a `windows_program_name`.

The function returns a promise that resolves to the install location of the program you want to find, or `null` if the program is not installed/found.