const { saveOrderToFirebase } = require("../services/orderService");

const handleOrderCreated = async (req, res) => {
  try {
    const order = req.body;
    await saveOrderToFirebase(order);
    res.status(200).send("OK");
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = {
  handleOrderCreated,
};
