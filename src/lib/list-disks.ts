import { exec } from "child_process"

export default function listDisks() {
    exec('wmic logicaldisk get name', (error, stdout) => {
        console.log(
            stdout.split('\r\r\n')
                .filter(value => /[A-Za-z]:/.test(value))
                .map(value => value.trim())
        );
    });
}