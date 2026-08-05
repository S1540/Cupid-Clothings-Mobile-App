const { deleteUserAccount } = require("../services/userService");

const deleteAccount = async (req, res) => {
  try {
    await deleteUserAccount(req.user.uid);

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  deleteAccount,
};
