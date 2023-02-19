const bcrypt = require("bcrypt");
const Joi = require("joi");
const ddbClient = require("../aws/dynamo");
require("dotenv").config();

const auth = async (req, res, next) => {
    // Validate email and password have been sent in request
    const schema = Joi.object({
        email: Joi.string()
            .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "org", "edu"] } })
            .required()
            .trim(),
        password: Joi.string().min(8).trim(),
    });
    const { error } = schema.validate({ email: req.body.email, password: req.body.password });
    if (error) return res.status(400).json(error.details);

    // Check if email exists in database and get user information
    const user = (await ddbClient.get({TableName: process.env.AWS_DyanmoDB_Table, Key: { email: req.body.email, receiptDate: "profile" }}).promise())
    if (Object.keys(user).length == 0) return res.status(400).json("Wrong email or password")

    // Check if password is correct
    const validPassword = await bcrypt.compare(req.body.password, user.Item.password);  //decrypt
    if (!validPassword) return res.status(400).json("Wrong email or password");

    next();
}

module.exports = auth;
