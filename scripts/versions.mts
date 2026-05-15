// https://blog.logrocket.com/running-commands-with-execa-in-node-js/
// https://git-scm.com/book/en/v2/Git-Basics-Tagging

// TODO
// - понятный вывод в консоль для оператора - TODO: отображать вывод лерны в консоль
// - обработка возможных ошибок
// - рефакторинг всего решения
// - changelog сообщения - правка тегов в ссылке на репозиторий

import { execa } from 'execa';
import {
  extractChanges,
  createTagName,
  getJiraIssueId,
  logError,
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

  // Проверка отсутствия git изменений
  if (await hasUncommitedChanges()) {
    logError('Присутствуют активные git-изменения. Необходимо сделать коммит');
    return;
  }

  // Получаем jiraIssueId
  const jiraIssueId = await getJiraIssueId();
  if (!jiraIssueId) {
    logError('Не найден jiraIssueId в пространстве RLS');
    return;
  }

  // Запускаем lerna version
  const lernaVersionPromise = execa({ lines: true })`yarn lerna version`;
  lernaVersionPromise.stdout.pipe(process.stdout);
  lernaVersionPromise.stderr.pipe(process.stderr);
  const { stdout } = await lernaVersionPromise;
  const changes = extractChanges(stdout);

  // Нет изменений пакетов
  if (!changes) {
    logError('Нет изменений в пакетах с момента создания последнего git-тега');
    return;
  }

  // Есть изменения
  const tagName = createTagName(changes);
  console.log('has changes', changes);
  console.log('tagName', tagName);

  // Делаем коммит
  const commitTitle = `chore: publish versions ${jiraIssueId}`;
  const commitDescription = createCommitDescription(changes);
  await execa`git add .`;
  await execa`git commit -m ${commitTitle} -m ${commitDescription}`;

  // Создаем один тег с именами всех пакетов и их новых версий
  await execa`git tag -a ${tagName} -m ${tagName}`;

  // Публикуем коммит и тег вместе за одну транзакцию - всё или ничего
  await execa`git push --atomic origin main ${tagName}`;
};

const test = async () => {};

main();
// test();
