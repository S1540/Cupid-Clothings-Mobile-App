const axios = require("axios");

const SHOP_DOMAIN = process.env.SHOPIFY_STORE;
const PRIVATE_TOKEN = process.env.JUDGEME_PRIVATE_TOKEN;

const api = axios.create({
  baseURL: "https://judge.me/api/v1",
  params: {
    shop_domain: SHOP_DOMAIN,
    api_token: PRIVATE_TOKEN,
  },
});

module.exports = api;
