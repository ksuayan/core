import { core } from '@ksuayan/core';

const { image, assets, db, utils } = core;

const list = ['a', 'aa', 'b', 'b', 'bb'];

console.log(assets.PUBLIC_NOTECARDS);
console.log(utils.dedupe(list));
console.log(db.isValidObecjtId('123123123'));

// image.showSharpInfo();
