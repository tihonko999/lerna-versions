import { execa } from 'execa';
import { MAIN_BRANCH_NAME, COLOR_SYMBOLS } from './release.constants.mts';

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
  await execa`git pull origin ${MAIN_BRANCH_NAME}`;
  logSuccess(`Обновили ветку ${MAIN_BRANCH_NAME}`);
};

export const gitFetchTags = async () => {
  logInfo('Обновляем теги');
  // Получаем список всех локальных тегов
  const { stdout } = await execa`git tag`;
  const tags = stdout
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean);
  // Удаляем все локальные теги, если они есть
  if (tags.length > 0) {
    // Передаем массив тегов аргументами: git tag -d tag1 tag2 ...
    await execa('git', ['tag', '-d', ...tags]);
  }
  // Подтягиваем все теги из удаленного репозитория
  await execa`git fetch --tags --quiet`;
  logSuccess('Обновили теги');
};

export const lernaVersion = async (commitMessage: string) => {
  const promise = execa`
    yarn lerna version
      --allow-branch ${MAIN_BRANCH_NAME}
      --message ${commitMessage}
      `;
  // Направляем вывод lerna в консоль
  promise.stdout.pipe(process.stdout);
  promise.stderr.pipe(process.stderr);

  await promise;
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

export const getChangedPackages = async () => {
  try {
    const { stdout } = await execa`yarn lerna changed`;
    const result = JSON.parse(stdout);
    if (Array.isArray(result)) {
      return result as { name: string }[];
    }
    return undefined;
  } catch {
    return undefined;
  }
};
