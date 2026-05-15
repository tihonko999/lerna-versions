// https://blog.logrocket.com/running-commands-with-execa-in-node-js/
// https://git-scm.com/book/en/v2/Git-Basics-Tagging

// TODO
// - git push и git push origin tagName одной командой - тразакция
// - RLS - получение jiraIssueId для сообщения коммита
// - changelog сообщения - правка тегов в ссылке на репозиторий
// - обработка возможных ошибок
// - понятный вывод в консоль для оператора
// - добавить description к коммиту с версиями пакетов - с новой строки каждый
// - проверка - если не на main ветке - выйти

import { execa } from 'execa';
import { extractChanges, createTagName } from './versions.utils.mts';

const main = async () => {
  // TODO: отображать вывод лерны в консоль
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
  await execa`git add .`;
  const commitMessage = 'chore: publish versions';
  await execa`git commit -m ${commitMessage}`;

  // Создаем один тег с именами всех пакетов и их новых версий
  await execa`git tag -a ${tagName} -m ${tagName}`;

  // Публикуем коммит и тег вместе за одну транзакцию - всё или ничего
  await execa`git push --atomic origin main ${tagName}`;
};

main();
