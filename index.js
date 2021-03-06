"use strict";

var mongoose = require("mongoose");
var app = require("./app");
var port = process.env.PORT || 3999;

mongoose.set("useFindAndModify", false);
mongoose.Promise = global.Promise;
mongoose
    .connect("mongodb://localhost:27017/api_rest_node", { useNewUrlParser: true })
    .then(() => {
        console.log("Conexion ok");

        // Crear el servidor
        app.listen(port, () => {
            console.log("El servidor funcionando en el puerto: " + port);
        });
    })
    .catch((error) => console.log(error));