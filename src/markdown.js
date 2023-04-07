import fs from 'fs';
import jetpack from 'fs-jetpack';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkParseFrontmatter from 'remark-parse-frontmatter';
import remarkRetext from 'remark-retext';
import remarkStringify from 'remark-stringify';
import { Parser } from 'retext-english';
import { unified } from 'unified';

import { topKeywords } from './keywords.js';
import { MARKDOWN_TYPE, scanDirectory } from './scan.js';
import { dedupe, toFolders, toSlug, toTitle } from './utils.js';

export const markdownToText = async (doc) => {
  let text;
  try {
    text = unified().use(remarkParse).use(remarkRetext, Parser).use(retextStringify).process(doc);
  } catch (error) {
    console.error(error);
  }
  return text;
};

export const parseMarkdown = async (str) => {
  let text = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkParseFrontmatter)
    .use(remarkGfm)
    .use(remarkStringify, {
      bullet: '-',
      bulletOther: '*',
      fence: '`'
    })
    .process(str);
  return text;
};

export const htmlToMarkdown = async (htmlStr) => {
  return await unified()
    .use(rehypeParse)
    .use(rehypeRemark)
    .use(remarkStringify, {
      bullet: '-',
      bulletOther: '*',
      fence: '`'
    })
    .process(htmlStr);
};

/**
 * Read markdown files in a directory.
 *
 * @param {*} sourceDir -- directory to scan
 */
export const processMarkdown = async (sourceDir) => {
  const sourceFiles = scanDirectory(sourceDir, MARKDOWN_TYPE);
  // aggregate asynchronous calls, return an array of metadata
  return await Promise.all(
    sourceFiles.map(async (sourceFile) => {
      let fileContent = await jetpack.readAsync(sourceFile, 'utf8');
      let content = await parseMarkdown(fileContent);

      // remove the escape character for \[
      let text = content.value.replaceAll(/\\\[/gi, '[');
      // we're drilling down this hierarchy for just the data we need.
      let data = content.data?.frontmatter;
      let bytes, dtCreated, dtUpdated;
      let subpath = sourceFile.replace(sourceDir + '/', '');

      const plainText = await markdownToText(text);
      const topKeywords = topKeywords({ text: plainText.toString() });
      // flatten the array of objects to an array of strings
      const tkList = topKeywords.map((tk) => tk.word);
      const title = toTitle(subpath, /\.md$/);
      const slug = toSlug(title);
      const folders = toFolders(subpath);

      // merge if there are tags
      if (data && data.tags) {
        data.tags = Array.from(new Set([...folders, ...tkList, ...data.tags]));
      } else if (data && !data.tags) {
        data.tags = [...folders, ...tkList];
      } else if (!data) {
        data = { tags: [...folders, ...tkList] };
      }

      data.tags = dedupe(data.tags.map((tag) => toSlug(tag)));

      // get filesystem info
      const stats = fs.statSync(sourceFile);
      if (stats.isFile()) {
        bytes = stats.size;
        dtCreated = stats.birthtime;
        dtUpdated = stats.mtime;
      }
      let markdownDoc = {
        title,
        slug,
        folders,
        subpath,
        bytes,
        dtCreated,
        dtUpdated,
        ...data,
        content: text
      };
      return markdownDoc;
    })
  );
};

const markdown = {
  markdownToText,
  parseMarkdown,
  htmlToMarkdown,
  processMarkdown,
};

export default markdown;
