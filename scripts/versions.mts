// https://blog.logrocket.com/running-commands-with-execa-in-node-js/
// https://git-scm.com/book/en/v2/Git-Basics-Tagging

// TODO
// - проверка - если не на main ветке - выйти
// - проверка - если есть какие-либо активные git изменения - выходим
// - обработка возможных ошибок
// - добавить description к коммиту с версиями пакетов - с новой строки каждый
// - понятный вывод в консоль для оператора - TODO: отображать вывод лерны в консоль
// - changelog сообщения - правка тегов в ссылке на репозиторий

import { execa } from 'execa';
import { extractChanges, createTagName, getJiraIssueId } from './versions.utils.mts';

const main = async () => {
  // Получаем jiraIssueId
  const jiraIssueId = await getJiraIssueId();
  if (!jiraIssueId) {
    console.error('Не найден jiraIssueId в пространстве RLS');
    return;
  }

  // Запускаем lerna version
  const { stdout } = await execa({ lines: true })`yarn lerna version`;
  const changes = extractChanges(stdout);

  // Нет изменений
  if (!changes) {
    console.log('no changes');
    return;
  }

  // Есть изменения
  const tagName = createTagName(changes);
  console.log('has changes', changes);
  console.log('tagName', tagName);

  // Делаем коммит
  const commitMessage = `chore: publish versions ${jiraIssueId}`;
  await execa`git add .`;
  await execa`git commit -m ${commitMessage}`;

  // Создаем один тег с именами всех пакетов и их новых версий
  await execa`git tag -a ${tagName} -m ${tagName}`;

  // Публикуем коммит и тег вместе за одну транзакцию - всё или ничего
  await execa`git push --atomic origin main ${tagName}`;
};

main();
// test();
