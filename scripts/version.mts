import { execa } from 'execa';
// import { execSync } from 'child_process';

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

interface PackageChangeItem {
  name: string;
  version: string;
  private: boolean;
  location: string;
  newVersion: string;
}

const extractChanges = (stdout: string[]) => {
  try {
    const result = JSON.parse(stdout.slice(1).join('\n'));
    if (Array.isArray(result)) {
      return result as PackageChangeItem[];
    }
  } catch {}
  return undefined;
};

const createTagName = (changes: PackageChangeItem[]) => {
  const tagName = changes.map((el) => [el.name, el.newVersion].join('@')).join('_');
  return tagName;
};

const main = async () => {
  // const { stdout } = await execa`git log -1 --oneline`;
  // TODO: отображать вывод лерны в консоль
  const { stdout } = await execa({ lines: true })`yarn lerna version`;

  const changes = extractChanges(stdout);
  if (!changes) {
    console.log('no change');
    return;
  }

  const tagName = createTagName(changes);

  console.log('has changes', changes);
  console.log('tagName', tagName);
};

main();
