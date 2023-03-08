const express = require("express");
const bcrypt = require("bcrypt");
const ddbClient = require("../aws/dynamo");
const Joi = require("joi");
require("dotenv").config();

const router = express.Router();

// Create a new user
router.post("/signup", async (req, res) => {
    const user = {
        email: req.body.email,
        receiptDate: "profile",
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        password: req.body.password,
    }

    // Ensure all information needed to create a user has been passed in from request
    const schema = Joi.object({
        email: Joi.string()
            .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "org", "edu"] } })
            .required()
            .trim()
            .required(),
        password: Joi.string().min(8).trim().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        receiptDate: Joi.string().required(),
    });
    const { error } = schema.validate(user);
    if (error) return res.status(400).json(error.details);

    // Checks if the email the user has entered is already in use
    const emailInUse = (await ddbClient.get({TableName: process.env.AWS_DyanmoDB_Table, Key: { email: user.email, receiptDate: "profile" }}).promise())
    if (Object.keys(emailInUse).length == 1) return res.status(400).json("Email already exists.")

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    const params = {
        TableName: process.env.AWS_DyanmoDB_Table,
        Item: user,
    }

    // Add user to database
    const result = await ddbClient.put(params).promise();
    return res.json(result);

});

router.post("/login", async (req, res) => {
    // Validate email and password have been sent in request
    const schema = Joi.object({
        email: Joi.string()
            .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "org", "edu"] } })
            .required()
            .trim(),
        password: Joi.string().min(8).trim().required(),
    });
    const { error } = schema.validate({ email: req.body.email, password: req.body.password });
    if (error) return res.status(400).json(error.details);

    // Check if email exists in database and get user information
    const user = (await ddbClient.get({TableName: "ShopPal", Key: { email: req.body.email, receiptDate: "profile" }}).promise())
    if (Object.keys(user).length == 0) return res.status(400).json("Wrong email or password")

    
    // Check if password is correct
    const validPassword = await bcrypt.compare(req.body.password, user.Item.password);
    if (!validPassword) return res.status(400).json("Wrong email or password");

    // Remove password and receiptDate from user object
    delete user.Item.password;
    delete user.Item.receiptDate;

    res.status(200).json(user.Item);
});

// Change password
router.post("/changepassword", async (req, res) => {
    // Validate email and new password have been sent in request
    const schema = Joi.object({
        email: Joi.string()
            .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "org", "edu"] } })
            .required()
            .trim(),
        newPassword: Joi.string().min(8).trim().required()
    });
    const { error } = schema.validate({ email: req.body.email, newPassword: req.body.newPassword });
    if (error) return res.status(400).json(error.details);

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(req.body.newPassword, salt);

    // Set parameters for updating password
    const params = {
        TableName: "ShopPal",
        Key: {
          email: req.body.email,
          receiptDate: "profile",
        },
        UpdateExpression: "set password = :p",

        ExpressionAttributeValues: {
            ":p": newPasswordHash,
        },
        ReturnValues: "UPDATED_NEW",
    };

    // Update password
    const result = await ddbClient.update(params).promise();
    res.json(result);
});

module.exports = router;
