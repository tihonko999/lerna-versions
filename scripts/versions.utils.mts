import { execa } from 'execa';
import type { PackageChangeItem } from './versions.types.mts';
import { MAIN_BRANCH_NAME, COLOR_SYMBOLS } from './versions.constants.mts';

// stdout - вывод lerna с флагом --json
// https://github.com/lerna/lerna/tree/main/libs/commands/version#--json
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

export const createCommitDescription = (changes: PackageChangeItem[]) => {
  const commitDescription = changes.map((el) => ` - ${el.name}@${el.newVersion}`).join('\n');
  return commitDescription;
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

export const gitPullOriginMain = async () => {
  logInfo(`Обновляем ветку ${MAIN_BRANCH_NAME}`);
  const gitPullPromise = execa`git pull origin ${MAIN_BRANCH_NAME}`;
  // Направляем вывод git в консоль
  gitPullPromise.stdout.pipe(process.stdout);
  gitPullPromise.stderr.pipe(process.stderr);
  await gitPullPromise;
  logSuccess(`Обновили ветку ${MAIN_BRANCH_NAME}`);
};

export const gitFetchTags = async () => {
  logInfo('Обновляем теги');
  const gitFetchPromise = execa`git fetch --tags`;
  // Направляем вывод git в консоль
  gitFetchPromise.stdout.pipe(process.stdout);
  gitFetchPromise.stderr.pipe(process.stderr);
  await gitFetchPromise;
  logSuccess('Обновили теги');
};

export const logError = (msg: string) => {
  console.log(`${COLOR_SYMBOLS.FgRed}%s${COLOR_SYMBOLS.Reset}`, msg);
};

export const logSuccess = (msg: string) => {
  console.log(`${COLOR_SYMBOLS.FgGreen}%s${COLOR_SYMBOLS.Reset}`, msg);
};

export const logInfo = (msg: string) => {
  console.log(`${COLOR_SYMBOLS.FgBlue}%s${COLOR_SYMBOLS.Reset}`, msg);
};
