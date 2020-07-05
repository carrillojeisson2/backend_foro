"use strict";

var validator = require("validator");

var Topic = require("../models/topic");
// const { default: validator } = require("validator");

var controller = {
    add: function(req, res) {
        // Recoger el id del topic de la url
        var topicId = req.params.topicId;

        // Find por id del topic
        Topic.findById(topicId).exec((err, topic) => {
            if (err) {
                return res.status(500).send({
                    status: "error",
                    message: "Error en la peticion",
                });
            }

            if (!topic) {
                return res.status(404).send({
                    status: "error",
                    message: "No existe el tema",
                });
            }
            // Comprobar objeto usuario y validar datos
            if (req.body.content) {
                // Validar datos
                try {
                    var validate_content = !validator.isEmpty(req.body.content);
                } catch (err) {
                    return res.status(200).send({
                        message: "no has comentado nada",
                    });
                }

                if (validate_content) {
                    var comment = {
                        user: req.user.sub,
                        content: req.body.content,
                    };
                    // En la propiedad comments del objeto resultante hacer un push
                    topic.comments.push(comment);

                    // Guardar topic completo
                    topic.save((err) => {
                        if (err) {
                            return res.status(500).send({
                                status: "error",
                                message: "Error al guardar el comentario",
                            });
                        }

                        Topic.findById(topic._id)
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
                    });
                } else {
                    return res.status(200).send({
                        message: "no has validado los datos del comentario",
                    });
                }
            }
        });
    },

    update: function(req, res) {
        // Conseguir id de comentario que llega de la url
        var commentId = req.params.commentId;

        // Recoger datos y validar
        var params = req.body;

        // Validar datos
        try {
            var validate_content = !validator.isEmpty(params.content);
        } catch (err) {
            return res.status(200).send({
                message: "no has comentado nada",
            });
        }

        if (validate_content) {
            // Find and update de subdocumento
            Topic.findOneAndUpdate({ "comments._id": commentId }, {
                    $set: {
                        "comments.$.content": params.content,
                    },
                }, { new: true },
                (err, topicUpdated) => {
                    if (err) {
                        return res.status(500).send({
                            status: "error",
                            message: "Error en la peticion",
                        });
                    }

                    if (!topicUpdated) {
                        return res.status(404).send({
                            status: "error",
                            message: "No existe el tema",
                        });
                    }

                    // Devolver datos
                    return res.status(200).send({
                        status: "success",
                        topic: topicUpdated,
                    });
                }
            );
        }
    },

    delete: function(req, res) {
        // Sacar el comentario a borrar
        var topicId = req.params.topicId;
        var commentId = req.params.commentId;

        // Buscar el topic
        Topic.findById(topicId, (err, topic) => {
            if (err) {
                return res.status(500).send({
                    status: "error",
                    message: "Error en la peticion",
                });
            }

            if (!topic) {
                return res.status(404).send({
                    status: "error",
                    message: "No existe el tema",
                });
            }

            // Seleccionar el subdocumento (comentario)
            var comment = topic.comments.id(commentId);

            // Borrar el comentario
            if (topic) {
                comment.remove();

                // Guardar el topic
                topic.save((err) => {
                    if (err) {
                        return res.status(500).send({
                            status: "error",
                            message: "Error en la peticion",
                        });
                    }

                    Topic.findById(topic._id)
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
                });
            } else {
                return res.status(404).send({
                    status: "error",
                    message: "No existe el commentario",
                });
            }
        });
    },

    search: function(req, res) {
        // Sacar string a buscar de la url
        var searchString = req.params.search;

        // Find for
        Topic.find({
                $or: [
                    { title: { $regex: searchString, $options: "i" } },
                    { content: { $regex: searchString, $options: "i" } },
                    { code: { $regex: searchString, $options: "i" } },
                    { lang: { $regex: searchString, $options: "i" } },
                ],
            })
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
                        message: "no hay temas",
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