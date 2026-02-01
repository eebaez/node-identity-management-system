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

const writeResponse = (response, method, url, statusCode) => {
    response.setHeader("Content-Type", "application/json");
    response.statusCode = statusCode;
    response.end();

    console.log(`Response: ${method} ${url} - statusCode:${statusCode}`);    
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
        writeResponse(response, method, url, 400);
    });

    response.on("error", err => {
        console.error(err);
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
                        writeResponse(response, method, url, 400);
                    }
                else {

                    // User authentication
                    authHandler.userAuthentication(username, password).then((authResult) => {
                        if(authResult.authenticated) {
                            writeResponse(response, method, url, 200);
                        } else {
                            writeResponse(response, method, url, 401);
                        }
                    }).catch((err) => {
                        console.error(err);
                        writeResponse(response, method, url, 401);
                    });
                }
            } else {
                writeResponse(response, method, url, 400);
            }
        });

    } else {
        // handle invalid url
        writeResponse(response, method, url, 404);
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

// list for termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
