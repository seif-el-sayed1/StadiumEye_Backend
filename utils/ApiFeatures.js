class ApiFeatures {
    constructor(query, queryString, modelName) {
        this.query = query;
        this.queryString = queryString;
        this.modelName = modelName; 
    }

    search() {
        const keyword = this.queryString.search;
        if (!keyword) return this;
        // search fields for each model
        const searchFields = {
            City: ["nameAr", "nameEn"],
            Country: ["nameAr", "nameEn"],
            Stadium: ["stadiumName"],
        };

        const fields = searchFields[this.modelName];
        if (!fields) return this;

        // search on any field
        const orConditions = fields.map((field) => ({
            [field]: { $regex: keyword, $options: "i" }
        }));

        this.query = this.query.find({ $or: orConditions });

        return this;
    }

    filter() {
        const queryObj = { ...this.queryString };
        // remove common fields from query
        const removeFields = ["search", "page", "limit", "sort", "select"];
        removeFields.forEach((key) => delete queryObj[key]);
        // search by any query parameter
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (m) => `$${m}`);

        this.query = this.query.find(JSON.parse(queryStr));

        return this;
    }

    paginate() {
        const page = this.queryString.page ? Number(this.queryString.page) : 1;
        const limit = this.queryString.limit ? Number(this.queryString.limit) : 20;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }

    cleanResponse() {
        const staticFields = ["updatedAt", "__v"];
        const fieldsToExclude = staticFields.map(field => `-${field}`);
        this.query = this.query.select(fieldsToExclude.join(" "));
        return this;
    }
}

module.exports = ApiFeatures;
