const translate = (str, lang = "en") => {
  if (lang?.toLowerCase() === "ar") return ar[str] || str;
  return str;
};

const ar = {
  // admin
  "Admin not found" : "المسؤول غير موجود",
  //admin auth
  "Password field is required" : "كلمة المرور مطلوبه",
  "Email address is required" : "الايميل مطلوب",
  "Invalid email address" : "الايميل غير صحيح",
  "Incorrect email or password" : "الايميل أو كلمة المرور غير صحيحة",
  "Your account has been blocked. Please contact the super admin" : "تم حظر حسابك. يرجى الاتصال بالمسؤول الأعلى",
  "Incorrect current password" : "كلمة المرور الحالية غير صحيحة",
  "New password must be different from the current password" : "يجب أن تكون كلمة المرور الجديدة مختلفة عن كلمة المرور الحالية",
  "This account is already verified" : "تم التحقق من هذا الحساب بالفعل",
  //block
  "User Has been Blocked Successfully": "تم حظر المستخدم بنجاح",
  "User Has been Unblocked Successfully": "تم إلغاء حظر المستخدم بنجاح",

  //firebase
  "Media file is required": "ملف الوسائط مطلوب",
  "Invalid File Format or Not a Valid PDF": "تنسيق ملف غير صالح أو ليس ملف PDF صالح",
  //handlers
  "not found": "غير موجود",
  "deleted successfully": "تم حذفها بنجاح",
  "updated successfully": "تم التحديث بنجاح",
  "created successfully": "تم إنشاؤه بنجاح",

  //user
  "Verification (Update)" : "مستجدات التوثيق",
  "Your National Id has been verified"  : "طلب توثيق الحساب ببطاقة رقمك القومي تم قبوله",
  "Your National Id has been rejected" : "طلب توثيق الحساب ببطاقة رقمك القومي غير مقبول",
  "User Not Found!": "لم يتم العثور على المستخدم!",
  "Account is Updated Successfully and Verification OTP is sent to your Phone Number":
    "تم تحديث الحساب بنجاح وإرسال كلمة المرور لمرة واحدة للتحقق إلى رقم هاتفك",
  "Account is updated successfully": "تم تحديث الحساب بنجاح",
  "this user has been verified with National Id":
    "تم إثبات ملكية هذا المستخدم باستخدام بطاقة الهوية الوطنية",
  "this user has been unverified with National Id":
    "لم يتم التحقق من هذا المستخدم باستخدام بطاقة الهوية الوطنية",
  //userAuth
  "Verification OTP is sent to your Phone Number":
    "يتم إرسال كلمة المرور لمرة واحدة للتحقق إلى رقم هاتفك",
  "Please wait, One of our call center representatives/Call Centers will verrify you soon!":
    "يرجى الانتظار، سيقوم أحد ممثلي مركز الاتصال / مراكز الاتصال بالتحقق منك قريبا!",
  "User logged out successfully!": "قام المستخدم بتسجيل الخروج بنجاح!",
  //userResetPassword
  "Reset OTP is sent to your phone": "يتم إرسال إعادة تعيين OTP إلى هاتفك",
  "Reset OTP is expired": "Reset OTP is expired",
  "Invalid reset code": "رمز إعادة التعيين غير صالح",
  "Reset OTP is verified successfully": "تم التحقق من إعادة تعيين كلمة المرور لمرة واحدة بنجاح",
  "Password is reset successfully": "تمت إعادة تعيين كلمة المرور بنجاح",
  Years: "سنوات",
  Months: "شهور",
  // check user
  "Session expired, please login again..." : "انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى...",
  "account is deactivated" : "تم إلغاء تنشيط هذا الحساب",
  "Password recently changed, please login again..." : "تم تغيير كلمة المرور مؤخرا، يرجى تسجيل الدخول مرة أخرى...",
  "Admins Haven't Verified Your Account Yet, Please Wait..." : "لم يقم المسؤولون بالتحقق من حسابك بعد، يرجى الانتظار...",
  // protect
  "Invalid token, please login again..." : "رمز غير صالح، يرجى تسجيل الدخول مرة أخرى...",
  "Token has expired, please login again..." : "انتهت صلاحية الرمز، يرجى تسجيل الدخول مرة أخرى...",
  "Not allowed to access this route" : "غير مسموح بالوصول إلى هذا المسار",
  "Permission not granted": "الإذن غير ممنوح",
  // error middleware
  "Something went wrong": "حدث خطأ ما",
  // multer
  "Not an image, please upload only Image" : "ليس صورة، يرجى تحميل صورة فقط",
  "Not a PDF, please upload only PDFs" : "ليس PDF، يرجى تحميل PDFات فقط",
  // send email
  "Unable to send an email, please try again later." : "لا يمكن ارسال بريد، يرجى المحاولة مرة أخرى لاحقا.", 
  "Phone number must start with '0' and contain exactly 11 digits" : "رقم الجوال يجب ان يبدا ب '0' ويحتوي على 11 رقم",
  "Phone number is required" : "رقم الجوال مطلوب",
  
  // city validation
  "city is required when Country is provided" : "المدينة مطلوبة عندما يتم تقديم البلد",
  "Invalid country" : "بلد غير صحيح",
  "City is in use" : "المدينة مستخدمة",
  "City Not Found!" : "المدينة غير موجودة!",
  "Region Not Found!" : "المنطقة غير موجودة!",
  "English name is required" : "الاسم الانجليزي مطلوب",
  "Arabic name is required" : "الاسم العربي مطلوب",
  // country validation
  "Country not found" : "البلد غير موجود",
  "Country is in use" : "البلد مستخدم",
  // global validation
  "Invalid phone Number" : "رقم الهاتف غير صالح",
  "Invalid Email Address" : "عنوان البريد الالكتروني غير صالح",
  "Reset code is not verified" : "لم يتم التحقق من رمز التعيين",
  "Invalid phone number format" : "تنسيق رقم الهاتف غير صالح",
  "You must provide either email or phone, but not both" : "يجب تقديم واحد من الحقول (البريد الالكتروني او رقم الجوال)",
  "Current password is required" : "كلمة المرور الحالية مطلوبة",
  "Invalid language" : "لغة غير صالحة",
  "Language is required" : "اللغة مطلوبة",
  // notification validation
  "Notification not found" : "الاشعار غير موجود",
  "Title is required" : "العنوان مطلوب",
  "Title must be at least 2 characters long" : "العنوان يجب ان يكون على الاقل 2 حروف",
  "Body must be at least 10 characters long" : "المحتوى يجب ان يكون على الاقل 10 حروف",
  "Case must be at least 2 characters long" : "الحالة يجب ان يكون على الاقل 2 حروف",
  "Case must be at least 1 characters long" : "الحالة يجب ان يكون على الاقل 1 حرف",
  "Users are required" : "المستخدمين مطلوبين",
  "At least one user is required" : "يجب ان يكون على الاقل مستخدم واحد",
  // user validation
  "Duplicated Phone Number" : "رقم الهاتف مكرر",
  "This Phone Number Has Been Verified Before" : "تم التحقق من هذا الرقم من قبل",
  "Duplicated Email" : "البريد الالكتروني مكرر",
  "This Email Has Been Verified Before" : "تم التحقق من هذا البريد من قبل",
  "You Can't Block Yourself" : "لا يمكنك حظر نفسك",
  // errors
  "Something went wrong" : "حدث خطأ ما",
  "is already used" : "مستخدم بالفعل",
  "Invalid Input Data" : "بيانات غير صحيحة",
  "Invalid token, Please login again ..." : "الرمز غير صحيح، يرجى تسجيل الدخول مرة أخرى ...",
  "Expired token, Please login again ..." : "الرمز منتهي الصلاحية، يرجى تسجيل الدخول مرة أخرى ...",
  "Please wait, One of our call center representatives/Call Centers will verify you soon!" : "من فضلك انتظر، سيتواصل معك أحد ممثلي خدمة العملاء قريبًا للتحقق.",
};

function translateNumbers(input, lang = "en") {
  console.log("🚀 ~ translateNumbers ~ lang:", lang);
  lang = lang.toLowerCase();
  let localizedNumber;
  if (lang === "ar") localizedNumber = latinToArabicNumbers(input, lang);
  else localizedNumber = arabicToLatinNumbers(input, lang);
  console.log("🚀 ~ translateNumbers ~ localizedNumber:", localizedNumber);
  return localizedNumber;
}

function latinToArabicNumbers(input) {
  const latinNumbers = "0123456789"; // Latin digits (0-9)
  const arabicNumbers = "٠١٢٣٤٥٦٧٨٩"; // Corresponding Arabic digits
  return input.replace(/[0-9]/g, (digit) => arabicNumbers[latinNumbers.indexOf(digit)]);
}

function arabicToLatinNumbers(input) {
  const arabicNumbers = "٠١٢٣٤٥٦٧٨٩"; // Arabic digits (0-9)
  const latinNumbers = "0123456789"; // Corresponding Latin digits
  return input.replace(/[٠-٩]/g, (digit) => latinNumbers[arabicNumbers.indexOf(digit)]);
}

module.exports = { translate, translateNumbers };