exports.SUPER_ADMIN = "superAdmin";
exports.ADMIN = "admin";
exports.USER = "user";
exports.STAFF = "staff";

exports.ROLES = [exports.SUPER_ADMIN, exports.ADMIN, exports.USER, exports.STAFF];

exports.LOGIN_TYPE_LIST = ["apple", "google", "email", "social"];
exports.LOGIN_TYPE_PLATFORM_LIST = ["apple", "google", "social"];
exports.GENDER_LIST_EN = ["male", "female"];
exports.GENDER_LIST_AR = ["ذكر", "أنثى", "أنثي", "انثي", "انثى"];
exports.SERVICES_LIST = ["parking", "seats", "entry", "security"]

exports.STADIUM_AREA = ["northStand", "southStand", "eastStand", 
                        "westStand", "vip", "emergency", "concourse",
                        "parkingArea", "mediaZone", "fieldLevel"];
exports.TICKET_STATUS = ["open","inProgress", "resolved", "closed", "rejected"];
exports.TICKET_PRIORITIES = ["low", "medium", "high", "critical"];
exports.TICKET_TYPES = ["negative", "positive", "issue", "suggestion"]