const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const Joi = require('joi');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 8081;
const accessId = "3b060115-3b91-4783-a34d-bbfddfeb1883";

const verifyNewArticleSchema = Joi.object({
    title: Joi.string().required().min(1).invalid("new"),
    content: Joi.string().required().allow(""),
    createdAt: Joi.date().required()
})

const verifyArticleSchema = Joi.object({
    title: Joi.string().required().min(1).invalid("new"),
    content: Joi.string().required().allow(""),
    id: Joi.string().required()
}).unknown(true)

const verifyNewSchoolSchema = Joi.object({
    name: Joi.string().required().allow(""),
    address: Joi.string().required().allow(""),
    contactPerson: Joi.string().required().allow(""),
    website: Joi.string().required().allow(""),
    description: Joi.string().required().allow(""),
    xCord: Joi.number().required(),
    yCord: Joi.number().required(),
    logoLink: Joi.string().required().allow("")
}).unknown(true)

const verifySchoolSchema = Joi.object({
    name: Joi.string().required().allow(""),
    address: Joi.string().required().allow(""),
    contactPerson: Joi.string().required().allow(""),
    website: Joi.string().required().allow(""),
    description: Joi.string().required().allow(""),
    xCord: Joi.number().required(),
    yCord: Joi.number().required(),
    id: Joi.string().required(),
    logoLink: Joi.string().required().allow("")
}).unknown(true)

const verifyJoinUsSchema = Joi.object({
    schoolName: Joi.string().required(),
    studentsContact: Joi.array().items(Joi.string().email({ tlds: { allow: false } })).length(3).required(),
    schoolDescription: Joi.string().required(),
    reason: Joi.string().required(),
    mail: Joi.string().email().required(),
}).unknown(true)

const transporter = nodemailer.createTransport({
    host: 'taylor.mxrouting.net', // Replace with your mail server host
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'hello@ranajakub.com', // your email address
        pass: process.env.EMAIL_PASSWORD_RANAJAKUB // your email password
    }
});

function verifyAdmin(req, res, next) {
    const id = req.headers["x-user-id"];
    if (!id) return res.status(400).json({ message: "No user id provided" });
    if (id != accessId) return res.status(403).json({ message: "Not authorized" });
    next();
}

app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.use((req, res, next) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https' || req.headers.host === `localhost:${port}`) {
        // Request was via https, so do no special handling
        next();
    } else {
        // Request was via http, so redirect to https
        res.redirect(`https://${req.headers.host}${req.url}`);
    }
});

// POST /verify
app.post("/verify", async (req, res) => {
    if (!req.body || !req.body.password || req.body.password != "Danejsoukradez") return res.status(400).json({ message: "Wrong password" });
    res.status(200).json({ id: accessId, message: "OK" });
})

// GET /article
app.get("/article", async (req, res) => {
    let articles;
    try {
        articles = await prisma.usi_article.findMany({ orderBy: { createdAt: 'desc' } });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
    res.status(200).json(articles);
})

// POST /article
app.post("/article", verifyAdmin, async (req, res) => {
    const { error } = verifyNewArticleSchema.validate(req.body.article);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const article = req.body.article;

    let newArticle;
    try {
        newArticle = await prisma.usi_article.create({ data: { title: article.title, content: article.content, createdAt: article.createdAt } });
    } catch (error) {
        console.log(error);
        if (error.code === "P2002") {
            return res.status(400).json({ message: "Article with this title already exists" });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
    res.status(200).json({ message: "OK", id: newArticle.id, article: newArticle });
})

// PUT /article/:id
app.put("/article/:id", verifyAdmin, async (req, res) => {
    const { error } = verifyArticleSchema.validate(req.body.article);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const article = req.body.article;

    let updatedArticle;
    try {
        updatedArticle = await prisma.usi_article.update({ where: { id: article.id }, data: { title: article.title, content: article.content, createdAt: article.createdAt } });
    } catch (error) {
        console.log(error);
        if (error.code === "P2002") {
            return res.status(400).json({ message: "Article with this title already exists" });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
    res.status(200).json({ message: "OK", article: updatedArticle });
})

// DELETE /article/:id
app.delete("/article/:id", verifyAdmin, async (req, res) => {
    const id = req.params.id;
    try {
        await prisma.usi_article.delete({ where: { id: id } });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
    res.status(200).json({ message: "OK" });
})

// GET /article/:id
// this endpoint is not even used, loading all articles takes so little data space that there is no reason to not do that
app.get("/article/:id", async (req, res) => {
    const id = req.params.id;
    let article;
    try {
        article = await prisma.usi_article.findUnique({ where: { id: id } });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
    if (!article) return res.status(404).json({ message: "Article not found" });
    res.status(200).json(article);
})

// GET /school
app.get("/school", async (req, res) => {
    let schools;
    try {
        schools = await prisma.usi_school.findMany();
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
    res.status(200).json(schools);
})

// POST /school
app.post("/school", verifyAdmin, async (req, res) => {
    const { error } = verifyNewSchoolSchema.validate(req.body.school);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const school = req.body.school;

    let newSchool;
    try {
        newSchool = await prisma.usi_school.create({ data: { name: school.name, address: school.address, contactPerson: school.contactPerson, website: school.website, description: school.description, xCord: school.xCord, yCord: school.yCord, logoLink: school.logoLink } });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
    res.status(200).json({ message: "OK", id: newSchool.id, school: newSchool });
})

// PUT /school/:id
app.put("/school/:id", verifyAdmin, async (req, res) => {
    const { error } = verifySchoolSchema.validate(req.body.school);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const school = req.body.school;

    let updatedSchool;
    try {
        updatedSchool = await prisma.usi_school.update({
            where: { id: school.id }, data:
            {
                name: school.name,
                address: school.address,
                contactPerson: school.contactPerson,
                website: school.website,
                description: school.description,
                xCord: school.xCord,
                yCord: school.yCord,
                logoLink: school.logoLink
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
    res.status(200).json({ message: "OK", school: updatedSchool });
})

// DELETE /school/:id
app.delete("/school/:id", verifyAdmin, async (req, res) => {
    const id = req.params.id;
    try {
        await prisma.usi_school.delete({ where: { id: id } });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
    res.status(200).json({ message: "OK" });
})

app.post("/image", verifyAdmin, async (req, res) => {
    const image = req.body.image;
    if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
        return res.status(400).json({ message: "Invalid image format" });
    }

    const base64Data = image.split(',')[1]; // Extract base64 part
    let newImage;
    try {
        newImage = await prisma.usi_image.create({ data: { data: base64Data } });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
    res.status(200).json({ message: "OK", id: newImage.id });
});

app.get("/image/:id", async (req, res) => {
    const id = req.params.id;
    let image;
    try {
        image = await prisma.usi_image.findUnique({ where: { id: id } });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
    if (!image) return res.status(404).json({ message: "Image not found" });

    const imgBuffer = Buffer.from(image.data, 'base64');
    if (imgBuffer.toString().startsWith("<svg")) {
        res.setHeader('Content-Type', 'image/svg+xml');
    } else {
        res.setHeader('Content-Type', 'image/jpeg');
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(imgBuffer);
})

app.get("/image", async (req, res) => {
    let images;
    try {
        images = await prisma.usi_image.findMany({
            select: {
                id: true,
                createdAt: true
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
    res.status(200).json({ message: "OK", images: images });
})

app.delete("/image/:id", verifyAdmin, async (req, res) => {
    const id = req.params.id;
    try {
        await prisma.usi_image.delete({ where: { id: id } });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
    res.status(200).json({ message: "OK" });
})

app.post("/joinus", async (req, res) => {
    const { error } = verifyJoinUsSchema.validate(req.body.formData);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const joinUs = req.body.formData;


    try {
        transporter.sendMail({
            from: "hello@ranajakub.com",
            to: "hello@ranajakub.com",
            subject: "Nová žádost o připojení školy do UŠI",
            text: `Název školy: ${joinUs.schoolName}
Kontakt na tři aktivní studenty:
1. ${joinUs.studentsContact[0]}
2. ${joinUs.studentsContact[1]}
3. ${joinUs.studentsContact[2]}
Popis školy:
        ${joinUs.schoolDescription}
Důvod:
        ${joinUs.reason}
E-mail na školu: ${joinUs.mail}`
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }

    res.status(200).json({ message: "OK" });
})

app.use(express.static(path.join(__dirname, '.', 'web')));

// Handle SPA (Single Page Application) by redirecting all requests to 'index.html'
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '.', 'web/index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});