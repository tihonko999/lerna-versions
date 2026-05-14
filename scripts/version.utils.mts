// import { execSync } from 'child_process';
import type { PackageChangeItem } from './vertion.types.mts';

export const extractChanges = (stdout: string[]) => {
  try {
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
