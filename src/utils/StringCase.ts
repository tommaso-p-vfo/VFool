const splitWords = (content: string, separator: string): string[] =>
    content
        .toLowerCase()
        .split(separator)
        .filter((word) => word.length > 0);

const capitalize = (word: string): string =>
    word.charAt(0).toUpperCase() + word.slice(1);

/**
 * Converte una stringa in PascalCase.
 *
 * @example
 * toPascalCase('data-table'); // 'DataTable'
 * toPascalCase('data_table', '_'); // 'DataTable'
 */
export function toPascalCase(content: string, separator = '-'): string {
    if (!content || typeof content !== 'string') return '';
    return splitWords(content, separator).map(capitalize).join('');
}

/**
 * Converte una stringa in camelCase.
 *
 * @example
 * toCamelCase('data-table'); // 'dataTable'
 */
export function toCamelCase(content: string, separator = '-'): string {
    if (!content || typeof content !== 'string') return '';
    return splitWords(content, separator)
        .map((word, index) => (index === 0 ? word : capitalize(word)))
        .join('');
}