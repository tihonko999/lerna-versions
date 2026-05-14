import { execSync } from 'child_process';

// const output = execSync('grep -o -E "(RLS+-[0-9]+)" <<< $(git log -1 --oneline)');
try {
  // @ts-expect-error
} catch (error: Error) {
  // If the command fails (non-zero exit code), it throws an error
  console.error(`Error status: ${error.status}`);
  console.error(`Stderr: ${error.stderr.toString()}`);
}
const output = execSync('git log -1 --oneline').toString();

console.log(output);
