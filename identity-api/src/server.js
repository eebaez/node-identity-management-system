// modules
const http = require("node:http");
const authHandler = require("./handlers/auth");

// variables
const hostname = process.env.HOSTNAME || "localhost";
const port = process.env.PORT || 3000;

const server = http.createServer();

const gracefulShutdown = signal => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    
    server.close(() => {
        console.log("Server closed, exisiting process.");
        process.exit(0); // exit once all connections are closed
    });

    // closes all connections, ensuring the server closes successfully
    server.closeAllConnections();

    // force close if cleanup takes too long
    setTimeout(() => {
        console.error("Forcing shutdown after 10s timeout.");
        process.exit(1);
    }, 10000);
};

const parseRawBodyToJSON = (rawBody) => {
    let result = undefined;

    try {
        if(rawBody !== undefined && rawBody !== "") {
            result = JSON.parse(rawBody);
        }
    } catch (err) {
        console.error(err);
    }

    return result;
};

/*  Use Cases:
* - undefined endpoint e.g. /home -> return 404
* - POST /login without parameters -> return 400
* - POST /login with invalid data -> return 400
* - POST /login with bad-formatted data -> return 400
* - POST /login with valid params but invalid credentials -> return 401
* - POST /login with valid params and valid credentials -> return 200
*/
server.on("request", (request, response) =>{
    const { method, url } = request;
    console.log(`Request: ${method} ${url}`);

    // handle bad request
    request.on("error", err => {
        console.error(err);
        response.setHeader("Content-Type", "application/json");
        response.statusCode = 400;
        response.end();
    });

    response.on("error", err => {
        console.error(err);
    });

    request.on("close", () => {
        console.log(`Response: ${method} ${url} - statusCode:${response.statusCode}`);
    });

    // handle request
    if(url == "/login" && method === "POST") {
        let body = '';

        request.on("data", (chunk) => {
            body += chunk.toString(); // convert buffer to String
        });

        request.on("end", () => {
            body = parseRawBodyToJSON(body);

            if(body !== undefined && body !== "") {    
                const { username, password } = body;

                if(username === undefined || username == "" 
                    || password === undefined || password == "") {

                        response.setHeader("Content-Type", "application/json");
                        response.statusCode = 400;
                        response.end();
                    }
                else {

                    // User authentication
                    authHandler.userAuthentication(username, password).then((authResult) => {
                        if(authResult.authenticated) {
                            response.setHeader("Content-Type", "application/json");
                            response.statusCode = 200;
                            response.end();
                        } else {
                            response.setHeader("Content-Type", "application/json");
                            response.statusCode = 401;
                            response.end();
                        }
                    }).catch((err) => {
                        console.error(err);
                        response.setHeader("Content-Type", "application/json");
                        response.statusCode = 401;
                        response.end();
                    });
                }
            } else {
                response.setHeader("Content-Type", "application/json");
                response.statusCode = 400;
                response.end();
            }
        });

    } else {
        // handle invalid url
        response.setHeader("Content-Type", "application/json");
        response.statusCode = 404;
        response.end();
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

// list for termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
