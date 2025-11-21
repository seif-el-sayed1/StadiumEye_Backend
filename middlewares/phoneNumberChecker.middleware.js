/**
 * Adds +2 to the start of the phone number if it does not exist
 * @param {Object} req - Express request object to extract the phone from the body then attach it again to the body
 */
exports.checkIfPhoneStartsWithPlus2 = (req) => {
  const { phone } = req.body;
  if (!phone) return;
  if (!phone.startsWith("+2")) req.body.phone = `+2${phone}`;
};
