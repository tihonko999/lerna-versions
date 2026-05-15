// import { execSync } from 'child_process';
import { execa } from 'execa';
import type { PackageChangeItem } from './versions.types.mts';
import { MAIN_BRANCH_NAME, COLOR_SYMBOLS } from './versions.constants.mts';

export const extractChanges = (stdout: string[]) => {
  try {
    // Первая строчка служебная - содержит имя файла и команду, ее исключаем
    const result = JSON.parse(stdout.slice(1).join('\n'));
    if (Array.isArray(result)) {
      return result as PackageChangeItem[];
    }
  } catch {}
  return undefined;
};

export const createTagName = (changes: PackageChangeItem[]) => {
  const tagName = changes.map((el) => [el.name, el.newVersion].join('@')).join('_');
  return tagName;
};

export const getJiraIssueId = async () => {
  const regEx = /RLS+-[0-9]+/;
  const { stdout } = await execa`git log -1 --oneline`;
  const result = stdout.match(regEx);
  return result?.[0];
};

export const isOnMainBranch = async () => {
  const { stdout } = await execa`git branch --show-current`;
  return stdout === MAIN_BRANCH_NAME;
};

export const hasUncommitedChanges = async () => {
  try {
    await execa`git diff-index --quiet HEAD`;
    return false;
  } catch {
    return true;
  }
};

export const logError = (msg: string) => {
  console.log(`${COLOR_SYMBOLS.FgRed}%s${COLOR_SYMBOLS.Reset}`, msg);
};

// [
//   {
//     name: 'footer',
//     version: '0.1.18',
//     private: true,
//     location: '/Users/a.tikhonenko/Sites/lerna-versions/packages/footer',
//     newVersion: '0.1.19'
//   },
//   {
//     name: 'remixapp',
//     version: '0.0.20',
//     private: true,
//     location: '/Users/a.tikhonenko/Sites/lerna-versions/packages/remixapp',
//     newVersion: '0.0.21'
//   }
// ]
