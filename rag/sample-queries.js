const { retrieve } = require('./retrieve');

const QUESTIONS = [
  '沥青再生剂的主要作用是什么？',
  '抗车辙剂如何提高沥青路面的性能？',
  '阻燃剂产品适用于哪些场景？',
  '机场道面解决方案包含哪些内容？',
  'GFRP纤维增强复合材料有什么特点？',
  '彩色沥青的颜料和施工要求是什么？',
  '高粘度沥青改性剂的技术指标有哪些？',
  '温拌沥青技术的优势是什么？',
];

async function main() {
  for (const question of QUESTIONS) {
    console.log(`\n=== ${question} ===`);
    const results = await retrieve('haichuan', question, 3);
    results.forEach((result, i) => {
      console.log(`[${i + 1}] score=${result.score.toFixed(3)} source=${result.source}`);
      console.log(result.text.slice(0, 200).replace(/\n/g, ' '));
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
