import { deleteUserAccount } from "../services/userService.js";

export const deleteAccount = async (req, res) => {
  try {
    await deleteUserAccount(req.user.uid);

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (e) {
    console.log(e);

    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
