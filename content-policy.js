// Retired reinforcement content must not be republished by old CMS records or AI history.
const retiredContent = /\b(?:[gbca]?frp|grfp|rebar|rockbolts?)\b|fibre-reinforced-composites|fib(?:er|re)[ -]reinforced polymer|glass[ -]fib(?:er|re).*reinforc|catalogue\.pdf|筋材|锚杆|玻璃纤维增强筋/i;
function isRetiredContent(value) {
  return retiredContent.test(typeof value === 'string' ? value : JSON.stringify(value));
}
module.exports = { isRetiredContent };
