const localizationSetUp = (localizationFields) =>
  function (_, ret) {
    localizationFields.forEach((field) => {
      const enField = field + "En";
      const arField = field + "Ar";
      if (ret[enField] && !ret[arField]) {
        ret[field] = ret[enField];
        delete ret[enField];
      } else if (ret[arField] && !ret[enField]) {
        ret[field] = ret[arField];
        delete ret[arField];
      }
    });
    delete ret.id;
    delete ret.__v;
    return ret;
  };

module.exports = localizationSetUp;
