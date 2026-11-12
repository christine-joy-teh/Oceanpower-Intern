import source from './official-products.json';
import pattern from '../../content-policy-pattern.json';
const retiredContent = new RegExp(pattern, 'i');
const isRetiredContent = (value: unknown) => retiredContent.test(typeof value === 'string' ? value : JSON.stringify(value) ?? '');
export default {...source, categories: source.categories.filter(category => !isRetiredContent(category.route)).map(category => ({...category, entries: category.entries.filter(entry => !isRetiredContent(entry))}))};
