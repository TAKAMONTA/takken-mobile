import { takkengyouhouQuestions } from '../lib/data/questions/takkengyouhou/index';
import { minpouQuestions } from '../lib/data/questions/minpou/index';
import { houreiQuestions } from '../lib/data/questions/hourei/index';
import { zeihouQuestions } from '../lib/data/questions/zeihou/index';

console.log('📊 更新後の問題数:');
console.log('宅建業法:', takkengyouhouQuestions.length, '問');
console.log('民法等:', minpouQuestions.length, '問');
console.log('法令上の制限:', houreiQuestions.length, '問');
console.log('税・その他:', zeihouQuestions.length, '問');
console.log('合計:', takkengyouhouQuestions.length + minpouQuestions.length + houreiQuestions.length + zeihouQuestions.length, '問');
