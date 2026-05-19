import { execa } from 'execa';
import type { PackageChangeItem } from './versions.types.mts';
import { MAIN_BRANCH_NAME, COLOR_SYMBOLS, RELEASE_TYPES } from './versions.constants.mts';
import semver from 'semver';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getHighestReleaseType = (changes: PackageChangeItem[]) => {
  const changeTypes = changes.map((el) => {
    return semver.diff(el.version, el.newVersion);
  });

  for (const releaseType of RELEASE_TYPES) {
    if (changeTypes.some((el) => el === releaseType)) {
      return releaseType;
    }
  }

  return null;
};

export const updateRootVersion = (releaseType: semver.ReleaseType) => {
  const filePath = path.resolve(__dirname, '../package.json');
  const packageData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!packageData.version) {
    throw new Error('в package.json отсутствует поле version');
  }
  const newVersion = semver.inc(packageData.version, releaseType);
  if (!newVersion) {
    throw new Error('Не удалось определить версию нового релиза');
  }
  packageData.version = newVersion;
  fs.writeFileSync(filePath, JSON.stringify(packageData, null, 2) + '\n', 'utf8');

  return newVersion;
};

// stdout - вывод lerna с флагом --json
// https://github.com/lerna/lerna/tree/main/libs/commands/version#--json
export const extractChanges = (stdout: string) => {
  try {
    const result = JSON.parse(stdout);
    if (Array.isArray(result)) {
      return result as PackageChangeItem[];
    }
  } catch {}
  return undefined;
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
  const { stdout } = await execa`git status --porcelain`;
  return Boolean(stdout.trim());
};

export const gitPullOriginMain = async () => {
  logInfo(`Обновляем ветку ${MAIN_BRANCH_NAME}`);
  const promise = execa`git pull origin ${MAIN_BRANCH_NAME}`;
  // Направляем вывод git в консоль
  promise.stdout.pipe(process.stdout);
  promise.stderr.pipe(process.stderr);
  await promise;
  logSuccess(`Обновили ветку ${MAIN_BRANCH_NAME}`);
};

export const gitFetchTags = async () => {
  logInfo('Обновляем теги');
  const promise = execa`git fetch --tags`;
  // Направляем вывод git в консоль
  promise.stdout.pipe(process.stdout);
  promise.stderr.pipe(process.stderr);
  await promise;
  logSuccess('Обновили теги');
};

export const lernaVersion = async () => {
  const promise = execa`
    yarn lerna version
      --conventional-commits
      --conventional-graduate
      --include-merged-tags
      --no-git-tag-version
      --json
      --yes
      --allow-branch ${MAIN_BRANCH_NAME}`;
  // Направляем вывод lerna в консоль
  promise.stdout.pipe(process.stdout);
  promise.stderr.pipe(process.stderr);

  const { stdout } = await promise;
  return extractChanges(stdout);
};

export const gitCreateCommit = async (params: { title: string; description: string }) => {
  const { title, description } = params;
  await execa`git add .`;

  const promise = execa`git commit -m ${title} -m ${description}`;
  promise.stdout.pipe(process.stdout);
  promise.stderr.pipe(process.stderr);
  await promise;
  logSuccess(`Создан коммит: ${title}`);
};

export const gitCreateTag = async (tagName: string) => {
  const promise = execa`git tag -a ${tagName} -m ${tagName}`;
  promise.stdout.pipe(process.stdout);
  promise.stderr.pipe(process.stderr);
  await promise;
  logSuccess(`Создан тег: ${tagName}`);
};

export const gitPush = async (tagName: string) => {
  const promise = execa`git push --atomic origin ${MAIN_BRANCH_NAME} ${tagName}`;
  promise.stdout.pipe(process.stdout);
  promise.stderr.pipe(process.stderr);
  await promise;
  logSuccess(`Изменения отправлены в удаленный репозиторий, ветка: ${MAIN_BRANCH_NAME}`);
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
