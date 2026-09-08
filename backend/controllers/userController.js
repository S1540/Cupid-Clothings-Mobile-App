const { deleteUserAccount } = require("../services/userService");

const deleteAccount = async (req, res) => {
  try {
    await deleteUserAccount(req.user.uid);

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (err) {

    res.status(500).json({
      success: false,
      code: "DELETE_INCOMPLETE",
      message: "Account deletion could not finish. Please retry to complete it.",
    });
  }
};

module.exports = {
  deleteAccount,
};
