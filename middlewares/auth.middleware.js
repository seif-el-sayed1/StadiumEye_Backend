const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Admin = require("../models/admin.model");
const Staff = require("../models/staff.model");
const ApiError = require("../utils/ApiError");
const { translate } = require("../utils/translation");

// Constants
const { ADMIN, STAFF, USER, MANAGER, ROLES } = require("../utils/constants");

// === Check user authentication and authorization function ===
const checkUser = async (Model, token, decoded, next) => {
  // Check user
  const mongooseQuery = Model.findById(decoded.userId, null, { userLocationPopulation: true });
  mongooseQuery.lang = decoded.lang;
  const currentUser = await mongooseQuery;
  if (!currentUser) return next(new ApiError(`${Model.modelName} ${translate("not found", decoded.lang)}`, 401));
  // Check if token is valid
  if (currentUser.token !== token)
    return next(new ApiError(translate("Session expired, please login again...", decoded.lang), 401));
  // Check if the account is deactivated
  if (currentUser.isActive === false)
    return next(new ApiError(`This ${Model.modelName} ${translate("account is deactivated", decoded.lang)}`, 401));
  // Check if the account is blocked
  if (currentUser.isBlocked)
    return next(new ApiError(translate("Your account is blocked, please contact the support team", decoded.lang), 401));
  // Check if user changed his password after token was created
  if (currentUser.passwordChangedAt) {
    const passwordChangedAtTimestamp = parseInt(currentUser.passwordChangedAt.getTime() / 1000, 10);
    if (passwordChangedAtTimestamp > decoded.iat) {
      return next(new ApiError(translate("Password recently changed, please login again...", decoded.lang), 401));
    }
  }
  return currentUser;
};

// === Check token => verify => Check role is valid => check expiration => check based on role ===
exports.protect = asyncHandler(async (req, res, next) => {
  // check token
  let token;
  if (req.headers.authorization) token = req.headers.authorization;
  if (!token)
    return next(new ApiError(translate("Invalid token, please login again...", req.headers.lang), 401));

  // verify token
  const decoded = await jwt.verify(token, process.env.JWT_SECRET);

  // Check token role
  const role = decoded.role;
  if (!ROLES.includes(role))
    return next(new ApiError(translate("Invalid token role, please login again...", req.headers.lang), 401));

  // Check token expiration
  const currentTimestamp = Math.floor(Date.now() / 1000); // in seconds
  if (decoded.exp < currentTimestamp)
    return next(new ApiError(translate("Token has expired, please login again...", req.headers.lang), 401));

  // Lang is added to decoded object
  let lang = "en";
  switch (req.headers.lang?.toLowerCase()) {
    case "ar":
      lang = "ar";
      break;
    case "all":
      lang = "all";
      break;
    default:
      break;
  }
  decoded.lang = lang;

  // Check authentication and authorization
  let currentUser;
  switch (role) {
    case ADMIN:
      currentUser = await checkUser(Admin, token, decoded, next);
      req.role = ADMIN;
      req.userId = decoded.userId;
      break;
    case STAFF:
      currentUser = await checkUser(Staff, token, decoded, next);
      req.role = STAFF;
      req.userId = decoded.userId;
      break;
    case USER:
      currentUser = await checkUser(User, token, decoded, next);
      req.role = USER;
      req.userId = decoded.userId;
      break;
    case MANAGER:
      currentUser = await checkUser(User, token, decoded, next);
      req.role = MANAGER;
      req.userId = decoded.userId;
      break;
  }
  req.user = currentUser;
  next();
});


// === Check for user permission based on role ===
exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.role))
      return next(new ApiError(translate("Not allowed to access this route", req.headers.lang), 403));
    next();
  });

// // === Check for user permission based on permission group ===
// exports.authorization = (permissionName) =>
//   asyncHandler(async (req, res, next) => {
//     if (req.user.) return next();
//     const permissions = req.user.permissionGroup;
//     if (!permissions || !permissions[permissionName])
//       return next(new ApiError(translate("Permission not granted", req.headers.lang), 401));
//     next();
//   });
