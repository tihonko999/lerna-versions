// TODO
// - обновление версии в корневом package.json
// - переделать имя тега и сообщение коммита (issue, version)
// - добавить шаг удаления всех локальных тегов и подтягивания всех удаленных тегов
// - changelog сообщения lerna version - правка тегов в ссылке на  репозиторий
// - ?добавить ли явный вызов yarn install - yarn.lock и так обновится в текущей реализации

// import { execa } from 'execa';
import {
  getJiraIssueId,
  logError,
  isOnMainBranch,
  hasUncommitedChanges,
  createCommitDescription,
  gitPullOriginMain,
  gitFetchTags,
  gitCreateCommit,
  gitCreateTag,
  gitPush,
  lernaVersion,
  getHighestReleaseType,
  updateRootVersion,
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

  // Обновляем main ветку и теги
  await gitPullOriginMain();
  await gitFetchTags();

  // jiraIssueId для последнего коммита
  const jiraIssueId = await getJiraIssueId();
  if (!jiraIssueId) {
    logError('Не найден jiraIssueId в пространстве RLS');
    return;
  }

  // Запускаем lerna version
  const changes = await lernaVersion();

  // Нет изменений пакетов
  if (!changes || changes.length === 0) {
    logError('Нет изменений в пакетах для версионирования');
    return;
  }

  // Определяем тип общего релиза
  const releaseType = getHighestReleaseType(changes);
  if (!releaseType) {
    logError('Отсутствуют изменения в пакетах для версионирования');
    return;
  }

  // Обновляем версию корневого package.json
  const newVersion = updateRootVersion(releaseType);
  const newVersionName = 'v' + newVersion;
  const commitTitle = `chore: publish versions: ${newVersionName} issue: ${jiraIssueId}`;
  const commitDescription = createCommitDescription(changes);

  // yarn install чтобы обновить внутренние зависимости в yarn.lock
  // await execa`yarn install`;

  // Делаем коммит
  return;
  await gitCreateCommit({ title: commitTitle, description: commitDescription });

  // Создаем один тег с именами всех пакетов и их новых версий
  await gitCreateTag(newVersionName);

  // Публикуем коммит и тег вместе за одну транзакцию - всё или ничего
  await gitPush(newVersionName);
};

main();
