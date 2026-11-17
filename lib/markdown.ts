/**
 * Drop a leading "# Title" line when it only repeats the page's own heading.
 *
 * Pages such as Projects and Achievements render their title themselves, so a
 * markdown file that also opens with that title would show it twice in a row.
 * Any other first line — a different heading, a subheading, body text — is
 * left untouched.
 */
export function stripLeadingTitle(markdown: string, title: string): string {
    const match = markdown.match(/^\s*#[ \t]+(.+?)[ \t]*#*[ \t]*(?:\r?\n|$)/);
    if (!match || match[1].trim().toLowerCase() !== title.trim().toLowerCase()) {
        return markdown;
    }
    return markdown.slice(match[0].length).replace(/^\s+/, "");
}
