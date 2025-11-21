const capitalizeFirstLetter = (string = "en") => {
  string = string?.toLowerCase();
  return string?.charAt(0).toUpperCase() + string?.slice(1);
};

module.exports = capitalizeFirstLetter;
