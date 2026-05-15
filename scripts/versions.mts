// TODO
// - changelog сообщения lerna version - правка тегов в ссылке на репозиторий

import { execa } from 'execa';
import {
  extractChanges,
  createTagName,
  getJiraIssueId,
  logError,
  logSuccess,
  isOnMainBranch,
  hasUncommitedChanges,
  createCommitDescription,
} from './versions.utils.mts';
import { MAIN_BRANCH_NAME } from './versions.constants.mts';

const main = async () => {
  // Проверка текущей ветки
  if (!(await isOnMainBranch())) {
    logError(`Необходимо находиться на ветке: ${MAIN_BRANCH_NAME}`);
    return;
  }

  // Проверка, что нет изменений не оформленных в коммит
  if (await hasUncommitedChanges()) {
    logError('Присутствуют активные git-изменения. Необходимо сделать коммит');
    return;
  }

  // jiraIssueId для последнего коммита
  const jiraIssueId = await getJiraIssueId();
  if (!jiraIssueId) {
    logError('Не найден jiraIssueId в пространстве RLS');
    return;
  }

  // Запускаем lerna version
  const lernaVersionPromise = execa({ lines: true })`yarn lerna version`;
  // Направляем вывод lerna в консоль
  lernaVersionPromise.stdout.pipe(process.stdout);
  lernaVersionPromise.stderr.pipe(process.stderr);
  const { stdout } = await lernaVersionPromise;
  const changes = extractChanges(stdout);

  // Нет изменений пакетов
  if (!changes || changes.length === 0) {
    logError('Нет изменений в пакетах для версионирования');
    return;
  }

  // Есть изменения
  const tagName = createTagName(changes);
  const commitTitle = `chore: publish versions ${jiraIssueId}`;
  const commitDescription = createCommitDescription(changes);

  // Делаем коммит
  await execa`git add .`;
  await execa`git commit -m ${commitTitle} -m ${commitDescription}`;
  logSuccess(`Создан коммит: ${commitTitle}`);

  // Создаем один тег с именами всех пакетов и их новых версий
  await execa`git tag -a ${tagName} -m ${tagName}`;
  logSuccess(`Создан тег: ${tagName}`);

  // Публикуем коммит и тег вместе за одну транзакцию - всё или ничего
  await execa`git push --atomic origin main ${tagName}`;
  logSuccess(`Изменения отправлены в удаленный репозиторий, ветка: ${MAIN_BRANCH_NAME}`);
};

main();
