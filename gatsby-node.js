const crypto = require('crypto');
const productQuery = require('./product-query');

exports.sourceNodes = (
  { boundActionCreators, getNode, hasNodeChanged },
  { siteName, accessToken }
) => {
  const { createNode } = boundActionCreators;
  const client = require('graphql-client')({
    url: `https://${siteName}.myshopify.com/api/graphql`,
    headers: {
      'X-Shopify-Storefront-Access-Token': accessToken
    }
  });

  console.time(`\nfetch Shopify product data`);

  return client
    .query(productQuery, {}, (req, res) => {})
    .then(response => {
      if (
        response &&
        response.data &&
        response.data.shop &&
        response.data.shop.products &&
        response.data.shop.products.edges
      ) {
        response.data.shop.products.edges.forEach(({ node }) => {
          node.parent = null;
          node.children = [];
          node.internal = {
            mediaType: 'mime-db',
            type: 'ShopifyProducts',
            contentDigest: crypto
              .createHash('md5')
              .update(JSON.stringify(node))
              .digest('hex'),
            content: JSON.stringify(node)
          };

          createNode(node);
        });
      }
      console.timeEnd(`\nfetch Shopify product data`);
      return;
    })
    .catch(err => {
      console.error(err.message);
      console.timeEnd(`\nfetch Shopify product data`);
      return;
    });
};
