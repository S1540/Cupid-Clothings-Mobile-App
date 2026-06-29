const {
  fetchProducts,
  fetchMenu,
  searchProducts,
  fetchSingleProduct,
} = require("../services/shopifyService");

// For Fetch product by home tab(Men, women, Plus-Size......)
const getProductByCollection = async (req, res) => {
  try {
    const { handle } = req.params;
    const products = await fetchProducts(handle);

    res.json(products);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Failed to fetch products",
    });
  }
};

const getMenu = async (req, res) => {
  try {
    const { handle } = req.params;
    const menu = await fetchMenu(handle);
    res.json(menu);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch menu" });
  }
};

const searchedProducts = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q || q.length < 2) return res.json([]);
    const results = await searchProducts(q);
    res.json(results);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
};

const getProductByHandle = async (req, res) => {
  try {
    const { handle } = req.params;
    const product = await fetchSingleProduct(handle);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

module.exports = {
  getProductByCollection,
  getMenu,
  searchedProducts,
  getProductByHandle,
};
