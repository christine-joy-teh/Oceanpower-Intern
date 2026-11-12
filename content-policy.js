// Retired reinforcement content must not be republished by old CMS records or AI history.
const retiredContent = new RegExp(require('./content-policy-pattern.json'), 'i');
function isRetiredContent(value) {
  return retiredContent.test(typeof value === 'string' ? value : JSON.stringify(value));
}
module.exports = { isRetiredContent };
