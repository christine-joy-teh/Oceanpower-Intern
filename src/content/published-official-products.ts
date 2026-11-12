import source from './official-products.json';
import policy from '../../content-policy.js';
export default {...source, categories: source.categories.filter(category => !policy.isRetiredContent(category.route)).map(category => ({...category, entries: category.entries.filter(entry => !policy.isRetiredContent(entry))}))};
