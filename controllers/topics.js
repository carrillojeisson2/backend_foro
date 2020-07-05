"use strict";

var validator = require("validator");
var Topic = require("../models/topic");
const topic = require("../models/topic");

var controller = {
    test: function(req, res) {
        return res.status(200).send({
            message: "hola topic",
        });
    },

    save: function(req, res) {
        // Recoger parametros por post
        var params = req.body;

        // Validar datos
        try {
            var validate_title = !validator.isEmpty(params.title);
            var validate_content = !validator.isEmpty(params.content);
            var validate_lang = !validator.isEmpty(params.lang);
        } catch (err) {
            return res.status(200).send({
                message: "Faltan datos por enviar",
            });
        }

        if (validate_content && validate_title && validate_lang) {
            // Crear objeto a guardar
            var topic = new Topic();

            // Asignar valores
            topic.title = params.title;
            topic.content = params.content;
            topic.code = params.code;
            topic.lang = params.lang;
            topic.user = req.user.sub;

            // Guardar topic
            topic.save((err, topicStored) => {
                if (err || !topicStored) {
                    return res.status(404).send({
                        status: "error",
                        message: "El topic no se ha guardado",
                    });
                }
                // Devolver respuesta
                return res.status(200).send({
                    status: "success",
                    topic: topicStored,
                });
            });
        } else {
            return res.status(200).send({
                message: "Lps datos no son validos",
            });
        }
    },

    getTopics: function(req, res) {
        // Cargar la libreria de paginacion en la clase

        // Recoger la pagina actual
        if (!req.params.page ||
            req.params.page == 0 ||
            req.params.page == "0" ||
            req.params.page == null ||
            req.params.page == undefined
        ) {
            var page = 1;
        } else {
            var page = parseInt(req.params.page);
        }

        // Indicar las opciones de paginacion
        var options = {
            sort: { date: -1 },
            populate: "user",
            limit: 5,
            page: page,
        };

        // Find paginado
        Topic.paginate({}, options, (err, topics) => {
            if (err) {
                return res.status(500).send({
                    status: "error",
                    message: "Error al hacer consulta",
                });
            }

            if (!topics) {
                return res.status(404).send({
                    status: "error",
                    message: "No hay topics",
                });
            }
            // Devolver resultado (topics, total de topic, total de paginas)

            return res.status(200).send({
                status: "success",
                topics: topics.docs,
                totalDocs: topics.totalDocs,
                totalPages: topics.totalPages,
            });
        });
    },

    getTopicsByUser: function(req, res) {
        // Conseguir el id del usuario
        var userId = req.params.user;

        // Find con una condicion de usuario
        Topic.find({
                user: userId,
            })
            .sort([
                ["date", "descending"]
            ])
            .exec((err, topics) => {
                if (err) {
                    return res.status(500).send({
                        status: "error",
                        message: "error en la peticion",
                    });
                }

                if (!topics) {
                    return res.status(500).send({
                        status: "error",
                        message: "error no topics",
                    });
                }

                // Devolver resultado
                return res.status(200).send({
                    status: "success",
                    topics,
                });
            });
    },

    getTopic: function(req, res) {
        // Sacar el id del topic de la url
        var topicId = req.params.id;

        // Find por id del topic
        Topic.findById(topicId)
            .populate("user")
            .populate("comments.user")
            .exec((err, topic) => {
                if (err) {
                    return res.status(500).send({
                        status: "error",
                        message: "error en la peticion",
                    });
                }

                if (!topic) {
                    return res.status(404).send({
                        status: "error",
                        message: "no existe el tema",
                    });
                }

                return res.status(200).send({
                    status: "success",
                    topic,
                });
            });
    },

    update: function(req, res) {
        // Recoger el id del topic de la url
        var topicId = req.params.id;

        // Recoger los datos que llegan desde post
        var params = req.body;

        // Validar datos
        try {
            var validate_title = !validator.isEmpty(params.title);
            var validate_content = !validator.isEmpty(params.content);
            var validate_lang = !validator.isEmpty(params.lang);
        } catch (err) {
            return res.status(200).send({
                message: "Faltan datos por enviar",
            });
        }

        if (validate_title && validate_content && validate_lang) {
            // Mostrar un json con los datos modificables
            var update = {
                title: params.title,
                content: params.content,
                code: params.code,
                lang: params.lang,
            };

            // Find and update del topic por id y por id del usuario
            Topic.findOneAndUpdate({ _id: topicId, user: req.user.sub },
                update, { new: true },
                (err, topicUpdated) => {
                    if (err) {
                        return res.status(500).send({
                            estatus: "error",
                            message: "error en la peticion",
                        });
                    }

                    if (!topicUpdated) {
                        return res.status(404).send({
                            estatus: "error",
                            message: "no se ha actualizado el tema",
                        });
                    }

                    // Devolver respuesta
                    return res.status(200).send({
                        status: "success",
                        topic: topicUpdated,
                    });
                }
            );
        } else {
            // Devolver respuesta
            return res.status(200).send({
                status: "error",
                message: "error validacion datos",
            });
        }
    },

    delete: function(req, res) {
        // Sacar el id del topic de la url
        var topicId = req.params.id;

        // Find and delete por topicID y por su userID
        Topic.findOneAndDelete({ _id: topicId, user: req.user.sub },
            (err, topicRemoved) => {
                if (err) {
                    return res.status(500).send({
                        estatus: "error",
                        message: "error en la peticion",
                    });
                }

                if (!topicRemoved) {
                    return res.status(404).send({
                        estatus: "error",
                        message: "no se ha borrado el tema",
                    });
                }

                return res.status(200).send({
                    status: "success",
                    topic: topicRemoved,
                });
            }
        );
    },

    search: function(req, res) {
        // Sacar string a buscar de la url
        var searchString = req.params.search;

        // Find or
        topic
            .find({
                $or: [
                    { title: { $regex: searchString, $options: "i" } },
                    { content: { $regex: searchString, $options: "i" } },
                    { code: { $regex: searchString, $options: "i" } },
                    { lang: { $regex: searchString, $options: "i" } },
                ],
            })
            .populate("user")
            .sort([
                ["date", "descending"]
            ])
            .exec((err, topics) => {
                if (err) {
                    return res.status(500).send({
                        status: "error",
                        message: "Error en la peticion",
                    });
                }

                if (!topics) {
                    return res.status(404).send({
                        status: "error",
                        message: "Error en la peticion",
                    });
                }

                return res.status(200).send({
                    status: "success",
                    topics,
                });
            });
    },
};

module.exports = controller;