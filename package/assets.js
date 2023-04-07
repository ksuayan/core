import { connectToDatabase, oid, isValidObecjtId } from './db.js';
import Config from './config.js';
import { DB_NAME, DB_COLLECTION, SORT } from './constants.js';

const ALBUM_SUBDIR = 'subDir';

export const PUBLIC_NOTECARDS = { tags: { $ne: 'dev' } };

// Facet Aggregations
// ==================
export const IMAGE_FACETS_AGGREGATION = [
  {
    $facet: {
      tags: [{ $unwind: '$tags' }, { $sortByCount: '$tags' }],
      orientation: [{ $unwind: '$orientation' }, { $sortByCount: '$orientation' }],
      cameraModel: [{ $unwind: '$iptc.cameraModel' }, { $sortByCount: '$iptc.cameraModel' }],
      lensModel: [{ $unwind: '$iptc.lensModel' }, { $sortByCount: '$iptc.lensModel' }]
    }
  }
];

export const TAGS_FACET_AGGREGATION = [
  {
    $facet: {
      tags: [{ $unwind: '$tags' }, { $sortByCount: '$tags' }]
    }
  }
];

/**
 *
 * Projection could be the security mechanism
 * where we define what is exported at the API layer.
 * This is also where we define the minimum set of
 * fields to send for performance reasons.
 *
 */
export const IMAGE_PROJECTION = {
  _id: 1,
  origFile: 1,
  orientation: 1,
  renditions: 1,
  iptc: 1,
  tags: 1,
  size: 1,
  dtCreated: 1,
  ts: 1
};

export const ARTICLE_INDEX_PROJECTION = {
  _id: 1,
  title: 1,
  dtCreated: 1,
  tags: 1,
  slug: 1
};

export const ARTICLE_SCORED_PROJECTION = {
  _id: 0,
  title: 1,
  description: 1,
  slug: 1,
  tags: 1,
  score: { $meta: 'textScore' }
};

/**
 * Aggregation pipeline for getting the first image for each album.
 */
const ALBUM_DIRECTORY_PIPELINE = [
  { $match: {} },
  { $sort: SORT.DATE_UPDATED_DESCENDING },
  {
    $lookup: {
      from: DB_COLLECTION.IMAGES,
      localField: ALBUM_SUBDIR,
      foreignField: ALBUM_SUBDIR,
      as: 'image',
      pipeline: [{ $sort: SORT.IMAGE_DATE_ASCENDING }, { $limit: 1 }, { $project: IMAGE_PROJECTION }]
    }
  }
];

export const createPaginatedAggregation = ({ matchStage, page, pageSize, projection }) => {
  return [
    {
      $match: matchStage
    },
    {
      $project: projection
    },
    {
      $facet: {
        metadata: [
          {
            $group: {
              _id: null,
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              _id: 0,
              count: 1
            }
          }
        ],
        tags: [{ $unwind: '$tags' }, { $sortByCount: '$tags' }],
        results: [
          {
            $sort: {
              score: { $meta: 'textScore' }
            }
          },
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize }
        ]
      }
    }
  ];
};

export const createAggregation = ({ matchStage, projection }) => {
  return [
    {
      $match: matchStage
    },
    {
      $project: projection
    },
    {
      $facet: {
        metadata: [
          {
            $group: {
              _id: null,
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              _id: 0,
              count: 1
            }
          }
        ],
        tags: [{ $unwind: '$tags' }, { $sortByCount: '$tags' }],
        results: [
          { $project: { _id: 0 } },
          {
            $sort: { title: 1 }
          }
        ]
      }
    }
  ];
};

/**
 * A query wrapper that expects:
 * - collection
 * - query
 * - sort
 * @param {*} param0
 * @returns
 */
export const queryDB = async ({ collection, query = {}, sort = {}, projection }) => {
  const { db, client } = await connectToDatabase(DB_NAME);
  let result;
  try {
    result = await db.collection(collection).find(query).sort(sort).project(projection).toArray();
  } catch (err) {
    console.log(err);
  }
  client.customShutdown();
  const docs = JSON.parse(JSON.stringify(result));
  return docs;
};

export const aggregateDB = async ({ collection, aggregate }) => {
  const { db, client } = await connectToDatabase(DB_NAME);
  let result;
  try {
    result = await db.collection(collection).aggregate(aggregate).toArray();
  } catch (err) {
    console.log(err);
  }
  client.customShutdown();
  const docs = JSON.parse(JSON.stringify(result));
  return docs;
};

// Article Functions
// =================
export const getArticles = async ({ query, projection }) => {
  return await queryDB({
    collection: DB_COLLECTION.ARTICLES,
    query,
    sort: SORT.DATE_CREATED_DESCENDING,
    projection
  });
};

export const getArticlesStaticProps = async ({ query = {}, projection, params }) => {
  return {
    props: { articles: await getArticles({ query, projection }), params },
    revalidate: Config.REVALIDATE
  };
};

export const getArticlesStaticPaths = async () => {
  const articles = await getArticles({});
  const paths = articles.map((article) => ({
    params: { slug: article.slug.toString() }
  }));
  return { paths, fallback: 'blocking' };
};

// Notecard Functions
// ==================

export const queryNotecards = async (query = {}, sort = { dateCreated: -1 }) => {
  return await queryDB({ collection: DB_COLLECTION.NOTECARDS, query, sort });
};

export async function getNotecardsStaticProps(query) {
  const notecards = await queryNotecards(query);
  if (notecards && notecards.length) {
    return { props: { notecards } };
  } else {
    const notFound = `No Notecards found for query='${query}'.`;
    if (Config.LOCAL_DEBUG) {
      console.log(notFound);
    }
    return {
      props: {
        notecard: {
          title: notFound
        }
      },
      revalidate: Config.REVALIDATE
    };
  }
}

export async function getNotecardsStaticPaths(query = {}) {
  const notecards = await queryNotecards(query);
  const paths = notecards.map((nc) => ({
    params: { name: nc.name.toString() }
  }));
  return { paths, fallback: 'blocking' };
}

// Archive Functions
// =================
export const getArchive = async ({ query = {}, projection, sort = SORT.DATE_CREATED_DESCENDING }) => {
  return await queryDB({
    collection: DB_COLLECTION.ARCHIVE,
    query,
    projection,
    sort
  });
};

export async function getArchiveStaticProps({ query = {}, projection, params = {} }) {
  const pages = await getArchive({ query, projection });
  return { props: { pages, params }, revalidate: Config.REVALIDATE };
}

export async function getArchiveStaticPaths() {
  const pages = await getArchive({});
  const paths = pages.map((page) => ({
    params: { slug: page.slug }
  }));
  return { paths, fallback: 'blocking' };
}

/**
 * Markdown Collections
 * ====================
 *
 * @param {*} db
 * @param {*} query
 * @param {*} sort
 * @returns
 */
export const getMarkdownDocs = async (query = {}, sort = SORT.DATE_CREATED_ASCENDING) => {
  return await queryDB({ collection: DB_COLLECTION.MARKDOWN, query, sort });
};

// Used by static page generation
export async function getMarkdownDocsByQuery(query, params = {}) {
  const markdownDocs = await getMarkdownDocs(query, SORT.DATE_UPDATED_DESCENDING);
  return { props: { markdownDocs, params } };
}

// Used by static page generation
export async function getMarkdownDocsStaticPaths(query = {}) {
  const markdownDocs = await getMarkdownDocs(query);
  const paths = markdownDocs.map((doc) => ({
    params: { _id: doc._id.toString() }
  }));
  return { paths, fallback: 'blocking' };
}

// Image Functions
// ===============

export const getImages = async (query = {}, sort = SORT.IMAGE_DATE_ASCENDING) => {
  return await queryDB({
    collection: DB_IMAGES_COLLECTION,
    query,
    sort,
    projection: IMAGE_PROJECTION
  });
};

// Used by static page generation
export async function getImageStaticProps(context) {
  const { _id } = context.params;
  let query = isValidObecjtId(_id) ? { _id: oid(_id) } : {};
  const images = await getImages(query);
  return { props: { images }, revalidate: Config.REVALIDATE };
}

// Used by static page generation
export async function getImageStaticPaths(query = {}) {
  const images = await getImages(query);
  const paths = images.map((image) => ({
    params: { _id: image._id.toString() }
  }));
  return { paths, fallback: 'blocking' };
}

// Used by static page generation
export async function getImagesByQuery(query, params) {
  const images = await getImages(query);
  return { props: { images, params } };
}

// Album Queries and Aggregation
// ===============

/**
 * Construct an album by matching subDir attributes
 * between the albums and images collection.
 * @param {*} albumName
 * @param {*} params
 * @returns
 */
export async function getAlbumStaticProps(albumName, params = {}) {
  const ALBUM_BY_NAME = [
    {
      $match: {
        name: albumName
      }
    },
    {
      $lookup: {
        from: DB_COLLECTION.IMAGES,
        localField: ALBUM_SUBDIR,
        foreignField: ALBUM_SUBDIR,
        as: 'images',
        pipeline: [
          { $sort: SORT.IMAGE_DATE_ASCENDING },
          {
            $project: IMAGE_PROJECTION
          }
        ]
      }
    }
  ];
  const albums = await aggregateDB({
    collection: DB_COLLECTION.ALBUMS,
    aggregate: ALBUM_BY_NAME
  });
  return { props: { albums, params }, revalidate: Config.REVALIDATE };
}

export async function getAlbumIndex() {
  const albums = await aggregateDB({
    collection: DB_COLLECTION.ALBUMS,
    aggregate: ALBUM_DIRECTORY_PIPELINE
  });
  return albums;
}

// Used by static page generation
export async function getAlbumStaticPaths() {
  const albums = await queryDB({
    collection: DB_COLLECTION.ALBUMS,
    query: {}
  });
  let paths = [];
  albums.map((entry) => {
    const name = entry && entry.name ? entry.name.toString() : '';
    if (name) {
      paths.push({
        params: { name: name }
      });
    }
  });
  return { paths, fallback: 'blocking' };
}

// Used by static page generation
export async function getImageTagStaticPaths() {
  const results = await aggregateDB({
    collection: DB_COLLECTION.IMAGES,
    aggregate: TAGS_FACET_AGGREGATION
  });
  let paths = [];
  results[0].tags.map((entry) => {
    paths.push({
      params: { name: entry._id.toString() }
    });
  });
  return { paths, fallback: 'blocking' };
}

// Static Page Generation for Tag dirctories
export async function getTagsStaticProps(tags, params = {}) {
  const results = await searchByTags(tags);
  return { props: { results, params }, revalidate: Config.REVALIDATE };
}

export async function getTagsStaticPaths() {
  const results = await aggregateDB({
    collection: DB_COLLECTION.ARTICLES,
    aggregate: TAGS_FACET_AGGREGATION
  });
  let paths = [];
  results[0].tags.map((entry) => {
    paths.push({
      params: { name: entry._id.toString() }
    });
  });
  return { paths, fallback: 'blocking' };
}
// Used by static page generation
export async function getImageFacets() {
  return await aggregateDB({
    collection: DB_COLLECTION.IMAGES,
    aggregate: IMAGE_FACETS_AGGREGATION
  });
}

export const searchText = async ({ collection, searchTerm, page, pageSize }) => {
  const scoredArticlesPipeline = createPaginatedAggregation({
    matchStage: {
      $text: {
        $search: searchTerm
      }
    },
    page,
    pageSize,
    projection: ARTICLE_SCORED_PROJECTION
  });
  let result = await aggregateDB({
    collection,
    aggregate: scoredArticlesPipeline
  });

  return result;
};

export const searchByTags = async (tags) => {
  const articlesPipeline = createAggregation({
    matchStage: { tags },
    projection: ARTICLE_INDEX_PROJECTION
  });
  const archivePipeline = createAggregation({
    matchStage: { tags },
    projection: ARTICLE_INDEX_PROJECTION
  });

  let articles = await aggregateDB({
    collection: DB_COLLECTION.ARTICLES,
    aggregate: articlesPipeline
  });

  let archive = await aggregateDB({
    collection: DB_COLLECTION.ARCHIVE,
    aggregate: archivePipeline
  });

  return { articles, archive };
};

const assets = {
  PUBLIC_NOTECARDS,
  IMAGE_FACETS_AGGREGATION,
  TAGS_FACET_AGGREGATION,
  createPaginatedAggregation,
  createAggregation,
  queryDB,
  aggregateDB,
  getMarkdownDocs,
  getMarkdownDocsByQuery,
  getMarkdownDocsStaticPaths,
  getImages,
  getImageStaticProps,
  getImageStaticPaths,
  getImagesByQuery,
  getAlbumStaticProps,
  getAlbumIndex,
  getAlbumStaticPaths,
  getImageTagStaticPaths,
  getTagsStaticProps,
  getTagsStaticPaths,
  getImageFacets,
  searchText,
  searchByTags
};

export default assets;
