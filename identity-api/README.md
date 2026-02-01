# Node: Identity API

Handles HTTP request on port 3000 for user authentication

## Technologies
- Developed using NodeJS v24
- Using npm v11 for package handling
- Using argon2 for password hashing
- Usign Docker to build image and run as docker container

## Diagram

```mermaid
    architecture-beta
    group mygroup(cloud) [Environment]

    service rest-api(server) [Identity API] in mygroup
    service my-db(database) [Database] in mygroup

    rest-api:R <--> L:my-db
```

## How-to: Run

Http server will listen for requests here:
```
http://localhost:3000/
```

### Local
```
npm run start
```

### Docker
Build docker image with a predefined name "identity-api"
```
npm run docker-build
```

Run image as a docker container
```
npm run docker-run
```

Stop container and removes it from local registry
```
npm run docker-destroy
```